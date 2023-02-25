package main

import (
	"context"
	"fmt"
	lSysApi "lsysrest/lsysrest"
	"testing"
)

func TestSms(t *testing.T) {
	sysApi := lSysApi.NewRestApi(&lSysApi.RestApiConfig{
		//应用在 http://175.178.90.181/ui/#/user/app 申请
		AppId:          "1212f",                            //应用ID
		AppSecret:      "3f95638a1e07b87df2b64e09c2541dac", //应用Secret
		AppHost:        "http://175.178.90.181",            //应用HOST
		AppOAuthSecret: "2a97bf1b4f075b0ca7467e7c6b223f89", //应用OauthSecret
		AppOAuthHost:   "http://175.178.90.181/ui/oauth.html",
	})

	//示例1
	//app信息获取
	err1 := sysApi.SmsSend(
		context.Background(),
		[]string{
			"13800138000",
		},
		"dddd",
		map[string]string{
			"code": "sss",
		},
		"", //非必须 例:2023-12-11 11:11:11
		"", //取消句柄,取消发送用 例:dddd
	)
	if err1 == nil {
		fmt.Printf("ok")
	} else {
		fmt.Printf("err :%s \n", err1)
	}

	////取消发送
	//err1 = sysApi.SmsCancel(context.Background(), "dddd")
	//if err1 == nil {
	//	fmt.Printf("ok")
	//} else {
	//	fmt.Printf("err :%s \n", err1)
	//}
}