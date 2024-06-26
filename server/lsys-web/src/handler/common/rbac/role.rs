use std::{convert::TryFrom, sync::Arc};

use crate::{
    dao::RequestDao,
    handler::access::{
        relation_tpls, AccessRoleEdit, AccessRoleView, AccessRoleViewList, RoleOpCheck,
    },
    {
        PageParam, {JsonData, JsonResult},
    },
};

use lsys_core::fluent_message;
use lsys_rbac::{
    dao::{RbacDao, RbacRole, RoleAddUser, RoleParam, RoleSetOp, RoleUserGroupParam},
    model::{
        RbacResModel, RbacResOpModel, RbacRoleModel, RbacRoleOpModel, RbacRoleOpPositivity,
        RbacRoleResOpRange, RbacRoleUserModel, RbacRoleUserRange, RbacTagsModel,
    },
};
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::Transaction;
use sqlx_model::SqlQuote;
use sqlx_model::{sql_format, Select};
use serde_json::Value;
#[derive(Debug, Deserialize)]
pub struct RoleUserParam {
    user_id: u64,
    timeout: u64,
}

impl From<RoleUserParam> for RoleAddUser {
    fn from(p: RoleUserParam) -> Self {
        RoleAddUser {
            user_id: p.user_id,
            timeout: p.timeout,
        }
    }
}

#[derive(Debug, Deserialize, Clone)]
pub struct RoleOpParam {
    op_id: u64,
    op_positivity: i8,
}

#[derive(Debug, Deserialize)]
pub struct RoleAddParam {
    pub user_id: Option<u64>,
    pub name: String,
    pub user_range: i8,
    pub role_op_range: i8,
    pub priority: i8,
    pub relation_key: String,
    pub role_ops: Option<Vec<RoleOpParam>>,
    pub role_user: Option<Vec<RoleUserParam>>,
    pub tags: Option<Vec<String>>,
}
async fn rbac_role_get_res_check(
    req_dao: &RequestDao,
    role_ops: &Option<Vec<RoleOpParam>>,
    res_ops_opt: &Option<Vec<(RbacResModel, RbacResOpModel)>>,
) -> JsonResult<Option<Vec<RoleOpCheck>>> {
    if let Some(rop) = role_ops {
        if let Some(role_ops) = res_ops_opt {
            for tmp in rop {
                if !role_ops.iter().any(|e| e.1.id == tmp.op_id) {
                    return Err(
                        req_dao
                            .fluent_json_data(fluent_message!("rbac-bad-res-op",{
                                "op_id":tmp.op_id
                            }))
                            .set_sub_code("not_find_res_op"), // JsonData::message(format!("not find op id:{}", tmp.op_id))
                    );
                }
            }
            let res_tmp = role_ops
                .iter()
                .map(|e| RoleOpCheck {
                    op_id: e.1.id,
                    op_user_id: e.0.user_id,
                })
                .collect::<Vec<RoleOpCheck>>();
            return Ok(Some(res_tmp));
        }
    }
    Ok(None)
}
//转换为设置参数
fn rbac_role_op_to_op_set(
    role_ops: &Option<Vec<RoleOpParam>>,
    res_ops_opt: &Option<Vec<(RbacResModel, RbacResOpModel)>>,
    req_dao: &RequestDao,
) -> JsonResult<Option<Vec<RoleSetOp>>> {
    if let Some(rop) = role_ops {
        if let Some(role_ops) = res_ops_opt {
            let mut sop: Vec<RoleSetOp> = vec![];
            for top in rop {
                if let Some(role_op) = role_ops.iter().find(|e| e.1.id == top.op_id) {
                    let mut find = false;

                    for ts in sop.iter_mut() {
                        if ts.res.id == role_op.0.id {
                            ts.res_op.push((
                                role_op.1.to_owned(),
                                RbacRoleOpPositivity::try_from(top.op_positivity)
                                    .map_err(|e| req_dao.fluent_json_data(e))?,
                            ));
                            find = true;
                            break;
                        }
                    }
                    if !find {
                        sop.push(RoleSetOp {
                            res: role_op.0.to_owned(),
                            res_op: vec![(
                                role_op.1.to_owned(),
                                RbacRoleOpPositivity::try_from(top.op_positivity)
                                    .map_err(|e| req_dao.fluent_json_data(e))?,
                            )],
                        });
                    }
                }
            }
            return Ok(Some(sop));
        }
    }
    Ok(None)
}

