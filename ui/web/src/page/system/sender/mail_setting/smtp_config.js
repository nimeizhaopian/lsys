
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Alert, Button, Divider, Drawer, FormControl, Grid, IconButton, Paper, Table, TableContainer, TextField, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import React, { Fragment, useContext, useEffect, useState } from 'react';
import { Form } from 'react-router-dom';
import { UserSessionContext } from '../../../../context/session';
import { ToastContext } from '../../../../context/toast';
import { ConfirmButton } from '../../../../library/dialog';
import { ClearTextField } from '../../../../library/input';
import { LoadingButton } from '../../../../library/loading';
import { BaseTableBody, BaseTableHead } from '../../../../library/table_page';
import { mailAddSmtpConfig, mailDelSmtpConfig, mailEditSmtpConfig, mailListSmtpConfig } from '../../../../rest/sender_setting';
import { useSearchChange } from '../../../../utils/hook';
import { showTime } from '../../../../utils/utils';




function AddBox(props) {
    const {
        rowData,
        onFinish
    } = props;

    const { toast } = useContext(ToastContext);

    let [addData, setAddData] = useState({
        name: rowData ? rowData.name : '',
        host: rowData ? rowData.host : '',
        port: rowData ? rowData.port : '25',
        timeout: rowData ? rowData.timeout : '60',
        user: rowData ? rowData.user : '',
        email: rowData ? rowData.email : '',
        password: rowData ? rowData.password : '',
        tls_domain: rowData ? rowData.tls_domain : '',
        loading: false,
    });
    const [addError, setAddError] = useState({
        name: '',
        host: '',
        port: '',
        timeout: '',
        user: '',
        email: '',
        password: '',
        tls_domain: '',
    });

    let onSubmit = () => {
        setAddData({
            ...addData,
            loading: true
        })
        if (rowData && rowData.id) {

            mailEditSmtpConfig({
                id: rowData.id,
                name: addData.name,
                host: addData.host,
                port: addData.port,
                timeout: addData.timeout,
                user: addData.user,
                email: addData.email,
                password: addData.password,
                tls_domain: addData.tls_domain,
            }).then((data) => {
                if (!data.status) {
                    toast(data.message)
                    setAddError({
                        ...addError,
                        ...data.field
                    })
                    setAddData({
                        ...addData,
                        loading: false
                    })
                } else {
                    setAddError({
                        name: '',
                        host: '',
                        port: '',
                        timeout: '',
                        user: '',
                        password: '',
                        tls_domain: '',
                    })
                    setAddData({
                        ...addData,
                        loading: false
                    })
                    onFinish(rowData.id);
                }
            })
        } else {
            mailAddSmtpConfig({
                name: addData.name,
                host: addData.host,
                port: addData.port,
                timeout: addData.timeout,
                user: addData.user,
                email: addData.email,
                password: addData.password,
                tls_domain: addData.tls_domain,
            }).then((data) => {
                if (!data.status) {
                    toast(data.message)
                    setAddError({
                        ...addError,
                        ...data.field
                    })
                    setAddData({
                        ...addData,
                        loading: false
                    })
                } else {
                    setAddError({
                        name: '',
                        host: '',
                        port: '',
                        timeout: '',
                        user: '',
                        password: '',
                        tls_domain: '',
                    })
                    setAddData({
                        name: '',
                        host: '',
                        port: '',
                        timeout: '60',
                        user: '',
                        password: '',
                        tls_domain: '',
                        loading: false
                    })
                    onFinish(data.id);
                }
            })
        }

    };


    return (
        <Fragment>
            <Typography
                align="center"
                variant="subtitle1"
                noWrap
                sx={{
                    mt: 5,
                    mb: 2,
                    fontWeight: 100,
                    alignItems: "center",
                    letterSpacing: '.3rem',
                    color: 'inherit',
                    textDecoration: 'none',
                }}
            >
                邮件发送服务器配置
            </Typography>
            <Divider variant="middle" />
            <Form method="post" onSubmit={(e) => {
                e.preventDefault();
                onSubmit()
            }}>
                <Grid
                    sx={{
                        mt: 5,
                    }}
                    container
                    justifyContent="center"
                    alignItems="center"
                >
                    <Grid item xs={10}>
                        <TextField
                            variant="outlined"
                            label="配置名"
                            type="text"
                            name="name"
                            size="small"
                            onChange={(e) => {
                                setAddData({
                                    ...addData,
                                    name: e.target.value
                                })
                            }}
                            value={addData.name}
                            sx={{
                                width: 1,
                                paddingBottom: 2
                            }}
                            required
                            disabled={addData.loading}
                            error={!!addError.name}
                            helperText={addError.name}
                        />
                    </Grid>
                    <Grid item xs={10}>
                        <TextField
                            variant="outlined"
                            label="smtp host"
                            type="text"
                            name="host"
                            size="small"
                            onChange={(e) => {
                                setAddData({
                                    ...addData,
                                    host: e.target.value
                                })
                            }}
                            value={addData.host}
                            sx={{
                                width: 1,
                                paddingBottom: 2
                            }}
                            required
                            disabled={addData.loading}
                            error={!!addError.host}
                            helperText={addError.host}
                        />
                    </Grid>
                    <Grid item xs={10}>
                        <TextField
                            variant="outlined"
                            label="smtp 端口"
                            type="text"
                            name="port"
                            size="small"
                            onChange={(e) => {
                                setAddData({
                                    ...addData,
                                    port: e.target.value
                                })
                            }}
                            value={addData.port}
                            sx={{
                                width: 1,
                                paddingBottom: 2
                            }}
                            required
                            disabled={addData.loading}
                            error={!!addError.port}
                            helperText={addError.port}
                        />
                    </Grid>
                    <Grid item xs={10}>
                        <TextField
                            variant="outlined"
                            label="连接超时[秒]"
                            type="text"
                            name="timeout"
                            size="small"
                            onChange={(e) => {
                                setAddData({
                                    ...addData,
                                    timeout: e.target.value
                                })
                            }}
                            value={addData.timeout}
                            sx={{
                                width: 1,
                                paddingBottom: 2
                            }}
                            required
                            disabled={addData.loading}
                            error={!!addError.timeout}
                            helperText={addError.timeout}
                        />
                    </Grid>
                    <Grid item xs={10}>
                        <TextField
                            variant="outlined"
                            label="smtp 用户名[不使用留空]"
                            type="text"
                            name="user"
                            size="small"
                            onChange={(e) => {
                                setAddData({
                                    ...addData,
                                    user: e.target.value
                                })
                            }}
                            value={addData.user}
                            sx={{
                                width: 1,
                                paddingBottom: 2
                            }}

                            disabled={addData.loading}
                            error={!!addError.user}
                            helperText={addError.user}
                        />
                    </Grid>
                    <Grid item xs={10}>
                        <TextField
                            variant="outlined"
                            label="smtp 密码[不使用留空]"
                            type="text"
                            name="password"
                            size="small"
                            onChange={(e) => {
                                setAddData({
                                    ...addData,
                                    password: e.target.value
                                })
                            }}
                            value={addData.password}
                            sx={{
                                width: 1,
                                paddingBottom: 2
                            }}

                            disabled={addData.loading}
                            error={!!addError.password}
                            helperText={addError.password}
                        />
                    </Grid>
                    <Grid item xs={10}>
                        <TextField
                            variant="outlined"
                            label="邮箱地址"
                            type="text"
                            name="email"
                            size="small"
                            onChange={(e) => {
                                setAddData({
                                    ...addData,
                                    email: e.target.value
                                })
                            }}
                            value={addData.email}
                            sx={{
                                width: 1,
                                paddingBottom: 2
                            }}
                            disabled={addData.loading}
                            error={!!addError.email}
                            helperText={addError.email}
                        />
                    </Grid>
                    <Grid item xs={10}>
                        <TextField
                            variant="outlined"
                            label="TLS 验证域名[不使用留空]"
                            type="text"
                            name="tls_domain"
                            size="small"
                            onChange={(e) => {
                                setAddData({
                                    ...addData,
                                    tls_domain: e.target.value
                                })
                            }}
                            value={addData.tls_domain}
                            sx={{
                                width: 1,
                                paddingBottom: 2
                            }}
                            disabled={addData.loading}
                            error={!!addError.tls_domain}
                            helperText={addError.tls_domain}
                        />
                    </Grid>
                    <Grid item xs={10}>
                        <LoadingButton sx={{
                            width: 1,
                        }} variant="contained" type="submit" loading={addData.loading} disabled={addData.loading} >{rowData ? "修改" : "添加"}</LoadingButton>
                    </Grid>
                </Grid>
            </Form ></Fragment>)
}


