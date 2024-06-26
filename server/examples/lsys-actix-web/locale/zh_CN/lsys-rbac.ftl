rbac-access-check-res-empty = 未找到用户ID[{$user_id}]的资源[{$res}]操作[{$op}],访问用户ID:{$view_user_id}
rbac-access-check-access = 用户ID[{$user_id}]的资源[{$res}:{$res_id}]操作[{$res_op}]未被授权给你[{$view_user_id}]访问
check-length = 字段[{$key}]校验失败:{$msg}
parse-res-str-fail = 解析权限字符串失败:{$token}
rbac-res-exits =  资源[{$name}:{$key}]已经存在
rbac-priority-range = 角色优先级需要在[{$min}-{$max}]之间
rbac-role-exist = 角色[{$name}]已经存在
rbac-relation-key-exist = 角色KEY{$relation_key}已被角色[{$name}:{$id}]使用
rbac-miss-relation-key = 角色KEY{$relation_key}不能为空
rbac-res-op-user-wrong = 此角色[{$name}:{$role_id}]不能关联用户[{$range}]
rbac-res-op-range-wrong = 此角色[{$name}:{$role_id}]不能关联资源[{$range}]
rbac-role-miss-res = 角色[{$name}:{$id}]不存在
rbac-role-miss-res-op = 未发现的资源[{$name}:{$id}]
rbac-role-bad-res-user = 非系统角色不能加非本角色用户资源,资源未:{$res},用户为:{$user_id}
rbac-role-wrong-res-op = 发现系统中的[{$name}:{$id}] 的 {$res_id} 跟传入的 {$p_res_id} 不一致
rbac-user-range-bad = 关联角色请使用专门的接口添加
rbac-check-fail = 权限校验失败