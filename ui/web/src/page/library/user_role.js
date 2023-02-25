import { default as AddCircleOutline, default as AddCircleOutlineIcon } from '@mui/icons-material/AddCircleOutline';
import AllOutIcon from '@mui/icons-material/AllOut';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import { Alert, Box, Button, Divider, Drawer, FormControl, FormControlLabel, FormGroup, FormHelperText, FormLabel, Grid, IconButton, InputLabel, List, ListItem, MenuItem, Paper, Select, Switch, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DesktopDateTimePicker } from '@mui/x-date-pickers/DesktopDateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import React, { Fragment, useCallback, useContext, useEffect, useState } from 'react';
import { Form } from 'react-router-dom';
import { ToastContext } from '../../context/toast';
import { ConfirmButton } from '../../library/dialog';
import { ClearTextField, InputTagSelect, LoadSelect, SliderInput, TagSelect } from '../../library/input';
import { LoadingButton, Progress } from '../../library/loading';
import { BaseTableBodyRow, BaseTableFooter, BaseTableHead, BaseTableNoRows, BaseTablePage } from '../../library/table_page';
import { ItemTooltip } from '../../library/tips';
import { resListData, roleAdd, roleAddUser, roleDelete, roleDeleteUser, roleEdit, roleListData, roleListUser, roleOptions, roleTags } from '../../rest/access';
import { useSearchChange } from '../../utils/hook';
import { showTime } from '../../utils/utils';
import { RoleResOpGroupItem, RoleResOpItem, UserTags } from './user';

//添加角色资源选择
function UserResSelect(props) {
    const {
        userId,
        size,
        onChange,
        value,
        disabled,
        ...other
    } = props;
    const getRes = useCallback((res_id, page, show) => {
        let rid = parseInt(res_id);
        let param = {
            user_id: userId,
            tags: false,
            ops: false,
            count_num: rid == 0,
            page: {
                page: page,
                limit: show
            }
        };
        if (rid > 0) {
            param.res_id = [rid];
            param.ops = true;
        }
        return resListData(param)
    }, [props.userId]);
    const [resData, setResData] = useState({
        loading: false,
        next: true,
        page: 1,
        show: 10,
        items: [],
        item_ops: [],
        item_ops_cache: {},
        value: '',
        op_value: '',
        error: null
    });
    const [allowData, setAllowData] = useState({
        value: 'allow',
    });
    //[{res_key:'',res_name:'',ops:[{op_name: '',op_key: '',allow:false,op_id:1}]}]
    const [listResData, setListResData] = useState([])
    const changeListResData = (resData) => {
        setListResData(resData)//@todo 
        onChange(resData)
    }
    useEffect(() => {
        setListResData(value)
    }, [props.value])
    return <FormControl {...other}>
        <FormLabel style={{
            position: "absolute",
            transform: "translate(0, -12px) scale(0.75)"
        }}>绑定权限</FormLabel>
        <Box className='MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-formControl MuiInputBase-sizeSmall'
            style={{
                borderRadius: "4px",
                marginBottom: "4px"
            }}>
            <fieldset style={{
                textAlign: "left",
                position: "absolute",
                bottom: 0,
                right: 0,
                top: "-5px",
                left: 0,
                margin: 0,
                padding: "0 8px",
                pointerEvents: "none",
                borderRadius: "inherit",
                borderStyle: "solid",
                borderWidth: "1px ",
                overflow: "hidden",
                borderColor: " rgba(0, 0, 0, 0.23)",
            }} className="MuiOutlinedInput-notchedOutline "><legend style={{
                visibility: "hidden"
            }} ><span>绑定权限</span></legend></fieldset>
        </Box>
        <Box sx={{ mt: 1, mb: 1 }}>
            {
                (listResData.length == 0) ?
                    <div style={{
                        textAlign: "center",
                        fontSize: "0.9rem",
                        color: "#999",
                        lineHeight: 3
                    }}>请添加权限</div>
                    : listResData.map((item, i) => {
                        return <RoleResOpGroupItem
                            key={`res-op-item-${i}`}
                            resName={item.res_name}
                            resKey={item.res_key}
                        >
                            {
                                item.ops.map((op, i) => {
                                    return <RoleResOpItem
                                        key={`op-item-${i}`}
                                        allow={op.allow}
                                        opName={op.op_name}
                                        opKey={op.op_key}
                                        onDelete={(op_key) => {
                                            let res_key = item.res_key;
                                            let items = [];
                                            listResData.map((res) => {
                                                let tmp;
                                                if (res.res_key == res_key) {
                                                    let tmpop = [];
                                                    item.ops.map((op) => {
                                                        if (op.op_key != op_key) {
                                                            tmpop.push({ ...op })
                                                        }
                                                    });
                                                    if (tmpop.length > 0) {
                                                        tmp = {
                                                            ...res,
                                                            ops: tmpop
                                                        };
                                                    }
                                                } else {
                                                    tmp = { ...res };
                                                }
                                                if (tmp) items.push(tmp)
                                            })
                                            changeListResData(items)
                                        }}
                                    />
                                })}
                        </RoleResOpGroupItem>
                    })
            }
        </Box>
        <Divider sx={{ mb: 1 }}></Divider>
        <Grid container item sx={{ mt: 1 }}>
            <Grid item xs={4}>
                <FormControl fullWidth sx={{
                    width: 1,
                    paddingBottom: 1
                }}>
                    <InputLabel size={size} id="user-res-select-label">选择资源</InputLabel>
                    <LoadSelect
                        label="选择资源"
                        size={size}
                        labelId="user-res-select-label"
                        id="user-res-select"
                        loading={resData.loading}
                        next={resData.next}
                        value={resData.value}
                        error={resData.error}
                        onChange={(e) => {
                            let val = e.target.value;
                            let res = resData.items.find((e) => {
                                return e.res_key == val
                            })
                            if (!res) {
                                setResData({ ...resData, loading: false, value: val })
                                return
                            }
                            let cache_item = resData.item_ops_cache[res.id] ?? null;
                            if (cache_item) {
                                setResData({
                                    ...resData,
                                    item_ops: cache_item.ops,
                                    op_value: cache_item.ops[0].op_key ?? '',
                                    value: val
                                })
                                return;
                            }
                            getRes(res.id, 1, 1).then((data) => {
                                if (!data.status) {
                                    setResData({
                                        ...resData,
                                        error: resData.items.length > 0 ? null : data.message
                                    })
                                    return;
                                }
                                let items = (data.data ?? [])[0];
                                if (!items) return;
                                let cache = { ...resData.item_ops_cache };
                                cache[items.res.id] = items;
                                setResData({
                                    ...resData,
                                    item_ops: items.ops ?? [],
                                    item_ops_cache: cache,
                                    op_value: items.ops[0].op_key ?? '',
                                    value: val
                                })
                            })
                        }}
                        onLoad={() => {
                            setResData({ ...resData, loading: true })
                            getRes(0, resData.page, resData.show).then((data) => {
                                if (!data.status) {
                                    setResData({
                                        ...resData,
                                        loading: false,
                                        next: false,
                                        error: resData.items.length > 0 ? null : data.message
                                    })
                                    return;
                                }
                                let items = (data.data ?? []).map((e) => {
                                    return e.res
                                });
                                setResData({
                                    ...resData,
                                    items: [...resData.items, ...items],
                                    loading: false,
                                    page: resData.page + 1,
                                    next: resData.page * resData.show < data.count
                                })
                            })
                        }}
                    >
                        {resData.items.map((item) => {
                            return <MenuItem key={`res-${item.res_key}`} value={item.res_key}>{item.name}</MenuItem>
                        })}
                    </LoadSelect>
                </FormControl>
            </Grid>
            <Grid item xs={4}>
                <FormControl fullWidth sx={{
                    width: 1,
                    paddingBottom: 1,
                    pl: 1,
                }}>
                    <InputLabel size={size} id="user-res-op-select-label">选择操作</InputLabel>
                    <Select
                        disabled={disabled}
                        label="选择操作"
                        size={size}
                        labelId="user-res-op-select-label"
                        id="user-res-op-select"
                        value={resData.op_value}
                        onChange={(e) => {
                            setResData({
                                ...resData,
                                op_value: e.target.value
                            })
                        }}
                    >
                        {resData.item_ops.map((item) => {
                            return <MenuItem key={`res-op-${item.op_key}`} value={item.op_key}>{item.name}</MenuItem>
                        })}
                    </Select>
                </FormControl>

            </Grid>
            <Grid item xs={3} sx={{ textAlign: "center" }}>
                <ToggleButtonGroup
                    disabled={disabled}
                    exclusive
                    sx={{ w: 1 }}
                    size={size}
                    value={allowData.value}
                >
                    <ToggleButton disableRipple value="allow" onClick={() => {
                        setAllowData({
                            ...allowData,
                            value: "allow"
                        })
                    }} sx={{
                        "&.Mui-selected": {
                            background: "#d7ebff"
                        },
                        "&.Mui-selected:hover": {
                            background: "#ddeeff"
                        }
                    }}>
                        授权
                    </ToggleButton>
                    <ToggleButton disableRipple value="deny" onClick={() => {
                        setAllowData({
                            ...allowData,
                            value: "deny"
                        })
                    }} sx={{
                        "&.Mui-selected": {
                            background: "#ffeeee"
                        },
                        "&.Mui-selected:hover": {
                            background: "#fff1f1"
                        }
                    }} >
                        禁止
                    </ToggleButton>
                </ToggleButtonGroup>
            </Grid>
            <Grid item xs={1}>
                <Button variant="outlined"
                    disabled={disabled} sx={{
                        borderColor: "#aaa",
                        minWidth: "20px",
                        padding: "8px 6px",
                        '&:hover svg': {
                            color: '#1976d2'
                        }
                    }} >
                    <AddCircleOutlineIcon
                        onClick={() => {
                            let res = resData.items.find((e) => {
                                return e.res_key == resData.value
                            })
                            let res_op = resData.item_ops.find((e) => {
                                return e.op_key == resData.op_value
                            })
                            //[{res_key:'',res_name:'',ops:[{op_name: '',op_key: '',allow:false,op_id:1}]}]
                            let find;
                            let items = listResData.map((item) => {
                                if (item.res_key == res.res_key) {
                                    find = true;
                                    let find_op = false;
                                    let ops = item.ops.map((op) => {
                                        if (op.op_key == res_op.op_key) {
                                            find_op = true;
                                            return {
                                                ...op,
                                                allow: allowData.value == 'allow'
                                            }
                                        }
                                        return { ...op };
                                    })
                                    if (!find_op) {
                                        ops.push({
                                            op_id: res_op.id,
                                            op_key: res_op.op_key,
                                            op_name: res_op.name,
                                            allow: allowData.value == 'allow'
                                        })
                                    }
                                    return {
                                        ...item,
                                        ops: ops
                                    }
                                }
                                return { ...item };
                            })
                            if (!find) {
                                items.push({
                                    res_name: res.name,
                                    res_key: res.res_key,
                                    ops: [{
                                        op_id: res_op.id,
                                        op_key: res_op.op_key,
                                        op_name: res_op.name,
                                        allow: allowData.value == 'allow'
                                    }]
                                })
                            }
                            changeListResData(items)
                        }}
                        fontSize={size}
                        sx={{
                            color: "#666",
                        }} />
                </Button>
            </Grid>
        </Grid>
    </FormControl >
}