pub async fn rbac_role_add(
    param: RoleAddParam,
    rbac_dao: &RbacDao,
    user_id: u64,
    req_dao: &RequestDao,
) -> JsonResult<JsonData> {
    let env_data = Some(&req_dao.req_env);
    let see_user_id = param.user_id.unwrap_or(user_id);
    let res_ops = if let Some(ref rp) = param.role_ops {
        Some(
            rbac_dao
                .rbac
                .res
                .find_by_op_ids(&rp.iter().map(|e| e.op_id).collect::<Vec<u64>>())
                .await
                .map_err(|e| req_dao.fluent_json_data(e))?,
        )
    } else {
        None
    };
    let res_op_check = rbac_role_get_res_check(req_dao, &param.role_ops, &res_ops).await?;
    rbac_dao
        .rbac
        .check(
            &AccessRoleEdit {
                user_id,
                res_user_id: see_user_id,
                op_range: Some(param.role_op_range),
                op_param: res_op_check,
            },
            None,
        )
        .await
        .map_err(|e| req_dao.fluent_json_data(e))?;
    let dao = &rbac_dao.rbac.role;
    let mut transaction = rbac_dao
        .db
        .begin()
        .await
        .map_err(|e| req_dao.fluent_json_data(e))?;
    let user_range =
        RbacRoleUserRange::try_from(param.user_range).map_err(|e| req_dao.fluent_json_data(e))?;
    let res_op_range = RbacRoleResOpRange::try_from(param.role_op_range)
        .map_err(|e| req_dao.fluent_json_data(e))?;
    let id = if user_range == RbacRoleUserRange::Relation {
        match dao
            .add_relation_role(
                see_user_id,
                param.relation_key,
                param.name,
                res_op_range,
                param.priority,
                user_id,
                Some(&mut transaction),
                env_data,
            )
            .await
        {
            Ok(id) => id,
            Err(e) => {
                transaction
                    .rollback()
                    .await
                    .map_err(|e| req_dao.fluent_json_data(e))?;
                return Err(req_dao.fluent_json_data(e));
            }
        }
    } else {
        match dao
            .add_role(
                see_user_id,
                param.name,
                user_range,
                res_op_range,
                param.priority,
                user_id,
                Some(&mut transaction),
                env_data,
            )
            .await
        {
            Ok(id) => id,
            Err(e) => {
                transaction
                    .rollback()
                    .await
                    .map_err(|e| req_dao.fluent_json_data(e))?;
                return Err(req_dao.fluent_json_data(e));
            }
        }
    };

    let role = Select::type_new::<RbacRoleModel>()
        .fetch_one_by_where::<RbacRoleModel, _>(
            &sqlx_model::WhereOption::Where(sql_format!("id={}", id,)),
            &mut transaction,
        )
        .await
        .map_err(|e| req_dao.fluent_json_data(e))?;
    if let Some(user_data) = param.role_user {
        let user_vec = user_data
            .into_iter()
            .map(|e| e.into())
            .collect::<Vec<RoleAddUser>>();
        dao.role_add_user(&role, &user_vec, user_id, Some(&mut transaction), env_data)
            .await
            .map_err(|e| req_dao.fluent_json_data(e))?;
    }
    if let Err(e) = set_attr(
        dao,
        &role,
        param.tags,
        rbac_role_op_to_op_set(&param.role_ops, &res_ops, req_dao)?,
        user_id,
        &mut transaction,
        req_dao,
    )
    .await
    {
        transaction
            .rollback()
            .await
            .map_err(|e| req_dao.fluent_json_data(e))?;
        return Err(e);
    };
    transaction
        .commit()
        .await
        .map_err(|e| req_dao.fluent_json_data(e))?;
    Ok(JsonData::data(json!({ "id": id })))
}

