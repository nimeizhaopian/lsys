import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import { Alert, Autocomplete, Box, Button, Divider, Drawer, FormControl, FormLabel, Grid, IconButton, InputLabel, List, ListItem, MenuItem, Paper, Select, Skeleton, TableBody, TableCell, TableRow, TextField, Typography } from '@mui/material';
import Table from '@mui/material/Table';
import { Stack } from '@mui/system';
import React, { Fragment, useCallback, useContext, useEffect, useState } from 'react';
import { Form } from 'react-router-dom';
import { ToastContext } from '../../context/toast';
import { ConfirmButton } from '../../library/dialog';
import { ClearTextField, InputTagSelect, TagSelect } from '../../library/input';
import { LoadingButton, Progress } from '../../library/loading';
import { BaseTableBodyRow, BaseTableFooter, BaseTableHead, BaseTableNoRows } from '../../library/table_page';
import { resAdd, resAll, resDelete, resEdit, resListData, resTags } from '../../rest/access';
import { useSearchChange } from '../../utils/hook';
import { showTime } from '../../utils/utils';
import { ResOpItem, UserTags } from '../library/user';
//页面提交

export function AddBox(props) {
    const { tags, res_type, res, onSave } = props;
    let tags_options = (tags ?? []).map((e) => { return e[0] })

    let init_res_data = {
        res_type: res_type[0].key,
        loading: false,
        user_id: 0,
        res_name: '',
        res_key: '',
        res_key_open: false,
        tags: [],
        input_op_name: '',
        input_op_key: '',
        op_items: [],
    };
    const [resData, setResData] = useState(init_res_data);
    useEffect(() => {
        if (!res || !res.res || res.res.id <= 0) return;
        setResData({
            ...resData,
            res_type: res.res.user_id > 0 ? 2 : 1,
            user_id: res.res.user_id,
            res_name: res.res.name,
            res_key: res.res.res_key,
            tags: res.tags.map((e) => { return e.name }),
            op_items: res.ops.map((e) => {
                return {
                    op_name: e.name,
                    op_key: e.op_key,
                }
            }),
        })
    }, [props.item])
    const [res_keys, set_res_keys] = useState({
        keys: [],
        key_ops: {}
    });
    const get_res_keys = useCallback(function (
        user_id,
    ) {
        let param = {
            global_res: parseInt(user_id) == 0,
        };
        return resAll(param);
    }, []);
    useEffect(() => {
        get_res_keys(resData.user_id).then((data) => {
            if (data.status) {
                set_res_keys({
                    keys: data.data.map((e) => { return e.res }),
                    key_ops: data.data
                })
            }
        })
    }, [resData.user_id])


    const submitAdd = useCallback(function (
        user_id,
        key,
        name,
        ops,
        tags,
    ) {
        tags = tags.map((e) => {
            return e
                .replace(/^\s+/)
                .replace(/\s+$/)
        }).filter((e) => {
            return e.length > 0
        })
        ops = ops.map((e) => {
            if (!e.key || e.key.length <= 0 || !e.name || e.name.length <= 0) return;
            return e;
        }).filter((e) => { return e })
        let param = {
            user_id: parseInt(user_id),
            name: name,
            "key": key,
            "ops": ops,
            "tags": tags,
        };
        return resAdd(param);
    }, []);
    const submitEdit = useCallback(function (
        res_id,
        key,
        name,
        ops,
        tags,
    ) {
        tags = tags.map((e) => {
            return e
                .replace(/^\s+/)
                .replace(/\s+$/)
        }).filter((e) => {
            return e.length > 0
        })
        ops = ops.map((e) => {
            if (!e.key || e.key.length <= 0 || !e.name || e.name.length <= 0) return;
            return e;
        }).filter((e) => { return e })
        let param = {
            res_id: parseInt(res_id),
            name: name,
            key: key,
            ops: ops,
            tags: tags,
        };
        return resEdit(param);
    }, []);

    const { toast } = useContext(ToastContext);

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
                {res && res.res && res.res.id ? "编辑资源" : "创建资源"}
            </Typography>
            <Divider variant="middle" />
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
                        <FormControl fullWidth sx={{ mb: 2 }} >
                            <InputLabel size="small" id="res-add-select-label">选择资源</InputLabel>
                            <Select
                                onChange={(e) => {
                                    setResData({
                                        ...resData,
                                        user_id: 0,
                                        res_type: e.target.value
                                    })
                                }}
                                value={resData.res_type}
                                disabled={resData.loading || !!res}
                                size="small"
                                labelId="res-add-select-label"
                                id="res-add-select"
                                label="选择资源"
                            >
                                {res_type.map((item) => { return <MenuItem key={`res-type-${item.key}`} value={item.key}>{item.title}</MenuItem> })}
                            </Select>
                        </FormControl>
                        {
                            resData.res_type == 2 ? <TextField
                                label="用户ID"
                                size="small"
                                disabled={resData.loading || !!res}
                                placeholder="输入用户ID"
                                sx={{ width: 1, mb: 2 }}
                                variant="outlined"
                                value={resData.user_id > 0 ? resData.user_id : ''}
                                onChange={(e) => {
                                    if (!e || !e.target) return;
                                    let value = (e.target.value + '').replace(/[^0-9]+/, '');
                                    setResData({
                                        ...resData,
                                        user_id: value
                                    })
                                }}
                            /> : null
                        }


                        <TextField
                            label="名称"
                            variant="outlined"
                            name="name"
                            size="small"
                            disabled={resData.loading}
                            value={resData.res_name}
                            onChange={(e) => {
                                setResData({
                                    ...resData,
                                    res_name: e.target.value,
                                })
                            }}
                            sx={{
                                width: 1,
                                paddingBottom: 2
                            }}
                            required
                        />
                        <Autocomplete
                            sx={{
                                width: 1,
                                paddingBottom: 2
                            }}
                            disabled={resData.loading}
                            value={resData.res_key}
                            options={res_keys.keys}
                            open={resData.res_key_open}
                            getOptionLabel={(option) => option}
                            noOptionsText={"回车确认使用该值"}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    variant="outlined"
                                    label="标识符"
                                    size="small"
                                    placeholder="输入标识符"

                                    onFocus={() => {
                                        setResData({
                                            ...resData,
                                            res_key_open: true,
                                        })
                                    }}
                                    onBlur={() => {
                                        setResData({
                                            ...resData,
                                            res_key_open: false,
                                        })
                                    }}
                                    onKeyUp={(e) => {
                                        if (!res_keys.keys.map((item) => {
                                            return item == e.target.value
                                        })) {
                                            e.stopPropagation();
                                            e.preventDefault();

                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key != 'Enter')
                                            return
                                        setResData({
                                            ...resData,
                                            res_key: e.target.value,
                                            res_key_open: false,
                                        })
                                        e.stopPropagation();
                                        e.preventDefault();

                                    }}
                                />
                            )}
                        />
                        <InputTagSelect
                            name="tag"
                            size="small"
                            disabled={resData.loading}
                            options={tags_options}
                            value={resData.tags}
                            onChange={(value) => {
                                setResData({
                                    ...resData,
                                    tags: value
                                })
                            }}
                        />
                        <FormControl sx={{
                            mt: 2,
                            p: 1,
                            mb: 2,
                        }}>
                            <FormLabel style={{
                                position: "absolute",
                                transform: "translate(0, -12px) scale(0.75)"
                            }}>权限操作</FormLabel>
                            <Box className='MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-formControl MuiInputBase-sizeSmall'
                                style={{
                                    borderRadius: "4px"
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
                                }} ><span>权限操作</span></legend></fieldset>
                            </Box>
                            <Box sx={{ mt: "5px" }}>
                                {resData.op_items.length == 0 ? <div style={{
                                    textAlign: "center",
                                    fontSize: "0.9rem",
                                    color: "#999",
                                    lineHeight: 3
                                }}>请添加操作</div> : resData.op_items.map((item, i) => {
                                    return <ResOpItem
                                        key={`add-res-key-${i}`}
                                        style={{ margin: "8px 8px 0px 0px" }}
                                        name={item.op_name}
                                        opKey={item.op_key}
                                        onDelete={() => {
                                            let items = resData.op_items.map((dd) => {
                                                if (item.op_key != dd.op_key) {
                                                    return dd;
                                                }
                                            }).filter((e) => { return e });
                                            setResData({
                                                ...resData,
                                                op_items: items
                                            })
                                        }}
                                        onClick={(e, data) => {
                                            setResData({
                                                ...resData,
                                                input_op_name: data.name,
                                                input_op_key: data.opKey
                                            })
                                        }}
                                    />
                                })}

                            </Box>
                            <Divider sx={{ mb: 1, mt: 1 }}></Divider>
                            <Grid container spacing={1}>
                                <Grid item xs={5}>
                                    <TextField
                                        disabled={resData.loading}
                                        label="操作名称"
                                        variant="outlined"
                                        name="name"
                                        size="small"
                                        onChange={(e) => {
                                            setResData({
                                                ...resData,
                                                input_op_name: e.target.value
                                            })
                                        }}
                                        value={resData.input_op_name}

                                    />
                                </Grid>
                                <Grid item xs={5}>
                                    <TextField
                                        disabled={resData.loading}
                                        label="操作标识"
                                        variant="outlined"
                                        name="name"
                                        size="small"
                                        onChange={(e) => {
                                            setResData({
                                                ...resData,
                                                input_op_key: e.target.value
                                            })
                                        }}
                                        value={resData.input_op_key}

                                    />
                                </Grid>
                                <Grid item xs={2}>
                                    <Button variant="outlined"
                                        onClick={() => {
                                            if (resData.input_op_key == '' || resData.input_op_name == '') return

                                            let find = false;
                                            let items = resData.op_items.map((item) => {
                                                if (item.op_key == resData.input_op_key) {
                                                    find = true;
                                                    return {
                                                        op_key: item.op_key,
                                                        op_name: resData.input_op_name
                                                    }
                                                } else {
                                                    return item;
                                                }
                                            })
                                            if (!find) {
                                                items.push({
                                                    op_key: resData.input_op_key,
                                                    op_name: resData.input_op_name
                                                })
                                            }
                                            setResData({
                                                ...resData,
                                                op_items: items,
                                                input_op_name: '',
                                                input_op_key: ''
                                            })
                                        }}
                                        sx={{
                                            borderColor: "#aaa",
                                            minWidth: "30px",
                                            padding: "7px 14px",

                                            '&:hover svg': {
                                                color: '#1976d2'
                                            }
                                        }} >
                                        <AddCircleOutlineIcon sx={{
                                            color: "#666",
                                        }} />
                                    </Button>
                                </Grid>
                            </Grid>
                        </FormControl>
                    </Grid>
                    <Grid item xs={10}>
                        <LoadingButton sx={{
                            width: 1,
                            mb: 3
                        }} variant="contained"
                            loading={false}
                            disabled={false}
                            onClick={() => {
                                setResData({
                                    ...resData,
                                    loading: true
                                })
                                if (res && res.res && res.res.id > 0) {
                                    submitEdit(
                                        res.res.id,
                                        resData.res_key,
                                        resData.res_name,
                                        resData.op_items.map((e) => {
                                            return { name: e.op_name, key: e.op_key }
                                        }),
                                        resData.tags
                                    ).then((data) => {
                                        setResData({
                                            ...resData,
                                            loading: false
                                        })
                                        if (!data.status) {
                                            toast(data.message)
                                        } else {
                                            onSave(res.res.user_id, res.res.id)
                                            toast("保存完成");
                                        }
                                    })
                                } else {
                                    submitAdd(
                                        resData.user_id,
                                        resData.res_key,
                                        resData.res_name,
                                        resData.op_items.map((e) => {
                                            return { name: e.op_name, key: e.op_key }
                                        }),
                                        resData.tags
                                    ).then((data) => {
                                        if (!data.status) {
                                            toast(data.message)
                                            setResData({
                                                ...resData,
                                                loading: false
                                            })
                                        } else {
                                            toast("添加完成")
                                            onSave(resData.user_id, data.id)
                                            setResData(init_res_data)
                                        }
                                    })
                                }

                            }}
                        >{res && res.res && res.res.id ? "保存" : "添加"}</LoadingButton>
                    </Grid>
                </Grid>
            </Form ></Fragment >)
}