//角色添加或编辑弹出页
function UserRoleAdd(props) {
    const { title, tags, rowData, initData, onSave } = props;
    let tags_options = (tags ?? []).map((e) => { return e[0] })
    const initAddData = {

        loading: false,
        res_name: '',
        tags: [],
        priority: 50,
        res_range: initData.res_range[0].key,
        user_range: initData.user_range[0].key,
        user_access_key: '',
        user_select: []
    }
    const [addData, setAddData] = useState(initAddData)
    useEffect(() => {
        if (!rowData?.role) return;
        let tags = (rowData.tags ?? []).map((e) => { return e.name });
        let user_select = [];
        //[{res_key:'',res_name:'',ops:[{op_name: '',op_key: '',allow:false,op_id:1}]}]
        (rowData.ops ?? []).map((op) => {
            if (!user_select[op.res.id]) user_select[op.res.id] = {
                res_key: op.res.res_key,
                res_name: op.res.name,
                ops: [],
            }
            user_select[op.res.id].ops.push({
                op_name: op.res_op.name,
                op_key: op.res_op.op_key,
                op_id: op.res_op.id,
                allow: op.role_op.positivity == 1,
            });
        })

        setAddData({
            ...addData,
            res_name: rowData.role.name || '',
            priority: rowData.role.priority || 50,
            res_range: rowData.role.res_op_range || initData.res_range[0].key,
            user_range: rowData.role.user_range || initData.user_range[0].key,
            user_access_key: rowData.role.relation_key || '',
            tags: tags,
            user_select: user_select
        })
    }, [rowData])

    const submitAdd = useCallback(function (
        user_id,
        name,
        user_range,
        role_op_range,
        priority,
        relation_key,
        tags,
        role_ops
    ) {

        user_id = parseInt(user_id)
        user_range = parseInt(user_range)
        role_op_range = parseInt(role_op_range)
        priority = parseInt(priority)
        tags = tags.map((e) => {
            return e
                .replace(/^\s+/)
                .replace(/\s+$/)
        }).filter((e) => {
            return e.length > 0
        })
        role_ops = role_ops.map((e) => {
            let op_id = parseInt(e.op_id);
            let op_positivity = parseInt(e.op_positivity);
            if (isNaN(op_id) || isNaN(op_positivity)) return;
            return {
                op_id: op_id,
                op_positivity: op_positivity
            }
        }).filter((e) => { return e })
        let param = {
            user_id: user_id,
            name: name,
            user_range: user_range,
            role_op_range: role_op_range,
            priority: priority,
            relation_key: relation_key + '',
            tags: tags,
            role_user: [],
        };
        if (role_op_range == 1) {
            param.role_ops = role_ops;
        }
        return roleAdd(param);
    }, []);
    const submitEdit = useCallback(function (
        role_id,
        name,
        user_range,
        role_op_range,
        priority,
        relation_key,
        tags,
        role_ops
    ) {
        role_id = parseInt(role_id)
        user_range = parseInt(user_range)
        role_op_range = parseInt(role_op_range)
        priority = parseInt(priority)
        tags = tags.map((e) => {
            return e
                .replace(/^\s+/)
                .replace(/\s+$/)
        }).filter((e) => {
            return e.length > 0
        })
        role_ops = role_ops.map((e) => {
            let op_id = parseInt(e.op_id);
            let op_positivity = parseInt(e.op_positivity);
            if (isNaN(op_id) || isNaN(op_positivity)) return;
            return {
                op_id: op_id,
                op_positivity: op_positivity
            }
        }).filter((e) => { return e })
        let param = {
            role_id: role_id,
            name: name,
            user_range: user_range,
            role_op_range: role_op_range,
            priority: priority,
            relation_key: relation_key,
            tags: tags,
        };
        if (role_op_range == 1) {
            param.role_ops = role_ops;
        }
        return roleEdit(param);
    }, []);
    const { toast } = useContext(ToastContext);
    const submitAction = () => {
        setAddData({
            ...addData,
            loading: true
        });
        // 
        let ops = [];
        addData.user_select.map((e) => {
            e.ops.map((e) => {
                ops.push({
                    op_id: e.op_id,
                    op_positivity: e.allow ? 1 : 0
                })
            })
        })
        let doAction;
        if (rowData && rowData.role && rowData.role.id > 0) {
            return submitEdit(
                rowData.role.id,
                addData.res_name,
                addData.user_range,
                addData.res_range,
                addData.priority,
                addData.user_access_key,
                addData.tags,
                ops,
            ).then((data) => {
                if (data.status) {
                    onSave(rowData.role.id, addData.res_name, addData.user_range)
                    toast("已保存")
                } else {
                    toast(data.message)
                }
                setAddData({
                    ...addData,
                    loading: false
                });
                return data
            })
        } else {
            doAction = submitAdd(
                initData.user_id,
                addData.res_name,
                addData.user_range,
                addData.res_range,
                addData.priority,
                addData.user_access_key,
                addData.tags,
                ops,
            ).then((data) => {
                if (data.status) {
                    onSave(data.id, addData.res_name, addData.user_range)
                }
                if (!data.status) {
                    toast(data.message)
                    setAddData({
                        ...addData,
                        loading: false
                    });
                } else {
                    toast("已添加")
                    setAddData({
                        ...initAddData,
                        loading: false
                    });
                }
                return data
            })
        }
        return doAction;
    }

    return (
        <Fragment>
            <Typography
                align="center"
                variant="subtitle1"
                noWrap
                sx={{
                    mt: 4,
                    mb: 2,
                    fontWeight: 100,
                    alignItems: "center",
                    letterSpacing: '.3rem',
                    color: 'inherit',
                    textDecoration: 'none',
                }}
            >
                {title}
            </Typography>
            <Divider variant="middle" />
            {
                <Form method="post" >
                    <Grid
                        sx={{
                            mt: 3,
                        }}
                        container
                        justifyContent="center"
                        alignItems="center"
                    >
                        <Grid item xs={10}>
                            <TextField
                                disabled={addData.loading}
                                label="名称"
                                variant="outlined"
                                name="name"
                                size="small"
                                value={addData.res_name}
                                onChange={(e) => {
                                    setAddData({
                                        ...addData,
                                        res_name: e.target.value,
                                    })
                                }}
                                sx={{
                                    width: 1,
                                    paddingBottom: 2
                                }}
                                required
                            />
                            <InputTagSelect
                                disabled={addData.loading}
                                name="ddd"
                                size="small"
                                value={addData.tags}
                                options={tags_options}
                                onChange={(value) => {
                                    setAddData({
                                        ...addData,
                                        tags: value
                                    })
                                }}
                            />
                            <SliderInput fullWidth 
                                sx={{
                                    width: 1,
                                    mb: 2,
                                    mt: 2,
                                    padding: "0 16px",
                                    textAlign: "center"
                                }}  
                                label="优先级"
                                loading={addData.loading}
                                value={addData.priority}
                                onChange={(e) => {
                                    setAddData({
                                        ...addData,
                                        priority: e.target.value || 100
                                    })
                                }}
                            />
                            <FormControl fullWidth sx={{
                                width: 1,
                                paddingBottom: 2
                            }}>
                                <InputLabel size="small" id="user-select-label">用户范围</InputLabel>
                                <Select
                                    disabled={addData.loading || !!rowData?.role}
                                    size="small"
                                    labelId="user-select-label"
                                    id="user-select"
                                    label="用户范围"
                                    value={addData.user_range}
                                    onChange={(e) => {
                                        setAddData({
                                            ...addData,
                                            user_range: e.target.value
                                        });
                                    }}
                                >
                                    {
                                        initData.user_range.map((item) => {
                                            if (rowData?.role) {
                                                if (rowData.role.user_range == 4 && item.key != 4) return;
                                                if (rowData.role.user_range != 4 && item.key == 4) return;

                                            }
                                            return <MenuItem key={`res_range_${item.key}`} value={item.key}>{item.name}</MenuItem>
                                        }).filter((e) => { return e })
                                    }
                                </Select>
                                {
                                    addData.user_range == 3 && !rowData?.role ? <FormHelperText >可在下一步添加指定用户</FormHelperText> : null
                                }
                            </FormControl>
                            {addData.user_range == 4 ?
                                <FormControl fullWidth sx={{
                                    width: 1,
                                    paddingBottom: 2
                                }}>
                                    <InputLabel size="small" id="user-select-label">关系选择</InputLabel>
                                    <Select
                                        disabled={addData.loading || !!rowData?.role}
                                        label="关系选择"
                                        name="name"
                                        size="small"
                                        sx={{
                                            width: 1
                                        }}
                                        value={addData.user_access_key}
                                        onChange={(e) => {
                                            setAddData({
                                                ...addData,
                                                user_access_key: e.target.value
                                            });
                                        }}
                                        required
                                    >
                                        {
                                            initData.user_access_keys.map((item) => {
                                                return <MenuItem
                                                    disabled={item.is_use}
                                                    key={`res_range_${item.key}`}
                                                    value={item.key}>
                                                    {item.is_use ? `${item.name}[已创建]` : item.name}
                                                </MenuItem>
                                            })
                                        }
                                    </Select>
                                </FormControl> : null}
                            <FormControl fullWidth sx={{
                                width: 1,
                                paddingBottom: 1
                            }}>
                                <InputLabel size="small" id="res-select-label">资源范围</InputLabel>
                                <Select
                                    disabled={addData.loading}
                                    size="small"
                                    labelId="res-select-label"
                                    id="res-select"
                                    label="资源范围"
                                    value={addData.res_range}
                                    onChange={(e) => {
                                        setAddData({
                                            ...addData,
                                            res_range: e.target.value
                                        });
                                    }}
                                >
                                    {
                                        initData.res_range.map((item) => {
                                            return <MenuItem key={`res_range_${item.key}`} value={item.key}>{item.name}</MenuItem>
                                        })
                                    }
                                </Select>
                            </FormControl>
                            {addData.res_range == 1 ? <UserResSelect
                                userId={initData.user_id}
                                disabled={addData.loading}
                                value={addData.user_select}
                                onChange={(value) => {
                                    setAddData({
                                        ...addData,
                                        user_select: value
                                    });
                                }}
                                size="small"
                                sx={{
                                    p: 1,
                                    width: "100%",
                                }} /> : null}
                        </Grid>
                        <Grid item xs={10}>
                            <LoadingButton sx={{
                                width: 1,
                                mb: 3,
                                mt: 2,
                            }}
                                variant="contained"
                                loading={addData.loading}
                                disabled={addData.loading}
                                onClick={() => {
                                    submitAction()
                                }}
                            >{rowData?.role?.id > 0 ? `保存` : `添加`}</LoadingButton>
                        </Grid>
                    </Grid>
                </Form >}
        </Fragment>)
}