#[derive(Debug, Deserialize)]
pub struct RoleEditParam {
    pub role_id: u64,
    pub name: Option<String>,
    pub user_range: Option<i8>,
    pub role_op_range: Option<i8>,
    pub priority: Option<i8>,
    pub relation_key: Option<String>,
    pub role_ops: Option<Vec<RoleOpParam>>,
    pub tags: Option<Vec<String>>,
}

pub async fn rbac_role_edit(
    param: RoleEditParam,
    rbac_dao: &RbacDao,
    user_id: u64,
    req_dao: &RequestDao,
) -> JsonResult<JsonData> {
    let dao = &rbac_dao.rbac.role;
    let role = dao
        .find_by_id(&param.role_id)
        .await
        .map_err(|e| req_dao.fluent_json_data(e))?;
    let res_ops = if let Some(ref rp) = param.role_ops {
        Some(
            rbac_dao
                .rbac
                .res
                .find_by_op_ids(&rp.iter().map(|e| e.op_id).collect::<Vec<u64>>())
                .await
                .map_err(|e| req_dao.fluent_json_data(e))?,
        )
    } else {
        None
    };
    let res_op_check = rbac_role_get_res_check(req_dao, &param.role_ops, &res_ops).await?;
    rbac_dao
        .rbac
        .check(
            &AccessRoleEdit {
                user_id,
                res_user_id: role.user_id,
                op_range: param.role_op_range,
                op_param: res_op_check,
            },
            None,
        )
        .await
        .map_err(|e| req_dao.fluent_json_data(e))?;
    let mut transaction = rbac_dao
        .db
        .begin()
        .await
        .map_err(|e| req_dao.fluent_json_data(e))?;
    let user_range = if let Some(e) = param.user_range {
        Some(RbacRoleUserRange::try_from(e).map_err(|e| req_dao.fluent_json_data(e))?)
    } else {
        None
    };
    let res_op_range = if let Some(e) = param.role_op_range {
        Some(RbacRoleResOpRange::try_from(e).map_err(|e| req_dao.fluent_json_data(e))?)
    } else {
        None
    };
    if RbacRoleUserRange::Relation.eq(role.user_range) {
        if let Err(e) = dao
            .edit_relation_role(
                &role,
                param.relation_key,
                param.name,
                param.priority,
                res_op_range,
                user_id,
                Some(&mut transaction),
                Some(&req_dao.req_env),
            )
            .await
        {
            transaction
                .rollback()
                .await
                .map_err(|e| req_dao.fluent_json_data(e))?;
            return Err(req_dao.fluent_json_data(e));
        };
    } else if let Err(e) = dao
        .edit_role(
            &role,
            param.name,
            param.priority,
            user_range,
            res_op_range,
            user_id,
            Some(&mut transaction),
            Some(&req_dao.req_env),
        )
        .await
    {
        transaction
            .rollback()
            .await
            .map_err(|e| req_dao.fluent_json_data(e))?;
        return Err(req_dao.fluent_json_data(e));
    }
    let role = Select::type_new::<RbacRoleModel>()
        .reload(&role, &mut transaction)
        .await
        .map_err(|e| req_dao.fluent_json_data(e))?;
    if let Err(e) = set_attr(
        dao,
        &role,
        param.tags,
        rbac_role_op_to_op_set(&param.role_ops, &res_ops, req_dao)?,
        user_id,
        &mut transaction,
        req_dao,
    )
    .await
    {
        transaction
            .rollback()
            .await
            .map_err(|e| req_dao.fluent_json_data(e))?;
        return Err(e);
    };
    transaction
        .commit()
        .await
        .map_err(|e| req_dao.fluent_json_data(e))?;
    Ok(JsonData::default())
}

