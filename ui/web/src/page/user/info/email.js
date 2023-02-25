import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import { Alert, Button, Drawer, FormControl, InputLabel, MenuItem, Paper, Select } from '@mui/material';
import Box from '@mui/material/Box';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import randomString from 'random-string';
import React, { Fragment, useContext, useEffect, useState } from 'react';
import { ToastContext } from '../../../context/toast';
import { ConfirmButton } from '../../../library/dialog';
import { emailAdd, emailComfirmStatus, emailConfirm, emailDelete, emailList, emailSendCode } from '../../../rest/user';
import { useSearchChange } from '../../../utils/hook';
import { captchaSrc } from '../../../utils/rest';
import { showTime } from '../../../utils/utils';
import { AddBox, CodeBox, ConfirmBox } from './valid_box';

export default function UserEmailPage(props) {

    const comfirmStatus = emailComfirmStatus;
    //列表数据
    let [loadData, setLoadData] = useState({
        loading: true,
        status: false,
        data: [],
        message: null,
    });

    const [param, setParam] = useSearchChange({
        status: ""
    });
    const emailData = (status) => {
        setLoadData({
            ...loadData,
            loading: true
        })
        emailList(status).then((data) => {
            setLoadData({
                ...loadData,
                ...data,
                loading: false
            })
        })
    };
    const loadEmailData = () => {
        emailData(param.get("status"));
    }
    useEffect(loadEmailData, [param])
    const captchaType = 'add-email'
    const showCodeBox = (id, name) => {
        const captchaKey = randomString()
        setCodeData({
            ...codeData,
            id: id,
            name: name,
            captcha_key: captchaKey,
            captcha_src: captchaSrc(captchaType + '/' + captchaKey, true),
        })
        setChangeBox(2)
    }

    const showConfirmBox = (id, name) => {
        setConfrimData({
            ...confrimData,
            id: id,
            name: name,
        })
        setChangeBox(3)
    }
    //添加跟更新
    const [changeBoxState, setChangeBox] = useState(0);
    const { toast } = useContext(ToastContext);
    //add 
    const [addData, setAddData] = useState({
        name: '',
        loading: false,
    });
    const [addError, setAddError] = useState({
        name: '',
    });
    const doAdd = function () {
        setAddData({
            ...addData,
            loading: true
        })
        emailAdd({ email: addData.name }).then((data) => {

            if (!data.status) {
                toast(data.message)
                setAddError({
                    ...addError,
                    ...data.field
                })
                setAddData({
                    ...addData,
                    loading: false,
                })
            } else {
                showCodeBox(data.id, addData.name)
                setAddData({
                    ...addData,
                    name: '',
                    loading: false,
                })
                setParam({
                    status: comfirmStatus[0].key
                }, loadEmailData)
                emailData(param.get("status"));
            }
        })
    };

    //send code
    const [codeData, setCodeData] = useState({
        name: '',
        id: 0,
        captcha_val: '',
        captcha_key: '',
        captcha_src: '',
        loading: false,
    });
    const [codeError, setCodeError] = useState({
        captcha: '',
    });
    const doCode = function () {
        setCodeData({
            ...codeData,
            loading: true
        })
        emailSendCode({
            email: codeData.name,
            captcha_code: codeData.captcha_val,
            captcha_key: codeData.captcha_key
        }).then((data) => {
            if (!data.status) {
                toast(data.message)
                setCodeError({
                    ...codeError,
                    ...data.field
                })
                let catpcha = {};
                if (data.field.captcha) {
                    catpcha = {
                        captcha_src: captchaSrc(captchaType + "/" + codeData.captcha_key, true)
                    }
                }
                setCodeData({
                    ...codeData,
                    loading: false,
                    ...catpcha
                })
            } else {
                setCodeData({
                    ...codeData,
                    loading: false,
                    captcha_val: '',
                    captcha_src: captchaSrc(captchaType + "/" + codeData.captcha_key, true)
                })
                showConfirmBox(codeData.id, codeData.name)
            }
        })
    };

    //confirm code
    const [confrimData, setConfrimData] = useState({
        name: '',
        id: 0,
        code: '',
        loading: false,
    });
    const [confrimError, setConfrimError] = useState({
        code: '',
    });
    const doConfirm = function () {
        setConfrimData({
            ...confrimData,
            loading: true
        })
        emailConfirm({
            id: confrimData.id,
            code: confrimData.code,
        }).then((data) => {
            if (!data.status) {
                toast(data.message)
                setConfrimError({
                    ...confrimError,
                    ...data.field
                })
                setConfrimData({
                    ...confrimData,
                    loading: false
                })
            } else {
                toast("完成绑定")
                setParam({
                    status: comfirmStatus[1].key
                }, loadEmailData)
                setConfrimData({
                    ...confrimData,
                    loading: false,
                    code: ''
                })
                setChangeBox(0)
            }
        })
    };

    const columns = [
        {
            field: 'id',
            headerName: 'ID',
            width: 90,
            type: 'number',
        },
        {
            field: 'email',
            width: 250,
            headerName: '邮箱',
            sortable: false,

        },
        {
            field: 'status',
            headerName: '状态',
            sortable: false,
            valueGetter: (params) => {
                return comfirmStatus.find((e) => { return e.key == params.row.status })?.val ?? "未知";
            }
        },
        {
            field: 'add_time',
            width: 180,
            headerName: '添加时间',
            sortable: false,
            valueGetter: (params) => {
                return showTime(params.row.add_time, "未知")
            }
        },
        {
            field: 'confirm_time',
            width: 180,
            headerName: '确认时间',
            sortable: false,
            valueGetter: (params) => {
                return showTime(params.row.confirm_time, "未确认")
            }
        },
        {
            headerName: '操作',
            type: 'actions',
            field: "actions",
            align: "center",
            getActions: (params) => {
                let icon = [];
                if (params.row.status != 2) {
                    icon.push(
                        <GridActionsCellItem onClick={() => {
                            showCodeBox(params.row.id, params.row.email)
                        }} icon={<SendIcon />} label="发送验证邮件" />)
                }
                icon.push(<ConfirmButton
                    message={`确定要删除邮箱 [${params.row.email}] ?`}
                    onAction={() => {
                        return emailDelete(params.row.id).then((res) => {
                            if (!res.status) return res;
                            let rows = loadData.data.filter((item) => {
                                if (item.id != params.row.id) return item;
                            })
                            setLoadData({
                                ...loadData,
                                data: rows
                            })
                            toast("删除完成");
                            if (rows.length == 0) {
                                emailData(param.get("status"));
                            }
                            return res;
                        });
                    }}
                    renderButton={(props) => {
                        return <GridActionsCellItem {...props} icon={<DeleteIcon />} label="删除" />
                    }} />)
                return icon;
            }
        },
    ];

    let showBox
    switch (changeBoxState) {
        case 1:
            showBox = <AddBox
                title="添加邮箱"
                type="email"
                label="邮箱"
                placeholder="输入新邮箱"
                button="添加"
                onSubmit={() => {
                    doAdd()
                }}
                onChange={(e) => {
                    setAddData({
                        ...addData,
                        name: e.target.value
                    })
                    setAddError({
                        ...addError,
                        name: ''
                    })
                }}
                name={addData.name}
                nameError={addError.name}
                loading={addData.loading}
            />;
            break
        case 2:
            showBox = <CodeBox
                label="邮箱"
                title="添加邮箱"
                button="添加"
                onSubmit={doCode}
                onChange={(e) => {
                    setCodeData({
                        ...codeData,
                        captcha_val: e.target.value
                    })
                    setCodeError({
                        ...codeError,
                        captcha: ''
                    })
                }}
                name={codeData.name}
                codeError={codeError.captcha}
                code={codeData.captcha_val}
                loading={codeData.loading}
                captchaSrc={codeData.captcha_src}
            />
            break
        case 3:
            showBox = <ConfirmBox
                label="邮箱"
                title="确认邮件验证码"
                button="确认"
                onSubmit={doConfirm}
                onChange={(e) => {
                    setConfrimData({
                        ...confrimData,
                        code: e.target.value
                    })
                    setConfrimError({
                        ...confrimError,
                        code: ''
                    })
                }}
                name={confrimData.name}
                codeError={confrimError.code}
                code={confrimData.code}
                loading={confrimData.loading}
                onBack={() => {
                    showCodeBox(confrimData.id, confrimData.name)
                }}
            />
            break
    };


    const [emailStatus, setEmailStatus] = useState('');
    useEffect(() => {
        setEmailStatus(param.get("status"))
    }, [param])
    const execFilterData = () => {
        if (emailStatus) {
            setParam({
                status: emailStatus
            }, loadEmailData)
        } else {
            setParam({
                status: ""
            }, loadEmailData);
        }
    }

    return <Fragment>
        <Drawer
            sx={{ zIndex: (theme) => theme.zIndex.drawer + 3 }}
            anchor={"right"}
            open={changeBoxState != 0}
            onClose={() => {
                setChangeBox(0)
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
            component="form"
            sx={{ p: 2, display: 'flex', alignItems: 'center', marginBottom: 1, marginTop: 1 }}
        >
            <FormControl sx={{ minWidth: 120, mr: 1 }} size="small"  >
                <InputLabel id="select-small">状态</InputLabel>
                <Select
                    labelId="select-small"
                    id="select-small"
                    label="状态"
                    onChange={(event) => {
                        setEmailStatus(event.target.value);
                    }}
                    value={emailStatus ?? ''}
                >
                    <MenuItem value="">
                        全部
                    </MenuItem>
                    {
                        comfirmStatus.map((status) => {
                            return <MenuItem key={`status_${status.key}`} value={status.key}>{status.val}</MenuItem>
                        })
                    }
                </Select>
            </FormControl>
            <Button
                onClick={execFilterData}
                variant="outlined"
                size="medium"
                startIcon={<SearchIcon />}
                sx={{ mr: 1, p: "7px 15px" }}
            >
                过滤
            </Button>
            <Button
                variant="outlined"
                size="medium"
                startIcon={<AddCircleOutlineIcon />}
                sx={{ mr: 1, p: "7px 15px" }}
                onClick={() => {
                    setChangeBox(1)
                }}>
                绑定新邮箱
            </Button>
        </Paper>

        {(loadData.status || loadData.loading)
            ? <Box sx={{ height: 1, width: '100%' }}>
                < DataGrid
                    sx={{
                        "&.MuiDataGrid-root .MuiDataGrid-cell:focus-within": {
                            outline: "none !important",
                        },
                        "&.MuiDataGrid-root .MuiDataGrid-columnHeader:focus-within": {
                            outline: "none !important",
                        },
                    }}
                    rows={loadData.data}
                    columns={columns}
                    autoHeight={true}
                    autoPageSize={true}
                    pageSize={10}
                    disableColumnFilter={true}
                    disableColumnMenu={true}
                    disableSelectionOnClick={true}
                    rowCount={loadData.data.length}
                    editMode="cell"
                    loading={loadData.loading}
                />
            </Box> : <Alert severity="error">{loadData.message}</Alert>}
    </Fragment>
}