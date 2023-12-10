use area_db::AreaDao;
use ip2location::LocationDB;
use lsys_app::dao::AppDao;
use lsys_core::cache::{LocalCacheClear, LocalCacheClearItem};
use lsys_core::{AppCore, AppCoreError, RemoteNotify};
use lsys_docs::dao::{DocsDao, GitRemoteTask};
use lsys_logger::dao::ChangeLogger;
use lsys_notify::dao::Notify;
use lsys_rbac::dao::rbac::RbacLocalCacheClear;
use lsys_rbac::dao::{RbacDao, SystemRole};
use lsys_sender::dao::MessageTpls;
use lsys_setting::dao::Setting;
use lsys_user::dao::account::cache::UserAccountLocalCacheClear;
use lsys_user::dao::auth::{UserAuthConfig, UserAuthRedisStore};
use lsys_user::dao::UserDao;

use sqlx::{MySql, Pool};
use std::vec;
use std::{path::PathBuf, str::FromStr, sync::Arc};
use tera::Tera;
use tokio::sync::Mutex;
use tracing::{error, info, warn};

pub mod app;
mod captcha;
mod mailer;
mod request;
pub mod site_config;
mod smser;
pub mod user;
use self::app::WebApp;
use self::captcha::WebAppCaptcha;
use self::mailer::WebAppMailer;

pub use self::captcha::CaptchaKey;
pub use self::mailer::WebAppMailerError;
pub use self::request::*;
pub use self::site_config::*;
use self::smser::WebAppSmser;
pub use self::smser::WebAppSmserError;
use self::user::WebUser;

pub struct WebDao {
    pub user: Arc<WebUser>,
    pub docs: Arc<DocsDao>,
    pub app: Arc<WebApp>,
    pub captcha: Arc<WebAppCaptcha>,
    pub sender_mailer: Arc<WebAppMailer>,
    pub sender_smser: Arc<WebAppSmser>,
    pub sender_tpl: Arc<MessageTpls>,
    pub app_core: Arc<AppCore>,
    pub db: Pool<MySql>,
    pub redis: deadpool_redis::Pool,
    pub tera: Arc<Tera>,
    pub setting: Arc<Setting>,
    pub logger: Arc<ChangeLogger>,
    pub area: Option<Arc<AreaDao>>,
    pub notify: Arc<Notify>,
}