export default function SystemSmsSettingSmtpMailPage(props) {
    const { userData } = useContext(UserSessionContext)
    let [loadData, setLoadData] = useState({
        status: false,
        message: null,
        loading: true,
        data: [],
        total: 0,
    });

    const columns = [
        {
            field: 'id',
            label: 'ID',
            align: "right",
            style: { width: 90 }
        },
        {
            field: 'name',
            style: { width: 100 },
            label: '配置名',
        },
        {

            style: { width: 150 },
            label: '主机:端口',
            render: (row) => {
                return row.host + ":" + row.port
            }
        },
        {
            style: { width: 80 },
            label: '发送邮箱',
            render: (row) => {
                return row.email
            }
        },
        {
            style: { width: 80 },
            label: '用户',
            render: (row) => {
                return row.user + ":" + row.password
            }
        },
        {

            style: { width: 80 },
            label: '超时',
            align: "right",
            render: (row) => {
                return row.timeout
            }
        },
        {
            field: 'tls_domain',
            label: 'TLS 校验域名',
            style: { width: 120 }
        },
        {

            style: { width: 120 },
            label: '更新用户ID',
            align: "right",
            render: (row) => {
                return row.change_user_id
            }
        },
        {

            style: { width: 170 },
            label: '更新时间',
            render: (row) => {
                return showTime(row.change_time, "未知")
            }
        },
        {
            label: '操作',
            align: "center",
            render: (row) => {
                let delAction = () => {
                    return mailDelSmtpConfig({ id: row.id }).then((data) => {
                        if (!data.status) return data;
                        let rows = loadData.data.filter((item) => {
                            if (item.id == row.id) return null;
                            return item;
                        })
                        setLoadData({
                            ...loadData,
                            data: rows
                        })
                        return data;
                    })
                };
                return <Fragment>
                    <IconButton size='small' onClick={() => {
                        setChangeBox({ data: row, show: 2 })
                    }}>
                        <EditIcon fontSize="small" />
                    </IconButton>
                    <ConfirmButton
                        message={`确定删除配置 [${row.name}] 吗?`}
                        onAction={delAction}
                        renderButton={(props) => {
                            return <IconButton  {...props} size='small' ><DeleteIcon fontSize="small" /></IconButton>
                        }} />
                </Fragment>
            }
        },
    ];
    const [searchParam, setSearchParam] = useSearchChange({
        id: "",
    });
    const [filterData, setfilterData] = useState({
        id: searchParam.get("id")
    })
    const loadConfigData = () => {
        setLoadData({
            ...loadData,
            loading: true
        })
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        return mailListSmtpConfig({
            id: searchParam.get("id"),
            full_data: true
        }).then((data) => {

            setLoadData({
                ...loadData,
                ...data,
                data: data.status ? data.data : [],
                loading: false
            })
        })
    }
    useEffect(() => {
        setfilterData({
            ...filterData,
            id: searchParam.get("id")
        })
        loadConfigData()
    }, [searchParam])


    //添加跟更新
    const [changeBoxState, setChangeBox] = useState({
        show: 0,
        data: {}
    });
    let showBox
    switch (changeBoxState.show) {
        case 1:
            showBox = <AddBox
                onFinish={(id) => {
                    setChangeBox({ data: {}, show: 0 })
                    setSearchParam({
                        ...filterData,
                        id: id
                    }, loadConfigData)
                }}
            />;
            break
        case 2:
            showBox = <AddBox
                rowData={changeBoxState.data}
                onFinish={(id) => {
                    setChangeBox({ data: {}, show: 0 })
                    setSearchParam({
                        ...filterData,
                        id: id
                    }, loadConfigData)
                }}
            />;
            break
    };



    return <Fragment>
        <Drawer
            sx={{ zIndex: (theme) => theme.zIndex.drawer + 3 }}
            anchor={"right"}
            open={changeBoxState.show != 0}
            onClose={() => {
                setChangeBox({ data: {}, show: 0 })
            }}
        >
            <Box
                sx={{ width: 450 }}
                role="presentation"
            >
                {showBox}
            </Box>
        </Drawer>
        <Paper
            sx={{ p: 2, display: 'flex', alignItems: 'center', marginBottom: 1, marginTop: 1 }}
        >
            <FormControl sx={{ minWidth: 80, mr: 1 }} size="small"  >
                <ClearTextField
                    sx={{ mr: 1 }}
                    variant="outlined"
                    label={`ID`}
                    type="text"
                    name="code"
                    value={filterData.id}
                    size="small"
                    disabled={loadData.loading}
                    onChange={(event, nval) => {
                        setfilterData({
                            ...filterData,
                            id: nval
                        })
                    }}
                />
            </FormControl>
            <LoadingButton
                onClick={() => {
                    setSearchParam({
                        ...filterData,
                    }, loadConfigData)
                }}
                variant="outlined"
                size="medium"
                startIcon={<SearchIcon />}
                sx={{ mr: 1, p: "7px 15px", minWidth: 85 }}
                loading={loadData.loading}
            >
                过滤
            </LoadingButton>
            <Button
                variant="outlined"
                size="medium"
                startIcon={<AddCircleOutlineIcon />}
                sx={{ mr: 1, p: "7px 15px" }}
                onClick={() => {
                    setChangeBox({ data: {}, show: 1 })
                }}>
                新增配置
            </Button>
        </Paper>

        {(loadData.status || loadData.loading)
            ? <Box sx={{ height: 1, width: '100%' }}>
                <TableContainer component={Paper}>
                    <Table>
                        <BaseTableHead
                            columns={columns}
                        />
                        <BaseTableBody
                            columns={columns}
                            loading={loadData.loading}
                            rows={loadData.data ?? []}
                        />
                    </Table>
                </TableContainer>
            </Box> : <Alert severity="error">{loadData.message}</Alert>}
    </Fragment>
}