async fn set_attr<'t>(
    dao: &Arc<RbacRole>,
    role: &RbacRoleModel,
    tags: Option<Vec<String>>,
    role_op_vec: Option<Vec<RoleSetOp>>,
    change_user_id: u64,
    transaction: &mut Transaction<'t, sqlx::MySql>,
    req_dao: &RequestDao,
) -> JsonResult<()> {
    if let Some(op_vec) = role_op_vec {
        dao.role_set_ops(
            role,
            &op_vec,
            change_user_id,
            Some(transaction),
            Some(&req_dao.req_env),
        )
        .await
        .map_err(|e| req_dao.fluent_json_data(e))?;
    }

    if let Some(ref tmp) = tags {
        dao.role_set_tags(
            role,
            tmp,
            change_user_id,
            Some(transaction),
            Some(&req_dao.req_env),
        )
        .await
        .map_err(|e| req_dao.fluent_json_data(e))?
    }
    Ok(())
}

#[derive(Debug, Deserialize)]
pub struct RoleListUserParam {
    pub count_num: Option<bool>,
    pub role_id: Vec<u64>,
    pub user_id: Option<Vec<u64>>,
    pub page: Option<PageParam>,
}
pub async fn rbac_role_list_user(
    param: RoleListUserParam,
    rbac_dao: &RbacDao,
    user_id: u64,
    req_dao: &RequestDao,
) -> JsonResult<JsonData> {
    let dao = &rbac_dao.rbac.role;
    let role = dao
        .find_by_ids(&param.role_id)
        .await
        .map_err(|e| req_dao.fluent_json_data(e))?;
    let user_ids = role.values().map(|e| e.user_id).collect::<Vec<u64>>();
    if !user_ids.is_empty() {
        rbac_dao
            .rbac
            .check(
                &AccessRoleViewList {
                    user_id,
                    res_user_ids: user_ids,
                },
                None,
            )
            .await
            .map_err(|e| req_dao.fluent_json_data(e))?;
    }
    let rid = role.keys().map(|e| e.to_owned()).collect::<Vec<u64>>();
    let data = dao
        .role_get_users(
            &rid,
            &param.user_id,
            &Some(param.page.unwrap_or_default().into()),
        )
        .await
        .map_err(|e| req_dao.fluent_json_data(e))?;
    let total = if param.count_num.unwrap_or(false) {
        Some(
            dao.role_get_user_count(&rid, &param.user_id)
                .await
                .map_err(|e| req_dao.fluent_json_data(e))?,
        )
    } else {
        None
    };

    Ok(JsonData::data(json!({ "data": data,"total":total })))
}
#[derive(Debug, Deserialize)]
pub struct RoleAddUserParam {
    pub role_id: u64,
    pub user_vec: Vec<RoleUserParam>,
}
pub async fn rbac_role_add_user(
    param: RoleAddUserParam,
    rbac_dao: &RbacDao,
    user_id: u64,
    req_dao: &RequestDao,
) -> JsonResult<JsonData> {
    let dao = &rbac_dao.rbac.role;
    let role = dao
        .find_by_id(&param.role_id)
        .await
        .map_err(|e| req_dao.fluent_json_data(e))?;
    rbac_dao
        .rbac
        .check(
            &AccessRoleEdit {
                user_id,
                res_user_id: role.user_id,
                op_range: None,
                op_param: None,
            },
            None,
        )
        .await
        .map_err(|e| req_dao.fluent_json_data(e))?;
    let user_vec = param
        .user_vec
        .into_iter()
        .map(|e| e.into())
        .collect::<Vec<RoleAddUser>>();
    dao.role_add_user(&role, &user_vec, user_id, None, Some(&req_dao.req_env))
        .await
        .map_err(|e| req_dao.fluent_json_data(e))?;
    Ok(JsonData::default())
}

#[derive(Debug, Deserialize)]
pub struct RoleDeleteUserParam {
    pub role_id: u64,
    pub user_vec: Vec<u64>,
}
pub async fn rbac_role_delete_user(
    param: RoleDeleteUserParam,
    rbac_dao: &RbacDao,
    user_id: u64,
    req_dao: &RequestDao,
) -> JsonResult<JsonData> {
    let dao = &rbac_dao.rbac.role;
    let role = dao
        .find_by_id(&param.role_id)
        .await
        .map_err(|e| req_dao.fluent_json_data(e))?;
    rbac_dao
        .rbac
        .check(
            &AccessRoleEdit {
                user_id,
                res_user_id: role.user_id,
                op_range: None,
                op_param: None,
            },
            None,
        )
        .await
        .map_err(|e| req_dao.fluent_json_data(e))?;
    dao.role_del_user(
        &role,
        &param.user_vec,
        user_id,
        None,
        Some(&req_dao.req_env),
    )
    .await
    .map_err(|e| req_dao.fluent_json_data(e))?;
    Ok(JsonData::default())
}

