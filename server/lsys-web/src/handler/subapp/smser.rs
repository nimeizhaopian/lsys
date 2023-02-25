use crate::{dao::WebDao, JsonData, JsonResult};
use lsys_app::model::AppsModel;
use lsys_core::str_time;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct SmsSendParam {
    pub mobile: Vec<String>,
    pub tpl: String,
    pub data: String,
    pub cancel: Option<String>,
    pub send_time: Option<String>,
}
pub async fn sms_send(
    app_dao: &WebDao,
    app: &AppsModel,
    param: SmsSendParam,
) -> JsonResult<JsonData> {
    app_dao
        .user
        .rbac_dao
        .rbac
        .access
        .check(
            app.user_id,
            &[app_dao.app.app_relation_key(app).await],
            &res_data!(AppSenderDo),
        )
        .await?;
    let send_time = if let Some(t) = param.send_time {
        if t.is_empty() {
            None
        } else {
            Some(str_time(&t)?.timestamp() as u64)
        }
    } else {
        None
    };
    // 字符串转时间对象

    app_dao
        .smser
        .app_send(
            app,
            &param.tpl,
            &param.mobile,
            &param.data,
            send_time,
            &param.cancel,
        )
        .await?;
    Ok(JsonData::message("success"))
}

#[derive(Debug, Deserialize)]
pub struct SmsCancelParam {
    pub cancel: String,
}
pub async fn sms_cancel(
    app_dao: &WebDao,
    app: &AppsModel,
    param: SmsCancelParam,
) -> JsonResult<JsonData> {
    app_dao
        .user
        .rbac_dao
        .rbac
        .access
        .check(
            app.user_id,
            &[app_dao.app.app_relation_key(app).await],
            &res_data!(AppSenderDo),
        )
        .await?;
    app_dao.smser.app_send_cancel(app, &param.cancel).await?;
    Ok(JsonData::message("success"))
}