function UserAccessResItem(props) {
    const { item, columns, onTagClick } = props;

    let isTags = (item.tags ?? []).length > 0;

    let isOps = (item.ops ?? []).length > 0;

    return <ListItem key={`res-${item.res.id}`}
        sx={{
            borderBottom: "1px solid #ddd",
            "&:hover": {
                background: "#f9f9f9"
            }
        }} disablePadding>
        <Grid
            container
            direction="column"
            justifyContent="center"
            alignItems="center">
            <Table stickyHeader sx={{ width: 1 }}>
                <TableBody>
                    <BaseTableBodyRow
                        row={item.res ? item.res : {}}
                        columns={columns}
                        cellProps={{ style: { borderBottom: "1px solid #f0f0f0" } }}
                    />
                    {isOps ? <TableRow>
                        <TableCell colSpan={6} style={{ padding: 4, borderBottom: "1px solid #f0f0f0" }}>
                            <Grid container>
                                <Grid sx={{ width: 80, lineHeight: "52px", fontWeight: 500, fontSize: "0.875rem", textAlign: "right", mr: 1 }}>可用操作</Grid>
                                <Grid sx={{ flexGrow: 1 }}>
                                    {
                                        item.ops.map((op) => {
                                            return <ResOpItem
                                                style={{ margin: "8px 8px 0px 0px" }}
                                                key={`op-${item.res.id}-${op.id}`}
                                                name={op.name}
                                                opKey={op.op_key}
                                                tips={`最后修改时间:${showTime(op.change_time, "未知")}`} />
                                        })
                                    }
                                </Grid>
                            </Grid>
                        </TableCell>
                    </TableRow> : null}
                    {isTags ? <TableRow>
                        <TableCell colSpan={6} style={{ padding: 4, borderBottom: "1px solid #f0f0f0" }}>
                            <Grid container >
                                <Grid sx={{ width: 80, lineHeight: "52px", fontWeight: 500, fontSize: "0.875rem", textAlign: "right", mr: 1 }}>标记</Grid>
                                <Grid sx={{ flexGrow: 1, color: "#333", paddingTop: "2px" }}>
                                    {
                                        item.tags.map((tag) => {
                                            return <UserTags
                                                onClick={() => {
                                                    onTagClick(tag.name)
                                                }}
                                                name={tag.name}
                                                key={`res-${item.res.id}-${tag.id}`}
                                                sx={{ m: 1, ml: 0 }}
                                                tips={`添加于:${showTime(tag.change_time, "未知")}`}
                                            />
                                        })
                                    }
                                </Grid>
                            </Grid>
                        </TableCell>
                    </TableRow > : null}
                </TableBody>
            </Table>
        </Grid>
    </ListItem>;
}