impl WebDao {
    pub async fn new(app_core: Arc<AppCore>) -> Result<WebDao, AppCoreError> {
        let db = app_core.create_db().await?;
        let tera_dir = app_core.app_dir.join("src/template");
        let tera_tpl = if tera_dir.exists() {
            String::from(tera_dir.to_string_lossy())
        } else {
            let cargo_dir = env!("CARGO_MANIFEST_DIR");
            let tpl_dir = format!("{}/src/template", cargo_dir);
            if !PathBuf::from_str(&tpl_dir)?.exists() {
                return Err(AppCoreError::AppDir(format!(
                    "not find tpl dir :{}",
                    tpl_dir
                )));
            }
            tpl_dir
        };
        let tera = Arc::new(app_core.create_tera(&tera_tpl)?);
        let redis = app_core.create_redis().await?;
        let remote_notify = Arc::new(RemoteNotify::new(
            "lsys-remote-notify",
            app_core.clone(),
            redis.clone(),
        )?);

        let change_logger = Arc::new(ChangeLogger::new(db.clone()));
        let setting = Arc::new(
            Setting::new(
                app_core.clone(),
                db.clone(),
                remote_notify.clone(),
                change_logger.clone(),
            )
            .await?,
        );

        let root_user_id = app_core
            .config
            .get_array("root_user_id")
            .unwrap_or_default()
            .iter()
            .filter_map(|e| e.to_owned().into_int().map(|e| e as u64).ok())
            .collect::<Vec<u64>>();
        let rbac_dao = Arc::new(
            RbacDao::new(
                app_core.clone(),
                db.clone(),
                remote_notify.clone(),
                change_logger.clone(),
                Some(Box::new(SystemRole::new(true, root_user_id))),
                app_core.config.get_bool("rbac_cache").unwrap_or(false),
            )
            .await?,
        );
        let login_store = UserAuthRedisStore::new(redis.clone());
        let mut login_config = UserAuthConfig::default();

        match app_core.get_config_path("ip_city_db") {
            Ok(ip_db_path) => match LocationDB::from_file(&ip_db_path) {
                Ok(city_db) => {
                    login_config.ip_db = Some(Mutex::new(ip2location::DB::LocationDb(city_db)));
                }
                Err(err) => {
                    warn!("read ip city db error[{}]:{:?}", ip_db_path.display(), err)
                }
            },
            Err(err) => {
                info!("ip city db not config:{}", err);
            }
        }

        let docs = Arc::new(
            DocsDao::new(
                app_core.clone(),
                db.clone(),
                remote_notify.clone(),
                change_logger.clone(),
                None,
            )
            .await,
        );
        // 文档后台同步任务
        let task_docs = docs.task.clone();
        tokio::spawn(async move {
            task_docs.dispatch().await;
        });

        let user_dao = Arc::new(
            UserDao::new(
                app_core.clone(),
                db.clone(),
                redis.clone(),
                setting.single.clone(),
                change_logger.clone(),
                remote_notify.clone(),
                login_store,
                Some(login_config),
            )
            .await?,
        );
        let app_dao = Arc::new(
            AppDao::new(
                user_dao.user_account.clone(),
                app_core.clone(),
                db.clone(),
                redis.clone(),
                remote_notify.clone(),
                change_logger.clone(),
                7 * 24 * 3600, //TOKEN有效期7天
            )
            .await?,
        );
        let apps = WebApp::new(app_dao).await;
        let mailer = Arc::new(WebAppMailer::new(
            app_core.clone(),
            user_dao.fluent.clone(),
            redis.clone(),
            db.clone(),
            setting.clone(),
            change_logger.clone(),
            None,
            300, //任务最大执行时间
            true,
        ));
        // 邮件发送任务
        let task_web_mailer = mailer.clone();
        tokio::spawn(async move {
            if let Err(err) = task_web_mailer.task().await {
                error!("mailer error:{}", err.to_string())
            }
        });

        let notify = Arc::new(Notify::new(
            redis.clone(),
            db.clone(),
            app_core.clone(),
            apps.app_dao.app.clone(),
            change_logger.clone(),
            None,
            None,
            None,
            true,
        ));

        //启动回调任务
        let notify_task = notify.clone();
        tokio::spawn(async move {
            if let Err(err) = notify_task.task().await {
                error!("smser sender error:{}", err.to_string())
            }
        });

        let web_smser = Arc::new(WebAppSmser::new(
            app_core.clone(),
            redis.clone(),
            db.clone(),
            user_dao.fluent.clone(),
            setting.clone(),
            change_logger.clone(),
            notify.clone(),
            None,
            None,
            300, //任务最大执行时间
            true,
        ));
        //启动短信发送任务
        let task_sender = web_smser.clone();
        tokio::spawn(async move {
            if let Err(err) = task_sender.task_sender().await {
                error!("smser sender error:{}", err.to_string())
            }
        });
        //启动短信状态查询任务
        let task_notify = web_smser.clone();
        tokio::spawn(async move {
            if let Err(err) = task_notify.task_status_query().await {
                error!("smser notify error:{}", err.to_string())
            }
        });
        let captcha = Arc::new(WebAppCaptcha::new(redis.clone()));

        let app_locale_dir = app_core.app_dir.join("locale/lsys-web");
        let fluents_message = Arc::new(if app_locale_dir.exists() {
            app_core.create_fluent(app_locale_dir).await?
        } else {
            let cargo_dir = env!("CARGO_MANIFEST_DIR");
            app_core
                .create_fluent(cargo_dir.to_owned() + "/locale")
                .await?
        });
        let sender_tpl = Arc::new(MessageTpls::new(
            db.clone(),
            fluents_message.clone(),
            change_logger.clone(),
        ));

        // 本地lua缓存清理 local cache
        let mut cache_item: Vec<Box<dyn LocalCacheClearItem + Sync + Send + 'static>> = vec![];
        for item in RbacLocalCacheClear::new_clears(&rbac_dao.rbac) {
            cache_item.push(Box::new(item))
        }
        for item in UserAccountLocalCacheClear::new_clears(&user_dao.user_account) {
            cache_item.push(Box::new(item))
        }
        let local_cache_clear = LocalCacheClear::new(cache_item);
        remote_notify.push_run(Box::new(local_cache_clear)).await;

        //git文档 远程同步任务
        remote_notify
            .push_run(Box::new(GitRemoteTask::new(docs.task.clone())))
            .await;
        //远程任务后台任务
        tokio::spawn(async move {
            //listen redis notify
            remote_notify.listen().await;
        });

        //行政区域地址库数据初始化
        let mut area = None;
        match app_core.get_config_path("area_code_db") {
            Ok(code_path) => {
                match area_db::CsvAreaCodeData::from_inner_path(code_path.clone(), true) {
                    Ok(tmp) => {
                        let data = area_db::CsvAreaData::new(tmp, None);
                        let area_index_dir = app_core
                            .get_config_path("area_index_dir")
                            .unwrap_or_else(|_| {
                                let mut index_dir = std::env::temp_dir();
                                index_dir.push("lsys_area_cache");
                                index_dir
                            });
                        let area_index_size = app_core
                            .config
                            .get_int("area_index_size")
                            .map(|e| e.abs() as usize)
                            .ok();
                        let area_store =
                            area_db::AreaStoreDisk::new(area_index_dir, area_index_size)
                                .map_err(|e| AppCoreError::System(e.to_string()))?;
                        area = Some(Arc::new(
                            AreaDao::from_csv_disk(data, area_store)
                                .map_err(|e| AppCoreError::System(e.to_string()))?,
                        ));
                    }
                    Err(err) => {
                        warn!("area code db load fail on {} [download url:https://github.com/shanliu/area-db/blob/main/data/2023-7-area-code.csv.gz],error detail:{}",code_path.display(),err);
                    }
                }
            }
            Err(err) => {
                error!("load area data fail:{}", err.to_string())
            }
        }
        Ok(WebDao {
            docs,
            user: Arc::new(WebUser::new(
                user_dao,
                rbac_dao,
                db.clone(),
                redis.clone(),
                captcha.clone(),
                app_core.clone(),
                fluents_message,
                setting.clone(),
            )),
            app: Arc::new(apps),
            captcha,
            sender_mailer: mailer,
            sender_smser: web_smser,
            sender_tpl,
            app_core,
            db,
            redis,
            tera,
            setting,
            logger: change_logger,
            area,
            notify,
        })
    }
    pub fn bind_addr(&self) -> String {
        let host = self
            .app_core
            .config
            .get_string("app_host")
            .unwrap_or("127.0.0.1".to_owned());
        let port = self
            .app_core
            .config
            .get_string("app_port")
            .unwrap_or("80".to_owned());
        format!("{}:{}", host, port)
    }
    pub fn bind_ssl_data(&self) -> Option<(String, String, String)> {
        let host = self
            .app_core
            .config
            .get_string("app_host")
            .unwrap_or("127.0.0.1".to_owned());
        let port = self
            .app_core
            .config
            .get_string("app_ssl_port")
            .unwrap_or("443".to_string());
        let cert = self.app_core.config.get_string("app_ssl_cert").ok()?;
        let key = self.app_core.config.get_string("app_ssl_key").ok()?;
        Some((format!("{}:{}", host, port), cert, key))
    }
}