#[derive(Debug, Deserialize)]
pub struct RoleDeleteParam {
    pub role_id: u64,
}
pub async fn rbac_role_delete(
    param: RoleDeleteParam,
    rbac_dao: &RbacDao,
    user_id: u64,
    req_dao: &RequestDao,
) -> JsonResult<JsonData> {
    let dao = &rbac_dao.rbac.role;
    let role = dao
        .find_by_id(&param.role_id)
        .await
        .map_err(|e| req_dao.fluent_json_data(e))?;
    rbac_dao
        .rbac
        .check(
            &AccessRoleEdit {
                user_id,
                res_user_id: role.user_id,
                op_range: None,
                op_param: None,
            },
            None,
        )
        .await
        .map_err(|e| req_dao.fluent_json_data(e))?;
    dao.del_role(&role, user_id, None, Some(&req_dao.req_env))
        .await
        .map_err(|e| req_dao.fluent_json_data(e))?;
    Ok(JsonData::default())
}

#[derive(Debug, Deserialize)]
pub struct RoleListDataParam {
    pub count_num: Option<bool>,
    pub user_id: Option<u64>,
    pub role_name: Option<String>,
    pub relation_prefix: Option<String>,
    pub user_range: Option<Vec<i8>>,
    pub res_range: Option<Vec<i8>>,
    pub role_id: Option<Vec<u64>>,
    pub tags_filter: Option<Vec<String>>,
    pub tags: Option<bool>,
    pub ops: Option<u8>, //0 不获取操作数据 1 只获取操作关系 2 获取操作关系及资源详细
    pub page: Option<PageParam>, //角色分页数据
    pub user_data: Option<bool>, //是否获取角色关联用户数据
    pub user_data_page: Option<PageParam>, //获取关联用户数据分页
    pub user_data_group: Option<u8>,
}

#[derive(Debug, Serialize)]
pub struct RoleDataOps {
    role_op: RbacRoleOpModel,
    res_op: Option<RbacResOpModel>,
    res: Option<RbacResModel>,
}