//角色关联用户弹出页面
function UserRoleListUser(props) {
    const { roleId, roleName } = props;
    const defTimeout = dayjs((new Date()).getTime() + 1000 * 3600 * 24 * 30);
    const [userDataInput, setUserDataInput] = useState({
        show: false,
        op_user_id: 0,
        input_user_id: 0,
        timeout: defTimeout,
        need_timeout: false,
        add_loading: false,
        add_error: '',
    });
    const [userDataParam, setUserDataParam] = useState({
        op_user_id: 0,
        page: 0,
        page_size: 10
    });
    const [userData, setUserData] = useState({
        loading: false,
        rows: [],
        rows_total: 0,
        error: null,
    })

    const getUserData = useCallback(function (op_user_id, page, pageSize) {
        op_user_id = parseInt(op_user_id)
        let param = {
            role_id: [parseInt(roleId)],
            count_num: true,
            page: {
                page: parseInt(page) + 1,
                limit: parseInt(pageSize)
            },
        };
        if (op_user_id > 0) {
            param.user_id = [op_user_id]
        }
        return roleListUser(param);
    }, [props]);


    const loadUserData = () => {
        setUserData({
            ...userData,
            loading: true
        })
        getUserData(userDataParam.op_user_id, userDataParam.page, userDataParam.page_size).then((data) => {
            if (!data.status) {
                setUserData({
                    ...userData,
                    error: data.message,
                    loading: false
                })
                return;
            }
            setUserData({
                ...userData,
                rows: data.data[roleId] ?? [],
                rows_total: data.count || 0,
                loading: false,

            })
            if (parseInt(data.count) == 0) {
                setUserDataInput({
                    ...userDataInput,
                    input_user_id: userDataParam.op_user_id,
                    show: true,
                    need_timeout: false
                })
            }
        })
    }

    useEffect(() => {
        loadUserData();
    }, [userDataParam])


    const addUser = useCallback(function (roleId, op_user_id, timeout) {
        op_user_id = parseInt(op_user_id)
        if (isNaN(op_user_id) || op_user_id < 0) return;
        let user_param = {
            role_id: roleId,
            user_vec: [
                {
                    "user_id": op_user_id,
                    "timeout": timeout
                }
            ]
        };
        return roleAddUser(user_param)
    }, [props]);

    const delUser = useCallback(function (roleId, op_user_id) {
        op_user_id = parseInt(op_user_id)
        if (isNaN(op_user_id) || op_user_id < 0) return;
        let user_param = {
            role_id: roleId,
            user_vec: [
                op_user_id
            ]
        };
        return roleDeleteUser(user_param)
    }, [props]);

    const columns = [
        {
            label: "用户ID",
            style: { width: 100 },
            align: "right",
            field: "user_id",
        },
        {
            label: "有效期",
            style: { width: 170 },
            align: "left",
            render: (row) => {
                let showime = showTime(row.timeout, "长期有效")
                let time = (new Date()).getTime() / 1000;
                if (row.timeout > 0 && (row.timeout) < time) {
                    return <ItemTooltip
                        placement="top"
                        title={`此用户已过期`}>
                        <div style={{ color: "#f00" }}>{showime}</div>
                    </ItemTooltip>
                } else {
                    return showime
                }
            }
        },
        {
            label: "绑定时间",
            style: { width: 170 },
            align: "left",
            render: (row) => {
                return showTime(row.change_time, "未知")
            }
        },
        {
            label: "操作",
            align: "center",
            render: (row) => {
                return <Fragment>
                    <IconButton onClick={() => {
                        setUserData({
                            ...userData,
                            rows: [],
                            rows_total: 0
                        });
                        setUserDataInput({
                            ...userDataInput,
                            input_user_id: row.user_id,
                            op_user_id: 0,

                            need_timeout: row.timeout > 0,
                            timeout: row.timeout > 0 ? dayjs(row.timeout * 1000) : defTimeout,
                            show: true
                        })
                    }} size='small'>
                        <EditIcon fontSize='small' />
                    </IconButton>
                    <ConfirmButton
                        message={`确定要移除该角色下的用户ID [${row.user_id}] ?`}
                        onAction={() => {
                            return delUser(roleId, row.user_id).then((data) => {
                                if (!data.status) return data;
                                setUserDataParam({
                                    ...userDataParam,
                                    op_user_id: 0
                                });
                                return data;
                            })
                        }}
                        renderButton={(props) => {
                            return <IconButton {...props} size='small'>
                                <DeleteIcon fontSize='small' />
                            </IconButton>
                        }} />
                </Fragment >
                    ;
            }
        },
    ];
    let LoadError = function (props) {
        const { error, ...other } = props;
        return <Box {...other}>
            <Alert severity="error">{error}</Alert>
        </Box>
    }

    return (
        <Fragment>
            <Typography
                align="center"
                variant="subtitle1"
                noWrap
                sx={{
                    mt: 4,
                    mb: 2,
                    fontWeight: 100,
                    alignItems: "center",
                    letterSpacing: '.3rem',
                    color: 'inherit',
                    textDecoration: 'none',
                }}
            >
                角色<span style={{
                    background: "#eee",
                    margin: "0 0px 0 1px",
                    padding: "0 0 0 5px",
                    color: "#000",
                    display: "inline-block",
                    textAlign: "center"
                }}>{roleName}</span>
                <span style={{
                    background: "#eee",
                    margin: "0px 3px 0 1px",
                    padding: "0px 3px 0px 5px",
                    color: "#999",
                    display: "inline-block",
                    textAlign: "center"
                }}>{roleId}</span>绑定用户
            </Typography>
            <Divider variant="middle" />
            <Grid
                sx={{
                    mt: 3,
                }}
                container
                justifyContent="center"
                alignItems="center"
            >
                <Grid item xs={11}>
                    <Form method="post" >
                        <Grid
                            container item
                            justifyContent="center"
                            alignItems="center"
                            sx={{
                                width: 1,
                                paddingBottom: 2
                            }}

                        >
                            <Grid item xs={3.6}>
                                <TextField
                                    sx={{
                                        width: 1,
                                    }}
                                    label="用户ID"
                                    variant="outlined"
                                    name="name"
                                    size="small"
                                    value={userDataInput.op_user_id > 0 ? userDataInput.op_user_id : ''}
                                    onChange={(e) => {
                                        let value = (e.target.value + '').replace(/[^0-9]+/, '');
                                        setUserDataInput({
                                            ...userDataInput,
                                            op_user_id: value
                                        })
                                    }}
                                    disabled={userDataInput.add_loading || userData.loading}
                                    required
                                />
                            </Grid>
                            <Grid item xs={2.8} sx={{ pl: 1 }}>
                                <LoadingButton
                                    loading={userData.loading}
                                    disabled={userDataInput.add_loading || userData.loading}
                                    variant="outlined"
                                    size="medium"
                                    startIcon={<SearchIcon />}
                                    sx={{ pd: 1, pt: 1, width: 1 }}
                                    onClick={() => {
                                        setUserDataParam({
                                            ...userDataParam,
                                            op_user_id: userDataInput.op_user_id
                                        })
                                    }}
                                >
                                    查找
                                </LoadingButton>
                            </Grid>
                            <Grid item xs={2.8} sx={{ pl: 1 }}>
                                <LoadingButton
                                    loading={userDataInput.add_loading}
                                    disabled={userDataInput.add_loading}
                                    variant="outlined"
                                    size="medium"
                                    startIcon={<AddCircleOutline />}
                                    sx={{ pd: 1, pt: 1, width: 1 }}
                                    onClick={() => {
                                        setUserData({
                                            ...userData,
                                            rows: [],
                                            rows_total: 0
                                        });
                                        setUserDataInput({
                                            ...userDataInput,
                                            input_user_id: 0,
                                            op_user_id: 0,
                                            need_timeout: false,

                                            show: true
                                        })
                                    }}
                                >
                                    新增
                                </LoadingButton>
                            </Grid>
                            <Grid item xs={2.8} sx={{ pl: 1 }}>
                                <LoadingButton
                                    loading={userData.loading}
                                    disabled={userDataInput.add_loading || userData.loading}
                                    variant="outlined"
                                    size="medium"
                                    startIcon={<AllOutIcon />}
                                    sx={{ pd: 1, pt: 1, width: 1 }}
                                    onClick={() => {
                                        setUserDataInput({
                                            ...userDataInput,
                                            op_user_id: ''
                                        })
                                        setUserDataParam({
                                            ...userDataParam,
                                            op_user_id: 0
                                        })
                                    }}
                                >
                                    全部
                                </LoadingButton>
                            </Grid>

                        </Grid>

                    </Form>
                </Grid>
                <Grid item xs={11} sx={{ mb: 3 }}>

                    {userData.error ?
                        <LoadError error={userData.error} /> :
                        (userDataInput.show && userData.rows.length == 0) ?
                            <Fragment>
                                <Paper sx={{ p: 2 }}>
                                    {userDataParam.op_user_id ? <BaseTableNoRows msg={`当前角色未添加用户ID ${userDataParam.op_user_id} ,可以尝试添加`} /> : null}

                                    {userDataInput.add_error ? <LoadError sx={{ mb: 1 }} error={userDataInput.add_error} /> : null}
                                    <LocalizationProvider dateAdapter={AdapterDayjs}>

                                        <Form>

                                            <TextField
                                                sx={{
                                                    width: 1,
                                                }}
                                                label="用户ID"
                                                variant="outlined"
                                                name="name"
                                                size="small"
                                                value={userDataInput.input_user_id > 0 ? userDataInput.input_user_id : ''}
                                                onChange={(e) => {
                                                    let value = (e.target.value + '').replace(/[^0-9]+/, '');
                                                    setUserDataInput({
                                                        ...userDataInput,
                                                        input_user_id: value
                                                    })
                                                }}
                                                disabled={userDataInput.add_loading || userData.loading}
                                                required
                                            />
                                            <FormControl fullWidth sx={{ mt: 1 }}>
                                                <FormLabel style={{
                                                    position: "absolute",
                                                    transform: "translate(10px, -5px) scale(0.75)"
                                                }}>有效期</FormLabel>
                                                <Box className='MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-formControl MuiInputBase-sizeSmall'
                                                    style={{
                                                        borderRadius: "4px",
                                                        marginBottom: "4px"
                                                    }}>
                                                    <fieldset style={{
                                                        textAlign: "left",
                                                        position: "absolute",
                                                        bottom: 0,
                                                        right: 0,
                                                        top: "-5px",
                                                        left: 0,
                                                        margin: 0,
                                                        padding: "0 8px",
                                                        pointerEvents: "none",
                                                        borderRadius: "inherit",
                                                        borderStyle: "solid",
                                                        borderWidth: "1px ",
                                                        overflow: "hidden",
                                                        borderColor: " rgba(0, 0, 0, 0.23)",
                                                    }} className="MuiOutlinedInput-notchedOutline "><legend style={{
                                                        visibility: "hidden"
                                                    }} ><span>有效期</span></legend></fieldset>
                                                </Box>


                                                <FormGroup>
                                                    <FormControlLabel
                                                        label="设置有效期"

                                                        sx={{ m: 1, mt: 2, color: "#666" }}
                                                        control={
                                                            <Switch
                                                                value={userDataInput.need_timeout}
                                                                onChange={(e) => {
                                                                    setUserDataInput({
                                                                        ...userDataInput,
                                                                        need_timeout: e.target.checked,

                                                                    })
                                                                }} />
                                                        }
                                                    />
                                                    {
                                                        !userDataInput.need_timeout ? <FormHelperText sx={{ mb: 1 }} >不设置有效期为长期有效</FormHelperText> : null
                                                    }
                                                </FormGroup>
                                                <FormGroup>

                                                    {userDataInput.need_timeout ? <DesktopDateTimePicker
                                                        inputFormat="YYYY-MM-DD hh:mm:ss"
                                                        label="过期时间"
                                                        minDateTime={dayjs(new Date())}
                                                        variant="outlined"
                                                        size="small"
                                                        onChange={(value) => {
                                                            setUserDataInput({
                                                                ...userDataInput,
                                                                timeout: value
                                                            })
                                                        }}
                                                        value={userDataInput.timeout}
                                                        disabled={userDataInput.add_loading}
                                                        renderInput={(params) => <TextField
                                                            size="small" name="timeout" {...params} sx={{
                                                                m: 2,
                                                                mt: 1
                                                            }} />}
                                                    /> : null}
                                                </FormGroup>
                                            </FormControl>




                                            <LoadingButton
                                                loading={userDataInput.add_loading}
                                                disabled={userDataInput.add_loading}
                                                variant="outlined"
                                                size="medium"
                                                startIcon={<AddCircleOutlineIcon />}
                                                sx={{ width: 1, mt: 2 }}
                                                onClick={() => {
                                                    setUserDataInput({
                                                        ...userDataInput,
                                                        add_loading: true
                                                    })

                                                    addUser(
                                                        roleId,
                                                        userDataInput.input_user_id,
                                                        userDataInput.need_timeout ? userDataInput.timeout.unix() : 0).then((data) => {
                                                            if (!data.status) {
                                                                setUserDataInput({
                                                                    ...userDataInput,
                                                                    add_loading: false,
                                                                    add_error: data.message
                                                                })
                                                            } else {
                                                                setUserDataInput({
                                                                    ...userDataInput,
                                                                    add_loading: false,
                                                                    op_user_id: userDataInput.input_user_id
                                                                })
                                                                setUserDataParam({
                                                                    ...userDataParam,
                                                                    op_user_id: userDataInput.input_user_id
                                                                });
                                                            }
                                                        })
                                                }}
                                            >
                                                添加用户ID到角色
                                            </LoadingButton>
                                        </Form>

                                    </LocalizationProvider>
                                </Paper>
                            </Fragment> :
                            <BaseTablePage
                                rows={userData.rows ?? []}
                                columns={columns}
                                count={userData.rows_total ?? 0}
                                page={userDataParam.page}
                                rowsPerPage={userDataParam.page_size}
                                onPageChange={(e, newPage) => {
                                    setUserDataParam({
                                        ...userDataParam,
                                        page: newPage
                                    })
                                }}
                                onRowsPerPageChange={(e) => {
                                    setUserDataParam({
                                        ...userDataParam,
                                        page_size: e.target.value,
                                        page: 0
                                    })
                                }}
                                loading={userData.loading}
                            />
                    }
                </Grid>
            </Grid >
        </Fragment >)
}


