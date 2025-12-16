package apitests

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"testing"
	"time"
)

// 测试配置
const (
	BaseURL     = "http://localhost:8080/api/v1"
	TestTimeout = 30 * time.Second
)

// HTTP客户端
var client = &http.Client{
	Timeout: TestTimeout,
}

// 响应结构
type APIResponse struct {
	Code int         `json:"code"`
	Msg  string      `json:"msg"`
	Data interface{} `json:"data"`
}

// 测试用户信息
type TestUser struct {
	Email    string
	UserID   string
	Nickname string
	Password string
	Token    string
}

// 全局测试用户
var (
	TestUser1 = &TestUser{
		Email:    "test1@example.com",
		UserID:   "test_user_001",
		Nickname: "测试用户1",
		Password: "Test123456",
	}
	TestUser2 = &TestUser{
		Email:    "test2@example.com",
		UserID:   "test_user_002",
		Nickname: "测试用户2",
		Password: "Test123456",
	}
	TestUser3 = &TestUser{
		Email:    "test3@example.com",
		UserID:   "test_user_003",
		Nickname: "测试用户3",
		Password: "Test123456",
	}
)

// HTTP请求辅助函数
func makeRequest(t *testing.T, method, url string, body interface{}, token string) (*APIResponse, *http.Response) {
	var reqBody io.Reader
	if body != nil {
		jsonData, err := json.Marshal(body)
		if err != nil {
			t.Fatalf("JSON序列化失败: %v", err)
		}
		reqBody = bytes.NewBuffer(jsonData)
	}

	req, err := http.NewRequest(method, url, reqBody)
	if err != nil {
		t.Fatalf("创建请求失败: %v", err)
	}

	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	resp, err := client.Do(req)
	if err != nil {
		t.Fatalf("请求失败: %v", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatalf("读取响应失败: %v", err)
	}

	var apiResp APIResponse
	if err := json.Unmarshal(respBody, &apiResp); err != nil {
		t.Fatalf("解析响应失败: %v, 响应内容: %s", err, string(respBody))
	}

	return &apiResp, resp
}

// 断言辅助函数
func assertEqual(t *testing.T, expected, actual interface{}, msg string) {
	if expected != actual {
		t.Errorf("%s: 期望 %v, 实际 %v", msg, expected, actual)
	}
}

func assertNotEqual(t *testing.T, expected, actual interface{}, msg string) {
	if expected == actual {
		t.Errorf("%s: 不应该等于 %v", msg, expected)
	}
}

func assertNotNil(t *testing.T, value interface{}, msg string) {
	if value == nil {
		t.Errorf("%s: 不应该为nil", msg)
	}
}

func assertNil(t *testing.T, value interface{}, msg string) {
	if value != nil {
		t.Errorf("%s: 应该为nil, 实际 %v", msg, value)
	}
}

func assertTrue(t *testing.T, condition bool, msg string) {
	if !condition {
		t.Errorf("%s: 应该为true", msg)
	}
}

func assertFalse(t *testing.T, condition bool, msg string) {
	if condition {
		t.Errorf("%s: 应该为false", msg)
	}
}

func assertSuccess(t *testing.T, resp *APIResponse, msg string) {
	if resp.Code != 0 {
		t.Errorf("%s: 应该成功(code=0), 实际 code=%d, msg=%s", msg, resp.Code, resp.Msg)
	}
}

func assertError(t *testing.T, resp *APIResponse, expectedCode int, msg string) {
	if resp.Code == 0 {
		t.Errorf("%s: 应该失败, 但返回成功", msg)
	}
	if expectedCode > 0 && resp.Code != expectedCode {
		t.Errorf("%s: 期望错误码 %d, 实际 %d", msg, expectedCode, resp.Code)
	}
}

// 测试报告结构
type TestReport struct {
	Module       string
	TotalTests   int
	PassedTests  int
	FailedTests  int
	SkippedTests int
	Duration     time.Duration
	TestResults  []TestResult
	StartTime    time.Time
	EndTime      time.Time
}

type TestResult struct {
	Name     string
	Status   string // PASS, FAIL, SKIP
	Duration time.Duration
	Error    string
}

// 全局测试报告
var GlobalReport = &TestReport{
	TestResults: make([]TestResult, 0),
	StartTime:   time.Now(),
}

// 添加测试结果
func AddTestResult(name, status string, duration time.Duration, err string) {
	GlobalReport.TestResults = append(GlobalReport.TestResults, TestResult{
		Name:     name,
		Status:   status,
		Duration: duration,
		Error:    err,
	})
	GlobalReport.TotalTests++
	switch status {
	case "PASS":
		GlobalReport.PassedTests++
	case "FAIL":
		GlobalReport.FailedTests++
	case "SKIP":
		GlobalReport.SkippedTests++
	}
}

// 生成测试报告
func GenerateReport(module string) string {
	GlobalReport.Module = module
	GlobalReport.EndTime = time.Now()
	GlobalReport.Duration = GlobalReport.EndTime.Sub(GlobalReport.StartTime)

	report := fmt.Sprintf("\n========================================\n")
	report += fmt.Sprintf("测试报告 - %s\n", module)
	report += fmt.Sprintf("========================================\n")
	report += fmt.Sprintf("开始时间: %s\n", GlobalReport.StartTime.Format("2006-01-02 15:04:05"))
	report += fmt.Sprintf("结束时间: %s\n", GlobalReport.EndTime.Format("2006-01-02 15:04:05"))
	report += fmt.Sprintf("总耗时: %v\n", GlobalReport.Duration)
	report += fmt.Sprintf("----------------------------------------\n")
	report += fmt.Sprintf("总测试数: %d\n", GlobalReport.TotalTests)
	report += fmt.Sprintf("通过: %d (%.1f%%)\n", GlobalReport.PassedTests,
		float64(GlobalReport.PassedTests)/float64(GlobalReport.TotalTests)*100)
	report += fmt.Sprintf("失败: %d (%.1f%%)\n", GlobalReport.FailedTests,
		float64(GlobalReport.FailedTests)/float64(GlobalReport.TotalTests)*100)
	report += fmt.Sprintf("跳过: %d (%.1f%%)\n", GlobalReport.SkippedTests,
		float64(GlobalReport.SkippedTests)/float64(GlobalReport.TotalTests)*100)
	report += fmt.Sprintf("========================================\n\n")

	report += "测试详情:\n"
	report += "----------------------------------------\n"
	for i, result := range GlobalReport.TestResults {
		status := "✓"
		if result.Status == "FAIL" {
			status = "✗"
		} else if result.Status == "SKIP" {
			status = "⊘"
		}
		report += fmt.Sprintf("%d. [%s] %s (耗时: %v)\n", i+1, status, result.Name, result.Duration)
		if result.Error != "" {
			report += fmt.Sprintf("   错误: %s\n", result.Error)
		}
	}

	return report
}

// 等待服务就绪
func WaitForService(t *testing.T) {
	maxRetries := 30
	for i := 0; i < maxRetries; i++ {
		resp, err := http.Get(BaseURL + "/ping")
		if err == nil && resp.StatusCode == 200 {
			t.Log("服务已就绪")
			resp.Body.Close()
			return
		}
		if resp != nil {
			resp.Body.Close()
		}
		time.Sleep(1 * time.Second)
	}
	t.Fatal("服务启动超时")
}
