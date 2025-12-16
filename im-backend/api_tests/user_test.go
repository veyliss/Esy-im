package apitests

import (
	"fmt"
	"testing"
	"time"
)

// TestUserManagement 测试用户管理模块
func TestUserManagement(t *testing.T) {
	// 等待服务就绪
	WaitForService(t)

	t.Run("测试健康检查", testHealthCheck)
	t.Run("测试密码注册-正常流程", testRegisterWithPassword)
	t.Run("测试密码注册-参数校验", testRegisterWithPasswordValidation)
	t.Run("测试密码注册-重复注册", testRegisterWithPasswordDuplicate)
	t.Run("测试密码登录-正常流程", testLoginWithPassword)
	t.Run("测试密码登录-错误密码", testLoginWithWrongPassword)
	t.Run("测试密码登录-不存在的用户", testLoginWithNonexistentUser)
	t.Run("测试获取个人信息-需要认证", testGetMe)
	t.Run("测试获取个人信息-无Token", testGetMeWithoutToken)
	t.Run("测试获取个人信息-错误Token", testGetMeWithInvalidToken)
	t.Run("测试登出", testLogout)
	t.Run("测试设置密码", testSetPassword)
}

// testHealthCheck 测试健康检查
func testHealthCheck(t *testing.T) {
	start := time.Now()
	resp, _ := makeRequest(t, "GET", BaseURL+"/ping", nil, "")
	duration := time.Since(start)

	if resp.Code == 0 {
		AddTestResult("健康检查", "PASS", duration, "")
		t.Log("✓ 健康检查通过")
	} else {
		AddTestResult("健康检查", "FAIL", duration, fmt.Sprintf("code=%d, msg=%s", resp.Code, resp.Msg))
		t.Errorf("✗ 健康检查失败")
	}
}

// testRegisterWithPassword 测试密码注册-正常流程
func testRegisterWithPassword(t *testing.T) {
	start := time.Now()
	timestamp := time.Now().Unix()
	
	reqBody := map[string]interface{}{
		"email":    fmt.Sprintf("test_user_%d@example.com", timestamp),
		"user_id":  fmt.Sprintf("test_user_%d", timestamp),
		"nickname": fmt.Sprintf("测试用户%d", timestamp),
		"password": "Test123456",
	}

	resp, _ := makeRequest(t, "POST", BaseURL+"/users/register-pwd", reqBody, "")
	duration := time.Since(start)

	if resp.Code == 0 {
		AddTestResult("密码注册-正常流程", "PASS", duration, "")
		t.Logf("✓ 密码注册成功")
	} else {
		AddTestResult("密码注册-正常流程", "FAIL", duration, fmt.Sprintf("code=%d, msg=%s", resp.Code, resp.Msg))
		t.Errorf("✗ 密码注册失败: code=%d, msg=%s", resp.Code, resp.Msg)
	}
}

// testRegisterWithPasswordValidation 测试密码注册-参数校验
func testRegisterWithPasswordValidation(t *testing.T) {
	start := time.Now()
	testCases := []struct {
		name     string
		reqBody  map[string]interface{}
		shouldFail bool
	}{
		{
			name: "缺少email",
			reqBody: map[string]interface{}{
				"user_id":  "test_no_email",
				"nickname": "测试用户",
				"password": "Test123456",
			},
			shouldFail: true,
		},
		{
			name: "缺少user_id",
			reqBody: map[string]interface{}{
				"email":    "test_no_userid@example.com",
				"nickname": "测试用户",
				"password": "Test123456",
			},
			shouldFail: true,
		},
		{
			name: "缺少密码",
			reqBody: map[string]interface{}{
				"email":    "test_no_pwd@example.com",
				"user_id":  "test_no_pwd",
				"nickname": "测试用户",
			},
			shouldFail: true,
		},
		{
			name: "密码过短",
			reqBody: map[string]interface{}{
				"email":    "test_short_pwd@example.com",
				"user_id":  "test_short_pwd",
				"nickname": "测试用户",
				"password": "123",
			},
			shouldFail: true,
		},
	}

	passed := 0
	failed := 0
	for _, tc := range testCases {
		resp, _ := makeRequest(t, "POST", BaseURL+"/users/register-pwd", tc.reqBody, "")
		if tc.shouldFail && resp.Code != 0 {
			passed++
			t.Logf("✓ %s - 正确拒绝", tc.name)
		} else if !tc.shouldFail && resp.Code == 0 {
			passed++
			t.Logf("✓ %s - 正确通过", tc.name)
		} else {
			failed++
			t.Errorf("✗ %s - 期望失败=%v, 实际code=%d", tc.name, tc.shouldFail, resp.Code)
		}
	}

	duration := time.Since(start)
	if failed == 0 {
		AddTestResult("密码注册-参数校验", "PASS", duration, "")
	} else {
		AddTestResult("密码注册-参数校验", "FAIL", duration, fmt.Sprintf("%d/%d失败", failed, len(testCases)))
	}
}