//角色记录块
function UserRoleRow(props) {
    const { roleData, tagData, opData, columns, onTagClick } = props;

    let isTags = (tagData ?? []).length > 0;
    let isOpData;
    if ((opData ?? []).length > 0) {
        isOpData = [];
        opData.map((op) => {
            if (!isOpData[op.res.id]) isOpData[op.res.id] = {
                res: op.res,
                res_op: [],
            }
            isOpData[op.res.id].res_op.push({
                res_op: op.res_op,
                role_op: op.role_op,

            });
        })
    }

    return <ListItem
        disablePadding
        sx={{
            borderBottom: "1px solid #ddd",
            "&:hover": {
                background: "#f9f9f9"
            }
        }}
    >
        <Table sx={{ width: 1, borderBottom: "0px", }}>

            <TableBody>
                <BaseTableBodyRow
                    row={roleData}
                    columns={columns}
                    cellProps={{ style: { borderBottom: "1px solid #f0f0f0" } }}
                />

                {isOpData ? <TableRow >
                    <TableCell colSpan={7} style={{ padding: 8, paddingBottom: 0, paddingTop: 0, borderBottom: "1px solid #f0f0f0" }}>
                        <Grid container >
                            <Grid sx={{ width: 80, lineHeight: "52px", fontWeight: 500, fontSize: "0.875rem", textAlign: "right", mr: 1 }}>绑定资源</Grid>
                            <Grid sx={{ flexGrow: 1, width: "70%", marginLeft: "8px" }}>
                                {
                                    isOpData.map((op, i) => {
                                        let ops = op.res_op.map((e) => {
                                            return {
                                                allow: e.role_op.positivity == 1,
                                                op_name: e.res_op.name,
                                                op_key: e.res_op.op_key,
                                                time: e.res_op.change_time
                                            }
                                        })
                                        return <RoleResOpGroupItem
                                            key={`key-access-item-${i}`}
                                            resName={op.res.name}
                                            resKey={op.res.res_key}
                                        >
                                            {
                                                ops.map((op, i) => {
                                                    return <RoleResOpItem
                                                        key={`op-item-${i}`}
                                                        allow={op.allow}
                                                        opName={op.op_name}
                                                        opKey={op.op_key}
                                                        tips={`添加于:${showTime(op.time)}`}
                                                    />
                                                })}
                                        </RoleResOpGroupItem>;
                                    })
                                }
                            </Grid>
                        </Grid>
                    </TableCell>
                </TableRow> : null}
                {isTags ? <TableRow>
                    <TableCell colSpan={7} style={{ padding: 4, borderBottom: "1px solid #f0f0f0" }}>
                        <Grid container>
                            <Grid sx={{ width: 80, lineHeight: "52px", fontWeight: 500, fontSize: "0.875rem", textAlign: "right", mr: 1 }}>标签</Grid>
                            <Grid sx={{ flexGrow: 1, color: "#333", paddingTop: "2px", paddingLeft: "8px", width: "70%" }}>
                                {tagData.map((tag) => {
                                    return <UserTags
                                        onClick={() => {
                                            onTagClick(tag.name)
                                        }}
                                        name={tag.name}
                                        key={`res-tag-${tag.id}`}
                                        sx={{ m: 1, ml: 0 }}
                                        tips={`添加于:${showTime(tag.change_time, "未知")}`}
                                    />
                                })}
                            </Grid>
                        </Grid>
                    </TableCell>
                </TableRow> : null}
            </TableBody>
        </Table>
    </ListItem>;
}