#[derive(Debug, Serialize)]
pub struct RoleData {
    role: RbacRoleModel,
    users: Option<Vec<RbacRoleUserModel>>,
    users_group: Option<i64>,
    tags: Option<Vec<RbacTagsModel>>,
    ops: Option<Vec<RoleDataOps>>,
}
pub async fn rbac_role_list_data(
    param: RoleListDataParam,
    rbac_dao: &RbacDao,
    user_id: u64,
    req_dao: &RequestDao,
) -> JsonResult<JsonData> {
    let see_user_id = param.user_id.unwrap_or(user_id);

    rbac_dao
        .rbac
        .check(
            &AccessRoleView {
                user_id,
                res_user_id: see_user_id,
            },
            None,
        )
        .await
        .map_err(|e| req_dao.fluent_json_data(e))?;
    let dao = &rbac_dao.rbac.data;

    let user_data_group = match param.user_data_group.unwrap_or(0) {
        1 => RoleUserGroupParam::Ok,
        2 => RoleUserGroupParam::All,
        _ => RoleUserGroupParam::None,
    };

    let res = dao
        .role_data(&RoleParam {
            user_id: see_user_id,
            user_range: &param.user_range,
            res_range: &param.res_range,
            role_name: &param.role_name,
            relation_prefix: &param.relation_prefix,
            role_id: &param.role_id,
            filter_tags: &param.tags_filter,
            out_ops: param.ops.map(|e| e > 0).unwrap_or(false),
            out_tags: param.tags.unwrap_or(false),
            out_user_data: param.user_data.unwrap_or(false),
            out_user_group: user_data_group,
            page: &Some(param.page.unwrap_or_default().into()),
            user_data_page: &param.user_data_page.map(|e| e.into()),
        })
        .await
        .map_err(|e| req_dao.fluent_json_data(e))?;
    let mut out = Vec::with_capacity(res.len());
    for e in res {
        let ops = match param.ops.unwrap_or(0) {
            1 => Some(
                e.2.into_iter()
                    .map(|tmp| RoleDataOps {
                        role_op: tmp,
                        res_op: None,
                        res: None,
                    })
                    .collect::<Vec<RoleDataOps>>(),
            ),
            2 => {
                let res_data = rbac_dao
                    .rbac
                    .res
                    .find_by_op_ids(&e.2.iter().map(|tmp| tmp.res_op_id).collect::<Vec<u64>>())
                    .await
                    .map_err(|e| req_dao.fluent_json_data(e))?;
                Some(
                    e.2.into_iter()
                        .map(|tmp| {
                            let dtmp = res_data.iter().find(|rtmp| rtmp.1.id == tmp.res_op_id);
                            RoleDataOps {
                                role_op: tmp,
                                res_op: dtmp.map(|e| e.1.to_owned()),
                                res: dtmp.map(|e| e.0.to_owned()),
                            }
                        })
                        .collect::<Vec<RoleDataOps>>(),
                )
            }
            _ => None,
        };
        out.push(RoleData {
            role: e.0,
            tags: if param.tags.unwrap_or(false) {
                Some(e.3)
            } else {
                None
            },
            ops,
            users: if param.user_data.unwrap_or(false) {
                Some(e.1)
            } else {
                None
            },
            users_group: e.4,
        });
    }
    let count = if param.count_num.unwrap_or(false) {
        Some(
            dao.role_count(
                see_user_id,
                &param.user_range,
                &param.res_range,
                &param.role_name,
                &param.role_id,
                &param.tags_filter,
            )
            .await
            .map_err(|e| req_dao.fluent_json_data(e))?,
        )
    } else {
        None
    };
    Ok(JsonData::data(json!({ "data": out,"total":count})))
}

#[derive(Debug, Deserialize)]
pub struct RoleTagsParam {
    pub user_id: Option<u64>,
}
pub async fn rbac_role_tags(
    param: RoleTagsParam,
    rbac_dao: &RbacDao,
    user_id: u64,
    req_dao: &RequestDao,
) -> JsonResult<JsonData> {
    let see_user_id = param.user_id.unwrap_or(user_id);

    rbac_dao
        .rbac
        .check(
            &AccessRoleView {
                user_id,
                res_user_id: see_user_id,
            },
            None,
        )
        .await
        .map_err(|e| req_dao.fluent_json_data(e))?;
    let out = rbac_dao
        .rbac
        .role
        .user_role_tags(see_user_id)
        .await
        .map_err(|e| req_dao.fluent_json_data(e))?.into_iter().map(|e|{
            json!({
                "name":e.0,
                "total":e.1,
            })
        }).collect::<Vec<Value>>();
    Ok(JsonData::data(json!({ "data": out })))
}

#[derive(Debug, Deserialize)]
pub struct RoleOptionsParam {
    pub user_id: Option<u64>,
    pub user_range: Option<bool>,
    pub res_range: Option<bool>,
    pub relation_tpl: Option<bool>,
    pub relation_find: Option<Vec<String>>,
}

#[derive(Debug, Serialize)]
struct OptionItem {
    key: i8,
    name: &'static str,
}