export default function SystemAccessResPage(props) {
    //URL参数
    const [searchParam, setSearchParam] = useSearchChange({
        user_id: "0",
        tag: "",
        res_id: "",
        res_name: "",
        page: 0,
        page_size: 10,
    });




    //过滤组件数据
    const [filterData, setfilterData] = useState({
        tag: searchParam.get("tag"),
        res_id: searchParam.get("res_id"),
        res_name: searchParam.get("res_name")
    })

    useEffect(() => {
        setfilterData({
            ...filterData,
            tag: searchParam.get("tag"),
            res_id: searchParam.get("res_id"),
            res_name: searchParam.get("res_name")
        })
        setPageTagData({
            ...pageTagData,
            init: searchParam.get("user_id") == pageTagData.user_id,
            user_id: searchParam.get("user_id")
        })
    }, [searchParam])
    //左边弹层数据
    const [boxPage, setBoxPage] = useState({
        show: false,
        box: null,
        item: null
    });
    //初始化数据
    const [pageRowData, setPageRowData] = useState({
        rows: [],
        rows_total: 0,
        rows_error: null,
        rows_loading: true,
    })
    const getRowData = useCallback(function (user_id, tag, res_id, res_name, page, pageSize) {
        let param = {
            "user_id": parseInt(user_id),
            "tags": true,
            "ops": true,
            "page": {
                "page": parseInt(page) + 1,
                "limit": parseInt(pageSize)
            }
        };
        if (typeof tag == 'string' && tag.length > 0) {
            param.tags_filter = [tag];
        }
        if (typeof res_name == 'string' && res_name.length > 0) {
            param.res_name = res_name;
        }
        if (typeof res_id == 'string') {
            res_id = res_id.split(",").map((e) => parseInt(e));
            res_id = res_id.filter((e) => !isNaN(e))
            if (res_id.length > 0) {
                param.res_id = res_id;
            }
        }
        return resListData(param);
    }, [props]);
    const [pageTagData, setPageTagData] = useState({
        init: false,
        user_id: 0,
        user_focused: false,
        load_user_id: false,
        res_type: 1,
        tag_rows: [],
        tag_rows_error: null,
        tag_rows_loading: true,
    })
    const getTagData = useCallback(function (uid) {
        return resTags({
            user_id: parseInt(uid)
        });
    }, [props]);
    //页面数据初始化
    const loadResData = () => {
        let set_data = { ...pageTagData }
        if (!pageTagData.init) {
            let user_id = searchParam.get("user_id");
            let res_type = user_id > 0 ? 2 : 1;
            set_data = {
                ...set_data,
                init: true,
                tag_rows_loading: true,
                user_id: user_id,
                res_type: res_type,
            }
            setPageTagData(set_data)
        }

        let loadRow = () => {
            setPageRowData({
                ...pageRowData,
                rows_loading: true
            })
            getRowData(
                searchParam.get("user_id"),
                searchParam.get("tag"),
                searchParam.get("res_id"),
                searchParam.get("res_name"),
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
        let user_id = searchParam.get("user_id");
        user_id = parseInt(user_id);
        if (isNaN(user_id)) return;
        if (user_id === pageTagData.load_user_id) {
            loadRow();
        } else {
            getTagData(user_id).then((data) => {
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
                    load_user_id: user_id,
                    tag_rows: data.data ?? [],
                    tag_rows_loading: false
                })
                loadRow();
            })
        }

    };
    useEffect(loadResData, [searchParam])



    const res_type = [
        { key: 1, title: "系统资源" },
        { key: 2, title: "指定用户" },
    ]

    //渲染页面
    let boxData;
    switch (boxPage.box) {
        case "add":
            boxData = <AddBox
                tags={pageTagData.tag_rows}
                res_type={res_type}
                onSave={(user_id, id) => {
                    setSearchParam({
                        tag: "",
                        user_id: user_id,
                        res_id: id,
                        res_name: "",
                        page: 0
                    }, loadResData)
                }} />
            break;
        case "edit":
            boxData = <AddBox
                tags={pageTagData.tag_rows}
                res_type={res_type}
                res={boxPage.item}
                onSave={(user_id, id) => {
                    setSearchParam({
                        tag: "",
                        user_id: user_id,
                        res_id: id,
                        res_name: "",
                        page: 0
                    }, loadResData)
                }} />
            break;
    }
    let page_error;
    let tag_show = !pageTagData.tag_rows_loading;
    if (pageRowData.rows_error && pageRowData.rows_error != '') {
        page_error = pageRowData.rows_error;
    }
    if (pageTagData.tag_rows_error && pageTagData.tag_rows_error != '') {
        page_error = pageTagData.tag_rows_error;
        tag_show = false;
    }

    const delRes = (res_id) => {
        res_id = parseInt(res_id)
        if (isNaN(res_id) || res_id <= 0) return;
        let param = {
            res_id: res_id
        };
        return resDelete(param);
    }
    const { toast } = useContext(ToastContext);
    const columns = [
        {
            field: 'id',
            label: 'ID',
            align: "right",
            style: { width: 120, borderBottom: "1px solid #f3f3f3" }
        },
        {
            field: 'name',
            label: '名称',
            style: { width: 150, borderBottom: "1px solid #f3f3f3" }
        },
        {
            field: 'res_key',
            label: '标识符',
            style: { width: 150, borderBottom: "1px solid #f3f3f3" }
        },
        {
            field: 'change_time',
            label: '更新时间',
            style: { width: 140, borderBottom: "1px solid #f3f3f3" },
            render: (row) => {
                return showTime(row.add_time, "未知")
            }
        },
        {

            label: '资源用户ID',
            align: "center",
            style: { width: 120, borderBottom: "1px solid #f3f3f3" },
            render: (row) => {
                if (row.user_id == 0) {
                    return "系统用户"
                } else {
                    return row.user_id
                }
            }
        },
        {
            field: 'add_user_id',
            label: '添加用户ID',
            align: "center",
            style: { width: 120, borderBottom: "1px solid #f3f3f3" }
        },
        {
            style: { width: 120, borderBottom: "1px solid #f3f3f3", borderLeft: "1px solid #f3f3f3" },
            label: '操作',
            rowSpan: 3,
            align: "center",
            render: (row) => {
                return <Fragment>
                    <IconButton onClick={() => {
                        let item = pageRowData.rows.find((item) => {
                            return item.res.id == row.id
                        })
                        if (!item) return;
                        setBoxPage({
                            show: true,
                            box: "edit",
                            item: item
                        })
                    }}><EditIcon fontSize="small" /></IconButton>
                    <ConfirmButton
                        message={`确定要删除资源 [${row.name}] ?`}
                        onAction={() => {
                            return delRes(row.id).then((data) => {
                                if (!data.status) return data;
                                let rows = pageRowData.rows.filter((item) => {
                                    if (item.res.id != row.id) return item;
                                })
                                setPageRowData({
                                    ...pageRowData,
                                    rows: rows,
                                    rows_total: pageRowData.rows_total - 1,
                                })
                                if (rows.length == 0) {
                                    setSearchParam({
                                        tag: "",
                                        res_id: "",
                                        res_name: "",
                                        page: 0
                                    }, loadResData)
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
            open={boxPage.show}
            onClose={() => {
                setBoxPage({
                    page: null,
                    show: false
                })
            }}
        >
            <Box
                sx={{ width: 450 }}
            >
                {boxData}
            </Box>
        </Drawer>
        <Paper
            component="form"
            sx={{ p: 2, display: 'flex', alignItems: 'center', marginBottom: 1, marginTop: 1, minWidth: 770 }}
        >
            <Stack direction="row" spacing={1} sx={{ mr: 2 }}>
                <FormControl >
                    <InputLabel size="small" id="res-select-label">资源类型</InputLabel>
                    <Select
                        disabled={pageTagData.tag_rows_loading}
                        size="small"
                        labelId="res-select-label"
                        id="res-select"
                        label="资源类型"
                        onChange={(e) => {
                            setPageTagData({
                                ...pageTagData,
                                res_type: e.target.value
                            })
                        }}
                        value={pageTagData.res_type}
                    >
                        {res_type.map((item) => { return <MenuItem key={`res-type-${item.key}`} value={item.key}>{item.title}</MenuItem> })}
                    </Select>
                </FormControl>
                {
                    pageTagData.res_type == 2 ? <ClearTextField
                        label="用户ID"
                        size="small"
                        disabled={pageTagData.tag_rows_loading}
                        placeholder="输入用户ID"
                        sx={{ width: 100 }}
                        variant="outlined"
                        focused={pageTagData.user_focused}
                        value={pageTagData.user_id > 0 ? pageTagData.user_id : ''}
                        onChange={(e, nval) => {
                            if (!e || !e.target) return;
                            let value = (nval + '').replace(/[^0-9]+/, '');
                            setPageTagData({
                                ...pageTagData,
                                user_id: value
                            })
                        }}
                        onKeyUp={(e) => {
                            if (e.key != 'Enter') return;
                            setSearchParam({
                                user_id: pageTagData.user_id,
                            }, loadResData)
                        }}
                    /> : null
                }
                <LoadingButton
                    variant="outlined"
                    size="small"
                    loading={pageTagData.tag_rows_loading}
                    disabled={pageTagData.tag_rows_loading}
                    startIcon={<SearchIcon />}
                    onClick={() => {
                        if (pageTagData.res_type == 2
                            && (pageTagData.user_id == 0 || pageTagData.user_id == '')) {
                            setPageTagData({
                                ...pageTagData,
                                user_focused: true
                            })
                            return;
                        }
                        setSearchParam({
                            user_id: pageTagData.res_type == 1 ? 0 : pageTagData.user_id,
                            tag: "",
                            res_id: "",
                            res_name: "",
                            page: 0,
                        }, loadResData)
                    }}
                    sx={{ pt: "4px" }}
                >查询</LoadingButton>
            </Stack >
            {
                (tag_show) ?
                    <Box>
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
                        <FormControl size="small"  >
                            <ClearTextField
                                sx={{ mr: 1, width: 100 }}
                                variant="outlined"
                                label={`资源ID`}
                                type="text"
                                name="code"
                                size="small"

                                value={filterData.res_id}
                                onChange={(e, nval) => {
                                    let value = (nval + '').replace(/[^0-9]+/, '');
                                    setfilterData({
                                        ...filterData,
                                        res_id: value
                                    });
                                }}
                            />
                        </FormControl>
                        <FormControl sx={{ minWidth: 120 }} size="small"  >
                            <ClearTextField
                                sx={{ mr: 1, width: 150 }}
                                variant="outlined"
                                label={`资源名称`}
                                type="text"
                                name="code"
                                size="small"
                                value={filterData.res_name}
                                onChange={(e, nval) => {
                                    setfilterData({
                                        ...filterData,
                                        res_name: nval
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
                                    ...filterData
                                }, loadResData)
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
                                setBoxPage({
                                    ...boxPage,
                                    show: true,
                                    box: "add"
                                })
                            }}
                        >
                            新增资源
                        </Button>
                    </Box> : null
            }
        </Paper>
        <Box sx={{ border: "1px solid #ddd", borderRadius: 1 }}>
            {!page_error ? (!pageRowData.rows_loading ? (
                pageRowData.rows.length > 0 ?
                    <Fragment>
                        <Table stickyHeader

                            style={{ borderBottom: "1px solid #ccc" }}>
                            <BaseTableHead
                                columns={columns}
                            />
                        </Table>
                        <List sx={{ pb: 0, mt: 0, pt: 0 }}>
                            {
                                pageRowData.rows.map((item) => {
                                    return <UserAccessResItem
                                        columns={columns}
                                        item={item}
                                        key={`item-${item.res.id}`}
                                        onTagClick={(tag) => {
                                            setSearchParam({
                                                tag: tag
                                            }, loadResData)
                                        }} />
                                })
                            }
                        </List>
                        <Table>
                            <BaseTableFooter
                                count={pageRowData.rows_total}
                                page={parseInt(searchParam.get("page")) || 0}
                                onPageChange={(e, newPage) => {
                                    setSearchParam({

                                        page: newPage
                                    }, loadResData)
                                }}
                                rowsPerPage={parseInt(searchParam.get("page_size")) || 10}
                                onRowsPerPageChange={(e) => {
                                    setSearchParam({

                                        page_size: e.target.value,
                                        page: 0
                                    }, loadResData)
                                }}
                            />
                        </Table>
                    </Fragment> :
                    <BaseTableNoRows />
            ) :
                <Fragment>
                    <Progress />
                    <Box sx={{ m: 2 }}>
                        <Typography variant="h3"> <Skeleton /></Typography>
                        <Typography variant="h1"> <Skeleton /></Typography>
                    </Box>
                </Fragment>) :
                <Alert severity="error">{page_error}</Alert>
            }
        </Box >
    </Fragment >
}