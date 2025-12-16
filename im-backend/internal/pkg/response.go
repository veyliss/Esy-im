package pkg

import (
	"encoding/json"
	"log"
	"net/http"
)

type Response struct {
	Code int         `json:"code"` // 状态码（业务层的，不是HTTP）
	Msg  string      `json:"msg"`  // 提示信息
	Data interface{} `json:"data"` // 返回数据
}

// Success 成功响应
func Success(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(Response{
		Code: 0,
		Msg:  "success",
		Data: data,
	})
}

// Error 失败响应
func Error(w http.ResponseWriter, code int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK) // 即使失败也返回200，靠 code 判断
	_ = json.NewEncoder(w).Encode(Response{
		Code: code,
		Msg:  msg,
		Data: nil,
	})
}

// ErrorWithAppError 使用AppError响应
func ErrorWithAppError(w http.ResponseWriter, err *AppError, showDetail bool) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	msg := err.Message
	// 开发环境显示详细错误信息
	if showDetail && err.Detail != "" {
		msg = msg + ": " + err.Detail
	}

	// 记录错误日志
	if err.Err != nil {
		log.Printf("[Error] Code=%d, Message=%s, Detail=%s, Err=%v", err.Code, err.Message, err.Detail, err.Err)
	} else {
		log.Printf("[Error] Code=%d, Message=%s, Detail=%s", err.Code, err.Message, err.Detail)
	}

	_ = json.NewEncoder(w).Encode(Response{
		Code: int(err.Code),
		Msg:  msg,
		Data: nil,
	})
}

// HandleError 统一错误处理
func HandleError(w http.ResponseWriter, err error, defaultCode ErrorCode) {
	if err == nil {
		return
	}

	// 判断是否为AppError
	if appErr, ok := err.(*AppError); ok {
		ErrorWithAppError(w, appErr, true) // TODO: 根据环境变量决定是否显示详情
		return
	}

	// 未知错误，使用默认错误码
	appErr := NewAppErrorWithErr(defaultCode, err.Error(), err)
	ErrorWithAppError(w, appErr, true)
}