pub async fn rbac_user_role_options(
    param: RoleOptionsParam,
    rbac_dao: &RbacDao,
    user_id: u64,
    req_dao: &RequestDao,
) -> JsonResult<JsonData> {
    let see_user_id = param.user_id.unwrap_or(user_id);
    let user_range = if param.user_range.unwrap_or(false) {
        let user_range = vec![
            OptionItem {
                key: RbacRoleUserRange::AllUser as i8,
                name: "任意用户",
            },
            OptionItem {
                key: RbacRoleUserRange::Login as i8,
                name: "登陆用户",
            },
            OptionItem {
                key: RbacRoleUserRange::User as i8,
                name: "指定用户",
            },
            OptionItem {
                key: RbacRoleUserRange::Relation as i8,
                name: "指定关系",
            },
        ];
        Some(user_range)
    } else {
        None
    };
    let res_range = if param.user_range.unwrap_or(false) {
        let res_range = if see_user_id == 0 {
            let mut res_range = vec![OptionItem {
                key: RbacRoleResOpRange::AllowCustom as i8,
                name: "自定义配置访问资源",
            }];
            if rbac_dao
                .rbac
                .check(
                    &AccessRoleEdit {
                        user_id,
                        res_user_id: 0,
                        op_range: Some(RbacRoleResOpRange::AllowAll as i8),
                        op_param: None,
                    },
                    None,
                )
                .await
                .is_ok()
            {
                res_range.push(OptionItem {
                    key: RbacRoleResOpRange::AllowAll as i8,
                    name: "授权访问任何资源",
                });
            }
            if rbac_dao
                .rbac
                .check(
                    &AccessRoleEdit {
                        user_id,
                        res_user_id: 0,
                        op_range: Some(RbacRoleResOpRange::DenyAll as i8),
                        op_param: None,
                    },
                    None,
                )
                .await
                .is_ok()
            {
                res_range.push(OptionItem {
                    key: RbacRoleResOpRange::DenyAll as i8,
                    name: "禁止访问任何资源",
                });
            }
            res_range
        } else {
            vec![
                OptionItem {
                    key: RbacRoleResOpRange::AllowAll as i8,
                    name: "授权访问当前用户所有资源",
                },
                OptionItem {
                    key: RbacRoleResOpRange::DenyAll as i8,
                    name: "禁止访问当前用户所有资源",
                },
                OptionItem {
                    key: RbacRoleResOpRange::AllowCustom as i8,
                    name: "自定义配置访问资源",
                },
            ]
        };
        Some(res_range)
    } else {
        None
    };

    let relation_key = if let Some(ref key) = param.relation_find {
        let res = rbac_dao
            .rbac
            .role
            .find_enable_role_by_relation_keys(see_user_id, key)
            .await
            .map_err(|e| req_dao.fluent_json_data(e))?;
        Some(res)
    } else {
        None
    };
    let relation_tpl = if param.relation_tpl.unwrap_or(false) {
        Some(
            relation_tpls()
                .into_iter()
                .filter(|e| if see_user_id > 0 { e.user } else { !e.user })
                .map(|e| e.key)
                .collect::<Vec<_>>(),
        )
    } else {
        None
    };
    Ok(JsonData::data(json!({
        "user_range":user_range,
        "res_range":res_range,
        "relation_find":relation_key,
        "relation_tpl":relation_tpl
    })))
}

#[derive(Debug, Deserialize)]
pub struct RoleRelationDataParam {
    pub count_num: Option<bool>,
    pub user_id: Option<u64>,
    pub relation_prefix: Option<String>,
    pub page: Option<PageParam>,
}

pub async fn rbac_user_relation_data(
    param: RoleRelationDataParam,
    rbac_dao: &RbacDao,
    user_id: u64,
    req_dao: &RequestDao,
) -> JsonResult<JsonData> {
    let see_user_id = param.user_id.unwrap_or(user_id);
    rbac_dao
        .rbac
        .check(
            &AccessRoleView {
                user_id,
                res_user_id: see_user_id,
            },
            None,
        )
        .await
        .map_err(|e| req_dao.fluent_json_data(e))?;
    let data = rbac_dao
        .rbac
        .role
        .get_role_relation_data(
            &see_user_id,
            &param.relation_prefix,
            &Some(param.page.unwrap_or_default().into()),
        )
        .await
        .map_err(|e| req_dao.fluent_json_data(e))?;
    let total = if param.count_num.unwrap_or(false) {
        Some(
            rbac_dao
                .rbac
                .role
                .get_role_relation_count(&see_user_id, &param.relation_prefix)
                .await
                .map_err(|e| req_dao.fluent_json_data(e))?,
        )
    } else {
        None
    };
    Ok(JsonData::data(json!({
        "data":data,
        "total":total
    })))
}