// testRegisterWithPasswordDuplicate 测试密码注册-重复注册
func testRegisterWithPasswordDuplicate(t *testing.T) {
	start := time.Now()
	timestamp := time.Now().Unix()
	
	reqBody := map[string]interface{}{
		"email":    fmt.Sprintf("test_dup_%d@example.com", timestamp),
		"user_id":  fmt.Sprintf("test_dup_%d", timestamp),
		"nickname": "测试重复注册",
		"password": "Test123456",
	}

	// 第一次注册
	resp1, _ := makeRequest(t, "POST", BaseURL+"/users/register-pwd", reqBody, "")
	if resp1.Code != 0 {
		t.Fatalf("第一次注册失败: %s", resp1.Msg)
	}

	// 第二次注册相同email
	resp2, _ := makeRequest(t, "POST", BaseURL+"/users/register-pwd", reqBody, "")
	duration := time.Since(start)

	if resp2.Code != 0 {
		AddTestResult("密码注册-重复注册", "PASS", duration, "")
		t.Logf("✓ 正确拒绝重复注册")
	} else {
		AddTestResult("密码注册-重复注册", "FAIL", duration, "允许了重复注册")
		t.Errorf("✗ 不应该允许重复注册")
	}
}

// testLoginWithPassword 测试密码登录-正常流程
func testLoginWithPassword(t *testing.T) {
	start := time.Now()
	timestamp := time.Now().Unix()
	email := fmt.Sprintf("test_login_%d@example.com", timestamp)
	userID := fmt.Sprintf("test_login_%d", timestamp)
	password := "Test123456"
	
	// 先注册
	regBody := map[string]interface{}{
		"email":    email,
		"user_id":  userID,
		"nickname": "测试登录",
		"password": password,
	}
	regResp, _ := makeRequest(t, "POST", BaseURL+"/users/register-pwd", regBody, "")
	if regResp.Code != 0 {
		t.Fatalf("注册失败: %s", regResp.Msg)
	}

	// 登录
	loginBody := map[string]interface{}{
		"email":    email,
		"password": password,
	}
	loginResp, _ := makeRequest(t, "POST", BaseURL+"/users/login-pwd", loginBody, "")
	duration := time.Since(start)

	if loginResp.Code == 0 {
		// 检查返回的数据中是否包含token
		dataMap, ok := loginResp.Data.(map[string]interface{})
		if ok && dataMap["token"] != nil {
			token := dataMap["token"].(string)
			TestUser1.Token = token // 保存token供后续测试使用
			AddTestResult("密码登录-正常流程", "PASS", duration, "")
			t.Logf("✓ 密码登录成功, token: %s", token[:20]+"...")
		} else {
			AddTestResult("密码登录-正常流程", "FAIL", duration, "返回数据中没有token")
			t.Errorf("✗ 返回数据中没有token")
		}
	} else {
		AddTestResult("密码登录-正常流程", "FAIL", duration, fmt.Sprintf("code=%d, msg=%s", loginResp.Code, loginResp.Msg))
		t.Errorf("✗ 密码登录失败: code=%d, msg=%s", loginResp.Code, loginResp.Msg)
	}
}

