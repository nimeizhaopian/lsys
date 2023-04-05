use lsys_app::model::AppsModel;
use lsys_rbac::dao::{
    AccessRes, RbacAccess, RbacCheck, RbacResTpl, ResTpl, RoleRelationKey, UserRbacResult,
};

use super::app_relation_key;

pub struct AccessSubAppView {
    pub app: AppsModel,
    pub see_app: AppsModel,
}
#[async_trait::async_trait]
impl RbacCheck for AccessSubAppView {
    async fn check<'t>(
        &self,
        access: &'t RbacAccess,
        _relation: &'t [RoleRelationKey],
    ) -> UserRbacResult<()> {
        access
            .list_check(
                self.app.user_id,
                &app_relation_key(&self.app).await,
                &[
                    vec![AccessRes::system(
                        //系统控制指定用户APP之间查看
                        &format!("global-app-{}", self.app.id),
                        &["view-app"],
                        &[],
                    )],
                    vec![AccessRes::user(
                        //用户控制用户APP之间查看
                        self.see_app.user_id,
                        &format!("app-{}", self.app.id),
                        &["view-app"],
                        &[],
                    )],
                ],
            )
            .await
    }
}

impl RbacResTpl for AccessSubAppView {
    fn tpl_data() -> Vec<ResTpl> {
        vec![
            ResTpl {
                tags: vec!["user"],
                user: true,
                key: "app-{appid}",
                ops: vec!["view-app"],
            },
            ResTpl {
                tags: vec!["system"],
                user: false,
                key: "global-app-{appid}",
                ops: vec!["view-app"],
            },
        ]
    }
}

pub struct AccessSubAppRbacCheck {
    pub app: AppsModel,
}
#[async_trait::async_trait]
impl RbacCheck for AccessSubAppRbacCheck {
    async fn check<'t>(
        &self,
        access: &'t RbacAccess,
        relation: &'t [RoleRelationKey],
    ) -> UserRbacResult<()> {
        access
            .check(
                self.app.user_id,
                relation,
                &[AccessRes::system(
                    //系统控制指定用户APP是否有校验权限功能
                    &format!("global-app-{}", self.app.id),
                    &["access-check"],
                    &[],
                )],
            )
            .await
    }
}

impl RbacResTpl for AccessSubAppRbacCheck {
    fn tpl_data() -> Vec<ResTpl> {
        vec![ResTpl {
            tags: vec!["system"],
            user: false,
            key: "global-app-{appid}",
            ops: vec!["access-check"],
        }]
    }
}