//角色管理页面
export function UserRolePage(props) {
    const { userId } = props;
    //URL参数
    const [searchParam, setSearchParam] = useSearchChange({
        tag: "",
        role_id: "",
        role_name: "",
        user_range: "",
        res_range: "",
        page: 0,
        page_size: 10,
    });

    //过滤组件数据
    const [filterData, setfilterData] = useState({
        tag: '',
        role_id: '',
        role_name: '',
        user_range: "",
        res_range: "",
    })

    useEffect(() => {
        setfilterData({
            ...filterData,
            tag: searchParam.get("tag"),
            role_id: searchParam.get("role_id"),
            role_name: searchParam.get("role_name"),
            user_range: searchParam.get("user_range"),
            res_range: searchParam.get("res_range"),
        })
    }, [searchParam])
    //初始化数据
    const [pageInitData, setPageInitData] = useState({
        user_id: userId,
        res_range: [],
        user_range: [],
        user_access_key: [],
    }, [props.userId])
    const [pageRowData, setPageRowData] = useState({
        rows: [],
        rows_total: 0,
        rows_error: null,
        rows_loading: true,
    })
    const getRowData = useCallback(function (
        user_id,
        user_range,
        res_range,
        tag,
        role_id,
        role_name,
        page,
        pageSize
    ) {
        let param = {
            count_num: true,
            user_id: parseInt(userId),
            tags: true,
            user_data: false,
            ops: 2,
            page: {
                page: parseInt(page) + 1,
                limit: parseInt(pageSize)
            },
            user_data_group: 2,
            user_data_page: { page: 0, limit: 0 }
        };
        user_range = parseInt(user_range)
        if (user_range > 0) {
            param.user_range = [user_range];
        }
        res_range = parseInt(res_range)
        if (res_range > 0) {
            param.res_range = [res_range];
        }
        if (typeof tag == 'string' && tag.length > 0) {
            param.tags_filter = [tag];
        }
        if (typeof role_name == 'string' && role_name.length > 0) {
            param.role_name = role_name;
        }
        if (typeof role_id == 'string') {
            role_id = role_id.split(",").map((e) => parseInt(e));
            role_id = role_id.filter((e) => !isNaN(e))
            if (role_id.length > 0) {
                param.role_id = role_id;
            }
        }
        return roleListData(param)
    }, []);
    const [pageTagData, setPageTagData] = useState({
        tag_rows: [],
        tag_rows_error: null,
        tag_rows_loading: true,
        load_user_id: false
    })
    const getTagData = useCallback(function (uid) {
        return roleTags({
            user_id: parseInt(uid)
        })
    }, []);
    let configData = useCallback((userId) => {
        //@todo 关系应该不能全部已知,所以应该是搜索得到部分在查询
        // 关系应该要分组
        const user_access_keys = [
            {
                key: "vip1",
                name: "等级1",
                is_use: false,
                time: null
            },
            {
                key: "vip2",
                name: "等级2",
                is_use: false,
                time: null
            },
        ]
        let param = {
            user_id: userId,
            user_range: true,
            res_range: true,
        };
        param.relation_key = user_access_keys.map((e) => {
            return e.key
        });
        return roleOptions(param).then((data) => {
            if (!data.status) return data;

            return {
                ...data,
                user_access_keys: user_access_keys.map((item) => {
                    if (!data.exist_relation_role) {
                        return item;
                    } else {
                        let out = { ...item };
                        let sout = data.exist_relation_role.find((sitem) => {
                            return sitem.relation_key == item.key
                        });
                        if (sout) {
                            out.is_use = true;
                            out.time = sout.change_time;
                        }
                        return out;
                    }
                })
            }
        });
    });

    const loadRoleData = () => {
        let set_data = { ...pageTagData }
        let loadRow = () => {
            setPageRowData({
                ...pageRowData,
                rows_loading: true
            })
            getRowData(
                userId,
                searchParam.get("user_range"),
                searchParam.get("res_range"),
                searchParam.get("tag"),
                searchParam.get("role_id"),
                searchParam.get("role_name"),
                searchParam.get("page"),
                searchParam.get("page_size")
            ).then((data) => {
                if (!data.status) {
                    setPageRowData({
                        ...pageRowData,
                        rows_error: data.message,
                        rows_loading: false
                    })
                    return;
                }
                setPageRowData({
                    ...pageRowData,
                    rows: data.data ?? [],
                    rows_total: data.count ?? 0,
                    rows_loading: false
                })
            })
        };

        configData(userId).then((data) => {
            if (!data.status) {
                setPageTagData({
                    ...set_data,
                    tag_rows_error: data.message,
                    tag_rows_loading: false
                })
                return
            }
            setPageInitData({
                ...pageInitData,
                res_range: data.res_range ?? [],
                user_range: data.user_range ?? [],
                user_access_keys: data.user_access_keys ?? []
            });
            getTagData(userId).then((data) => {
                if (!data.status) {
                    setPageTagData({
                        ...set_data,
                        tag_rows_error: data.message,
                        tag_rows_loading: false
                    })
                    return;
                }
                if (pageTagData.load_user_id !== false) {
                    setfilterData({
                        tag: '',
                        res_id: '',
                        res_name: ''
                    })
                }
                setPageTagData({
                    ...set_data,
                    tag_rows: data.data ?? [],
                    tag_rows_loading: false
                })
                loadRow();
            })
        });
    }

    useEffect(loadRoleData, [searchParam])

    const [showPage, setShowPage] = useState({
        show: false,
        page: null,
        role: {}
    });

    let rpage;
    switch (showPage.page) {
        case "add":
            rpage = <UserRoleAdd
                onSave={(id, name, user_range) => {
                    setSearchParam({
                        role_id: id,
                        page: 0
                    }, loadRoleData)
                    if (user_range == 3) {
                        setShowPage({
                            show: true,
                            role: {
                                name: name,
                                id: id
                            },
                            page: "user"
                        });
                    }
                }}
                title="创建角色"
                tags={pageTagData.tag_rows}
                initData={pageInitData}
            />
            break;
        case "edit":
            rpage = <UserRoleAdd
                title="编辑角色"
                onSave={(id) => {
                    setSearchParam({
                        role_id: id,
                        page: 0
                    }, loadRoleData)
                }}
                tags={pageTagData.tag_rows}
                initData={pageInitData}
                rowData={showPage.role}
            />
            break;
        case "user":
            rpage = <UserRoleListUser roleId={showPage.role.id} roleName={showPage.role.name} />
            break;
    }



    const delRole = useCallback(function (role_id) {
        role_id = parseInt(role_id)
        if (isNaN(role_id) || role_id <= 0) return;
        let param = {
            role_id: role_id
        };
        return roleDelete(param);

    }, []);

    const columns = [
        {
            field: 'id',
            label: 'ID',
            align: "right",
            style: { width: 100, textAlign: "right", borderBottom: "1px solid #f3f3f3" }
        },
        {
            field: "name",
            label: '角色名',
            style: { width: 150, textAlign: "left", borderBottom: "1px solid #f3f3f3" }
        },
        {
            label: '用户范围',
            style: { width: 150, textAlign: "left", borderBottom: "1px solid #f3f3f3" },
            render: (row) => {
                let item = pageInitData.user_range.find((item) => {
                    return item.key == row.user_range
                })
                if (row.user_range == 3) {
                    return <Fragment>
                        <span style={{ marginRight: "3px" }}> {item ? item.name : row.user_range}</span>
                        <Button onClick={() => {
                            let pageItem = pageRowData.rows.find((e) => {
                                return e.role.id == row.id
                            })
                            if (!pageItem) {
                                return;
                            }
                            setShowPage({
                                show: true,
                                role: pageItem.role,
                                page: "user"
                            })
                        }}>查看({row.group_user ?? 0})</Button>
                    </Fragment>
                } else if (row.user_range == 4) {
                    return <Fragment>
                        <span> {item ? item.name : row.user_range}</span>
                        <b style={{
                            fontWeight: 700,
                            background: "#bebebe",
                            marginLeft: 5,
                            padding: "5px 9px",
                            borderRadius: 3,
                            color: " #fff"
                        }}>{row.relation_key}</b>
                    </Fragment>
                } else {
                    return item ? item.name : row.user_range;
                }
            }
        },
        {
            label: '资源范围',
            style: { width: 120, textAlign: "left", borderBottom: "1px solid #f3f3f3" },
            render: (row) => {
                let item = pageInitData.res_range.find((item) => {
                    return item.key == row.res_op_range
                })
                return item ? item.name : row.res_op_range;
            }
        },
        {
            field: 'priority',
            label: '优先级',
            style: { width: 80, textAlign: "center", borderBottom: "1px solid #f3f3f3" }
        },
        {
            field: 'change_user_id',
            label: '添加用户ID',
            style: { width: 100, textAlign: "center", borderBottom: "1px solid #f3f3f3" }
        },
        {
            label: '更新时间',
            style: { width: 180, textAlign: "left", borderBottom: "1px solid #f3f3f3" },
            render: (row) => {
                return showTime(row.change_time, "未知")
            }
        },
        {
            style: { width: 125, textAlign: "center", borderBottom: "1px solid #f3f3f3", borderLeft: "1px solid #f3f3f3" },
            label: '操作',
            rowSpan: 3,
            render: (row) => {
                return <Fragment>
                    <IconButton onClick={() => {
                        let pageItem = pageRowData.rows.find((e) => {
                            return e.role.id == row.id
                        })
                        if (!pageItem) {
                            return;
                        }
                        setShowPage({
                            show: true,
                            role: pageItem,
                            page: "edit"
                        })
                    }}><EditIcon fontSize="small" /></IconButton>
                    <ConfirmButton
                        message={`确定要删除角色 [${row.name}] 吗?`}
                        onAction={() => {
                            return delRole(row.id).then((data) => {
                                if (!data.status) return data;
                                let rows = pageRowData.rows.filter((item) => {
                                    if (item.role.id != row.id) return item;
                                })
                                setPageRowData({
                                    ...pageRowData,
                                    rows: rows,
                                    rows_total: pageRowData.rows_total - 1
                                })
                                if (rows.length == 0) {
                                    setSearchParam({
                                        tag: "",
                                        role_id: "",
                                        role_name: "",
                                        page: 0,
                                    }, loadRoleData)
                                }
                                return data;
                            })
                        }}
                        renderButton={(props) => {
                            return <IconButton {...props} size='small'>
                                <DeleteIcon fontSize='small' />
                            </IconButton>
                        }} />

                </Fragment>
            }
        },
    ];

    return <Fragment>
        <Drawer
            sx={{ zIndex: (theme) => theme.zIndex.drawer + 3 }}
            anchor={"right"}
            open={showPage.show}
            onClose={() => {
                setShowPage({
                    page: null,
                    show: false
                })
            }}
        >
            <Box
                sx={{ width: 600 }}
            >
                {rpage}
            </Box>
        </Drawer>
        <Paper
            component="form"
            sx={{ p: 2, display: 'flex', alignItems: 'center', marginBottom: 1, marginTop: 1, minWidth: 700 }}
        >
            <FormControl fullWidth sx={{ width: 110, mr: 1 }}>
                <InputLabel size="small" id="res-select-label">资源范围</InputLabel>
                <Select
                    disabled={pageTagData.tag_rows_loading}
                    size="small"
                    labelId="res-select-label"
                    id="res-select"
                    label="资源范围"
                    value={filterData.res_range}
                    onChange={(event) => {
                        setfilterData({
                            ...filterData,
                            res_range: event.target.value
                        })
                    }}
                >
                    <MenuItem value="">
                        全部
                    </MenuItem>
                    {
                        pageInitData.res_range.map((item) => {
                            return <MenuItem key={`res_range_${item.key}`} value={item.key}>{item.name}</MenuItem>
                        })
                    }
                </Select>
            </FormControl>
            <FormControl sx={{ width: 110, mr: 1 }}>
                <InputLabel size="small" id="user-select-label">用户范围</InputLabel>
                <Select

                    disabled={pageTagData.tag_rows_loading}
                    size="small"
                    labelId="user-select-label"
                    id="user-select"
                    label="用户范围"
                    value={filterData.user_range}
                    onChange={(e) => {
                        setfilterData({
                            ...filterData,
                            user_range: e.target.value
                        })
                    }}
                >
                    <MenuItem value="">
                        全部
                    </MenuItem>
                    {
                        pageInitData.user_range.map((item) => {
                            return <MenuItem key={`res_range_${item.key}`} value={item.key}>{item.name}</MenuItem>
                        })
                    }
                </Select>

            </FormControl>

            {pageTagData.tag_rows.length > 0 ? <TagSelect
                loading={pageTagData.tag_rows_loading}
                rows={pageTagData.tag_rows}
                onChange={(event) => {
                    setfilterData({
                        ...filterData,
                        tag: event.target.value
                    })
                }}
                value={filterData.tag}
            /> : null}
            <FormControl sx={{ mr: 1 }} size="small"  >
                <ClearTextField
                    sx={{ width: 95 }}
                    variant="outlined"
                    label={`角色ID`}
                    type="text"
                    name="code"
                    size="small"
                    value={filterData.role_id ?? ''}
                    onChange={(e, nval) => {
                        let value = (nval + '').replace(/[^0-9]+/, '');
                        setfilterData({
                            ...filterData,
                            role_id: value
                        });
                    }}
                />
            </FormControl>
            <FormControl sx={{ mr: 1 }} size="small"  >
                <ClearTextField
                    sx={{ width: 105 }}
                    variant="outlined"
                    label={`角色名称`}
                    type="text"
                    name="name"
                    size="small"
                    value={filterData.role_name ?? ''}
                    onChange={(e, nval) => {
                        setfilterData({
                            ...filterData,
                            role_name: nval
                        });
                    }}
                />
            </FormControl>
            <Button

                variant="outlined"
                size="medium"
                startIcon={<SearchIcon />}
                sx={{ mr: 1, p: "7px 15px" }}
                onClick={() => {
                    setSearchParam({
                        ...filterData,
                        page: 0
                    }, loadRoleData)
                }}
            >
                过滤
            </Button>
            <Button
                variant="outlined"
                size="medium"
                startIcon={<AddCircleOutlineIcon />}
                sx={{ mr: 1, p: "7px 15px" }}
                onClick={() => {
                    setShowPage({
                        show: true,
                        page: "add"
                    })
                }}
            >
                新增角色
            </Button>
        </Paper>
        <Box sx={{ border: "1px solid #ddd", borderRadius: 1 }}>
            {pageTagData.tag_rows_loading ?
                <Fragment>
                    <Progress />
                </Fragment> :
                pageTagData.tag_rows_error ?
                    <Alert severity="error">{pageTagData.tag_rows_error}</Alert> :
                    (pageRowData.rows && pageRowData.rows.length == 0) ? <BaseTableNoRows /> :
                        <Fragment>
                            <Table sx={{ mb: 0 }}
                                style={{ borderBottom: "2px solid #ccc" }}>
                                <BaseTableHead
                                    columns={columns}
                                />
                            </Table>
                            <List sx={{ pb: 0, mt: 0, pt: 0 }}>
                                {
                                    pageRowData.rows.map((item, i) => {
                                        return <UserRoleRow
                                            onTagClick={(tag) => {
                                                setSearchParam({
                                                    tag: tag
                                                }, loadRoleData)
                                            }}
                                            key={`key-access-item-${i}`}
                                            roleData={{
                                                ...item.role,
                                                group_user: item.users_group
                                            }}
                                            opData={item.ops}
                                            tagData={item.tags}
                                            columns={columns}
                                        />
                                    })
                                }
                            </List>
                            <Table>
                                <BaseTableFooter
                                    count={pageRowData.rows_total}
                                    page={parseInt(searchParam.get("page")) || 0}
                                    rowsPerPage={parseInt(searchParam.get("page_size")) || 10}
                                    onPageChange={(e, newPage) => {
                                        setSearchParam({

                                            page: newPage
                                        }, loadRoleData)
                                    }}
                                    onRowsPerPageChange={(e) => {
                                        setSearchParam({

                                            page_size: e.target.value,
                                            page: 0
                                        }, loadRoleData)
                                    }}
                                />
                            </Table></Fragment>
            }

        </Box>
    </Fragment >
}


UserRolePage.propTypes = {
    userId: PropTypes.number
};