// testLoginWithWrongPassword 测试密码登录-错误密码
func testLoginWithWrongPassword(t *testing.T) {
	start := time.Now()
	timestamp := time.Now().Unix()
	email := fmt.Sprintf("test_wrong_pwd_%d@example.com", timestamp)
	
	// 先注册
	regBody := map[string]interface{}{
		"email":    email,
		"user_id":  fmt.Sprintf("test_wrong_pwd_%d", timestamp),
		"nickname": "测试错误密码",
		"password": "Test123456",
	}
	regResp, _ := makeRequest(t, "POST", BaseURL+"/users/register-pwd", regBody, "")
	if regResp.Code != 0 {
		t.Fatalf("注册失败: %s", regResp.Msg)
	}

	// 使用错误密码登录
	loginBody := map[string]interface{}{
		"email":    email,
		"password": "WrongPassword",
	}
	loginResp, _ := makeRequest(t, "POST", BaseURL+"/users/login-pwd", loginBody, "")
	duration := time.Since(start)

	if loginResp.Code != 0 {
		AddTestResult("密码登录-错误密码", "PASS", duration, "")
		t.Logf("✓ 正确拒绝错误密码")
	} else {
		AddTestResult("密码登录-错误密码", "FAIL", duration, "允许了错误密码登录")
		t.Errorf("✗ 不应该允许错误密码登录")
	}
}

// testLoginWithNonexistentUser 测试密码登录-不存在的用户
func testLoginWithNonexistentUser(t *testing.T) {
	start := time.Now()
	
	loginBody := map[string]interface{}{
		"email":    "nonexistent@example.com",
		"password": "Test123456",
	}
	loginResp, _ := makeRequest(t, "POST", BaseURL+"/users/login-pwd", loginBody, "")
	duration := time.Since(start)

	if loginResp.Code != 0 {
		AddTestResult("密码登录-不存在的用户", "PASS", duration, "")
		t.Logf("✓ 正确拒绝不存在的用户")
	} else {
		AddTestResult("密码登录-不存在的用户", "FAIL", duration, "允许了不存在的用户登录")
		t.Errorf("✗ 不应该允许不存在的用户登录")
	}
}

// testGetMe 测试获取个人信息-需要认证
func testGetMe(t *testing.T) {
	start := time.Now()
	
	// 如果没有token，先登录获取
	if TestUser1.Token == "" {
		timestamp := time.Now().Unix()
		email := fmt.Sprintf("test_getme_%d@example.com", timestamp)
		password := "Test123456"
		
		regBody := map[string]interface{}{
			"email":    email,
			"user_id":  fmt.Sprintf("test_getme_%d", timestamp),
			"nickname": "测试获取信息",
			"password": password,
		}
		makeRequest(t, "POST", BaseURL+"/users/register-pwd", regBody, "")
		
		loginBody := map[string]interface{}{
			"email":    email,
			"password": password,
		}
		loginResp, _ := makeRequest(t, "POST", BaseURL+"/users/login-pwd", loginBody, "")
		if dataMap, ok := loginResp.Data.(map[string]interface{}); ok {
			TestUser1.Token = dataMap["token"].(string)
		}
	}

	resp, _ := makeRequest(t, "GET", BaseURL+"/users/me", nil, TestUser1.Token)
	duration := time.Since(start)

	if resp.Code == 0 {
		dataMap, ok := resp.Data.(map[string]interface{})
		if ok && dataMap["user_id"] != nil {
			AddTestResult("获取个人信息-需要认证", "PASS", duration, "")
			t.Logf("✓ 获取个人信息成功: user_id=%v", dataMap["user_id"])
		} else {
			AddTestResult("获取个人信息-需要认证", "FAIL", duration, "返回数据格式错误")
			t.Errorf("✗ 返回数据格式错误")
		}
	} else {
		AddTestResult("获取个人信息-需要认证", "FAIL", duration, fmt.Sprintf("code=%d, msg=%s", resp.Code, resp.Msg))
		t.Errorf("✗ 获取个人信息失败: code=%d, msg=%s", resp.Code, resp.Msg)
	}
}

