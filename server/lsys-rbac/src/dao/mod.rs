use std::sync::Arc;

pub mod rbac;

pub use self::rbac::*;

use lsys_core::{AppCoreError, RemoteNotify};

use lsys_logger::dao::ChangeLogger;
use sqlx::{MySql, Pool};

pub struct RbacDao {
    //内部依赖
    pub db: Pool<MySql>,
    //   pub redis: deadpool_redis::Pool,
    // 权限相关
    pub rbac: Arc<Rbac>,
}

impl RbacDao {
    pub async fn new(
        db: Pool<MySql>,
        remote_notify: Arc<RemoteNotify>,
        config:RbacConfig,
        logger: Arc<ChangeLogger>,
        system_role: Option<Box<dyn SystemRoleCheckData>>,
    ) -> Result<RbacDao, AppCoreError> {
        let rbac = Arc::from(Rbac::new(
            // fluents_message.clone(),
            db.clone(),
            system_role,
            remote_notify,
            config,
            logger,
        ));
        Ok(RbacDao {
            // fluent: fluents_message,
            rbac,
            db,
            // redis,
        })
    }
}