// testGetMeWithoutToken 测试获取个人信息-无Token
func testGetMeWithoutToken(t *testing.T) {
	start := time.Now()
	resp, _ := makeRequest(t, "GET", BaseURL+"/users/me", nil, "")
	duration := time.Since(start)

	if resp.Code != 0 {
		AddTestResult("获取个人信息-无Token", "PASS", duration, "")
		t.Logf("✓ 正确拒绝无Token请求")
	} else {
		AddTestResult("获取个人信息-无Token", "FAIL", duration, "允许了无Token请求")
		t.Errorf("✗ 不应该允许无Token请求")
	}
}

// testGetMeWithInvalidToken 测试获取个人信息-错误Token
func testGetMeWithInvalidToken(t *testing.T) {
	start := time.Now()
	resp, _ := makeRequest(t, "GET", BaseURL+"/users/me", nil, "invalid_token_12345")
	duration := time.Since(start)

	if resp.Code != 0 {
		AddTestResult("获取个人信息-错误Token", "PASS", duration, "")
		t.Logf("✓ 正确拒绝错误Token")
	} else {
		AddTestResult("获取个人信息-错误Token", "FAIL", duration, "允许了错误Token")
		t.Errorf("✗ 不应该允许错误Token")
	}
}

// testLogout 测试登出
func testLogout(t *testing.T) {
	start := time.Now()
	
	// 确保有有效token
	if TestUser1.Token == "" {
		t.Skip("跳过: 没有有效的token")
		return
	}

	resp, _ := makeRequest(t, "POST", BaseURL+"/users/logout", nil, TestUser1.Token)
	duration := time.Since(start)

	if resp.Code == 0 {
		AddTestResult("登出", "PASS", duration, "")
		t.Logf("✓ 登出成功")
		TestUser1.Token = "" // 清空token
	} else {
		AddTestResult("登出", "FAIL", duration, fmt.Sprintf("code=%d, msg=%s", resp.Code, resp.Msg))
		t.Errorf("✗ 登出失败: code=%d, msg=%s", resp.Code, resp.Msg)
	}
}

// testSetPassword 测试设置密码
func testSetPassword(t *testing.T) {
	start := time.Now()
	timestamp := time.Now().Unix()
	email := fmt.Sprintf("test_setpwd_%d@example.com", timestamp)
	
	// 先注册
	regBody := map[string]interface{}{
		"email":    email,
		"user_id":  fmt.Sprintf("test_setpwd_%d", timestamp),
		"nickname": "测试设置密码",
		"password": "OldPassword123",
	}
	makeRequest(t, "POST", BaseURL+"/users/register-pwd", regBody, "")

	// 设置新密码
	setPwdBody := map[string]interface{}{
		"email":    email,
		"password": "NewPassword123",
	}
	resp, _ := makeRequest(t, "POST", BaseURL+"/users/set-password", setPwdBody, "")
	duration := time.Since(start)

	if resp.Code == 0 {
		// 验证能用新密码登录
		loginBody := map[string]interface{}{
			"email":    email,
			"password": "NewPassword123",
		}
		loginResp, _ := makeRequest(t, "POST", BaseURL+"/users/login-pwd", loginBody, "")
		if loginResp.Code == 0 {
			AddTestResult("设置密码", "PASS", duration, "")
			t.Logf("✓ 设置密码成功，新密码可以登录")
		} else {
			AddTestResult("设置密码", "FAIL", duration, "新密码无法登录")
			t.Errorf("✗ 新密码无法登录")
		}
	} else {
		AddTestResult("设置密码", "FAIL", duration, fmt.Sprintf("code=%d, msg=%s", resp.Code, resp.Msg))
		t.Errorf("✗ 设置密码失败: code=%d, msg=%s", resp.Code, resp.Msg)
	}
}
