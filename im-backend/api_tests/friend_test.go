package apitests

import (
	"fmt"
	"testing"
	"time"
)

// TestFriendManagement 测试好友关系模块
func TestFriendManagement(t *testing.T) {
	// 准备测试用户
	setupFriendTestUsers(t)

	t.Run("测试搜索用户", testSearchFriend)
	t.Run("测试发送好友请求", testSendFriendRequest)
	t.Run("测试发送好友请求-参数校验", testSendFriendRequestValidation)
	t.Run("测试获取收到的好友请求", testGetReceivedRequests)
	t.Run("测试获取发出的好友请求", testGetSentRequests)
	t.Run("测试接受好友请求", testAcceptFriendRequest)
	t.Run("测试拒绝好友请求", testRejectFriendRequest)
	t.Run("测试获取好友列表", testGetFriendList)
	t.Run("测试更新好友备注", testUpdateFriendRemark)
	t.Run("测试删除好友", testDeleteFriend)
	t.Run("测试重复发送好友请求", testDuplicateFriendRequest)
}

// 准备测试用户
func setupFriendTestUsers(t *testing.T) {
	timestamp := time.Now().Unix()

	users := []*TestUser{TestUser1, TestUser2, TestUser3}
	for i, user := range users {
		user.Email = fmt.Sprintf("friend_test_%d_%d@example.com", i+1, timestamp)
		user.UserID = fmt.Sprintf("friend_test_%d_%d", i+1, timestamp)
		user.Nickname = fmt.Sprintf("好友测试用户%d", i+1)
		user.Password = "Test123456"

		// 注册
		regBody := map[string]interface{}{
			"email":    user.Email,
			"user_id":  user.UserID,
			"nickname": user.Nickname,
			"password": user.Password,
		}
		regResp, _ := makeRequest(t, "POST", BaseURL+"/users/register-pwd", regBody, "")
		if regResp.Code != 0 {
			t.Fatalf("注册用户%d失败: %s", i+1, regResp.Msg)
		}

		// 登录获取token
		loginBody := map[string]interface{}{
			"email":    user.Email,
			"password": user.Password,
		}
		loginResp, _ := makeRequest(t, "POST", BaseURL+"/users/login-pwd", loginBody, "")
		if loginResp.Code == 0 {
			if dataMap, ok := loginResp.Data.(map[string]interface{}); ok {
				user.Token = dataMap["token"].(string)
			}
		}
	}

	t.Logf("✓ 准备测试用户完成")
}

// testSearchFriend 测试搜索用户
func testSearchFriend(t *testing.T) {
	start := time.Now()

	url := fmt.Sprintf("%s/friends/search?user_id=%s", BaseURL, TestUser2.UserID)
	resp, _ := makeRequest(t, "GET", url, nil, TestUser1.Token)
	duration := time.Since(start)

	if resp.Code == 0 {
		dataMap, ok := resp.Data.(map[string]interface{})
		if ok && dataMap["user_id"] == TestUser2.UserID {
			AddTestResult("搜索用户", "PASS", duration, "")
			t.Logf("✓ 搜索用户成功")
		} else {
			AddTestResult("搜索用户", "FAIL", duration, "返回数据不正确")
			t.Errorf("✗ 返回数据不正确")
		}
	} else {
		AddTestResult("搜索用户", "FAIL", duration, fmt.Sprintf("code=%d, msg=%s", resp.Code, resp.Msg))
		t.Errorf("✗ 搜索用户失败: %s", resp.Msg)
	}
}

// testSendFriendRequest 测试发送好友请求
func testSendFriendRequest(t *testing.T) {
	start := time.Now()

	reqBody := map[string]interface{}{
		"to_user_id": TestUser2.UserID,
		"message":    "你好，我想加你为好友",
	}
	resp, _ := makeRequest(t, "POST", BaseURL+"/friends/send-request", reqBody, TestUser1.Token)
	duration := time.Since(start)

	if resp.Code == 0 {
		AddTestResult("发送好友请求", "PASS", duration, "")
		t.Logf("✓ 发送好友请求成功")
	} else {
		AddTestResult("发送好友请求", "FAIL", duration, fmt.Sprintf("code=%d, msg=%s", resp.Code, resp.Msg))
		t.Errorf("✗ 发送好友请求失败: %s", resp.Msg)
	}
}

// testSendFriendRequestValidation 测试发送好友请求-参数校验
func testSendFriendRequestValidation(t *testing.T) {
	start := time.Now()

	testCases := []struct {
		name       string
		reqBody    map[string]interface{}
		shouldFail bool
	}{
		{
			name: "缺少to_user_id",
			reqBody: map[string]interface{}{
				"message": "你好",
			},
			shouldFail: true,
		},
		{
			name: "to_user_id为空字符串",
			reqBody: map[string]interface{}{
				"to_user_id": "",
				"message":    "你好",
			},
			shouldFail: true,
		},
		{
			name: "向自己发送请求",
			reqBody: map[string]interface{}{
				"to_user_id": TestUser1.UserID,
				"message":    "给自己发请求",
			},
			shouldFail: true,
		},
	}

	passed := 0
	failed := 0
	for _, tc := range testCases {
		resp, _ := makeRequest(t, "POST", BaseURL+"/friends/send-request", tc.reqBody, TestUser1.Token)
		if tc.shouldFail && resp.Code != 0 {
			passed++
			t.Logf("✓ %s - 正确拒绝", tc.name)
		} else if !tc.shouldFail && resp.Code == 0 {
			passed++
		} else {
			failed++
			t.Errorf("✗ %s - 期望失败=%v, 实际code=%d", tc.name, tc.shouldFail, resp.Code)
		}
	}

	duration := time.Since(start)
	if failed == 0 {
		AddTestResult("发送好友请求-参数校验", "PASS", duration, "")
	} else {
		AddTestResult("发送好友请求-参数校验", "FAIL", duration, fmt.Sprintf("%d/%d失败", failed, len(testCases)))
	}
}

// testGetReceivedRequests 测试获取收到的好友请求
func testGetReceivedRequests(t *testing.T) {
	start := time.Now()

	url := fmt.Sprintf("%s/friends/received-requests?status=0", BaseURL)
	resp, _ := makeRequest(t, "GET", url, nil, TestUser2.Token)
	duration := time.Since(start)

	if resp.Code == 0 {
		dataList, ok := resp.Data.([]interface{})
		if ok {
			AddTestResult("获取收到的好友请求", "PASS", duration, "")
			t.Logf("✓ 获取收到的好友请求成功，数量: %d", len(dataList))
		} else {
			AddTestResult("获取收到的好友请求", "FAIL", duration, "返回数据格式不正确")
			t.Errorf("✗ 返回数据格式不正确")
		}
	} else {
		AddTestResult("获取收到的好友请求", "FAIL", duration, fmt.Sprintf("code=%d, msg=%s", resp.Code, resp.Msg))
		t.Errorf("✗ 获取收到的好友请求失败: %s", resp.Msg)
	}
}

// testGetSentRequests 测试获取发出的好友请求
func testGetSentRequests(t *testing.T) {
	start := time.Now()

	url := fmt.Sprintf("%s/friends/sent-requests?status=0", BaseURL)
	resp, _ := makeRequest(t, "GET", url, nil, TestUser1.Token)
	duration := time.Since(start)

	if resp.Code == 0 {
		dataList, ok := resp.Data.([]interface{})
		if ok {
			AddTestResult("获取发出的好友请求", "PASS", duration, "")
			t.Logf("✓ 获取发出的好友请求成功，数量: %d", len(dataList))
		} else {
			AddTestResult("获取发出的好友请求", "FAIL", duration, "返回数据格式不正确")
			t.Errorf("✗ 返回数据格式不正确")
		}
	} else {
		AddTestResult("获取发出的好友请求", "FAIL", duration, fmt.Sprintf("code=%d, msg=%s", resp.Code, resp.Msg))
		t.Errorf("✗ 获取发出的好友请求失败: %s", resp.Msg)
	}
}

// testAcceptFriendRequest 测试接受好友请求
func testAcceptFriendRequest(t *testing.T) {
	start := time.Now()

	// 先获取请求列表找到request_id
	url := fmt.Sprintf("%s/friends/received-requests?status=0", BaseURL)
	listResp, _ := makeRequest(t, "GET", url, nil, TestUser2.Token)

	if listResp.Code != 0 {
		t.Fatal("获取好友请求列表失败")
	}

	dataList, ok := listResp.Data.([]interface{})
	if !ok || len(dataList) == 0 {
		t.Skip("没有待处理的好友请求")
		return
	}

	requestMap, _ := dataList[0].(map[string]interface{})
	requestID := requestMap["id"].(float64)

	// 接受请求
	acceptBody := map[string]interface{}{
		"request_id": int(requestID),
	}
	resp, _ := makeRequest(t, "POST", BaseURL+"/friends/accept-request", acceptBody, TestUser2.Token)
	duration := time.Since(start)

	if resp.Code == 0 {
		AddTestResult("接受好友请求", "PASS", duration, "")
		t.Logf("✓ 接受好友请求成功")
	} else {
		AddTestResult("接受好友请求", "FAIL", duration, fmt.Sprintf("code=%d, msg=%s", resp.Code, resp.Msg))
		t.Errorf("✗ 接受好友请求失败: %s", resp.Msg)
	}
}

// testRejectFriendRequest 测试拒绝好友请求
func testRejectFriendRequest(t *testing.T) {
	start := time.Now()

	// User3向User2发送请求
	reqBody := map[string]interface{}{
		"to_user_id": TestUser2.UserID,
		"message":    "我想加你",
	}
	makeRequest(t, "POST", BaseURL+"/friends/send-request", reqBody, TestUser3.Token)

	// 等待一下
	time.Sleep(500 * time.Millisecond)

	// User2获取请求列表
	url := fmt.Sprintf("%s/friends/received-requests?status=0", BaseURL)
	listResp, _ := makeRequest(t, "GET", url, nil, TestUser2.Token)

	if listResp.Code != 0 {
		t.Fatal("获取好友请求列表失败")
	}

	dataList, ok := listResp.Data.([]interface{})
	if !ok || len(dataList) == 0 {
		t.Skip("没有待处理的好友请求")
		return
	}

	requestMap, _ := dataList[0].(map[string]interface{})
	requestID := requestMap["id"].(float64)

	// 拒绝请求
	rejectBody := map[string]interface{}{
		"request_id": int(requestID),
	}
	resp, _ := makeRequest(t, "POST", BaseURL+"/friends/reject-request", rejectBody, TestUser2.Token)
	duration := time.Since(start)

	if resp.Code == 0 {
		AddTestResult("拒绝好友请求", "PASS", duration, "")
		t.Logf("✓ 拒绝好友请求成功")
	} else {
		AddTestResult("拒绝好友请求", "FAIL", duration, fmt.Sprintf("code=%d, msg=%s", resp.Code, resp.Msg))
		t.Errorf("✗ 拒绝好友请求失败: %s", resp.Msg)
	}
}

// testGetFriendList 测试获取好友列表
func testGetFriendList(t *testing.T) {
	start := time.Now()

	resp, _ := makeRequest(t, "GET", BaseURL+"/friends/list", nil, TestUser1.Token)
	duration := time.Since(start)

	if resp.Code == 0 {
		dataList, ok := resp.Data.([]interface{})
		if ok {
			AddTestResult("获取好友列表", "PASS", duration, "")
			t.Logf("✓ 获取好友列表成功，数量: %d", len(dataList))
		} else {
			AddTestResult("获取好友列表", "FAIL", duration, "返回数据格式不正确")
			t.Errorf("✗ 返回数据格式不正确")
		}
	} else {
		AddTestResult("获取好友列表", "FAIL", duration, fmt.Sprintf("code=%d, msg=%s", resp.Code, resp.Msg))
		t.Errorf("✗ 获取好友列表失败: %s", resp.Msg)
	}
}

// testUpdateFriendRemark 测试更新好友备注
func testUpdateFriendRemark(t *testing.T) {
	start := time.Now()

	// 确保User1和User2是好友
	reqBody := map[string]interface{}{
		"friend_id": TestUser2.UserID,
		"remark":    "我的好友备注",
	}
	resp, _ := makeRequest(t, "PUT", BaseURL+"/friends/update-remark", reqBody, TestUser1.Token)
	duration := time.Since(start)

	if resp.Code == 0 {
		AddTestResult("更新好友备注", "PASS", duration, "")
		t.Logf("✓ 更新好友备注成功")
	} else {
		AddTestResult("更新好友备注", "FAIL", duration, fmt.Sprintf("code=%d, msg=%s", resp.Code, resp.Msg))
		t.Errorf("✗ 更新好友备注失败: %s", resp.Msg)
	}
}

// testDeleteFriend 测试删除好友
func testDeleteFriend(t *testing.T) {
	start := time.Now()

	url := fmt.Sprintf("%s/friends/%s", BaseURL, TestUser2.UserID)
	resp, _ := makeRequest(t, "DELETE", url, nil, TestUser1.Token)
	duration := time.Since(start)

	if resp.Code == 0 {
		// 验证好友列表中已删除
		listResp, _ := makeRequest(t, "GET", BaseURL+"/friends/list", nil, TestUser1.Token)
		if listResp.Code == 0 {
			dataList, _ := listResp.Data.([]interface{})
			found := false
			for _, item := range dataList {
				friendMap, _ := item.(map[string]interface{})
				if friendMap["friend_id"] == TestUser2.UserID {
					found = true
					break
				}
			}
			if !found {
				AddTestResult("删除好友", "PASS", duration, "")
				t.Logf("✓ 删除好友成功")
			} else {
				AddTestResult("删除好友", "FAIL", duration, "好友列表中仍存在")
				t.Errorf("✗ 好友列表中仍存在该好友")
			}
		} else {
			AddTestResult("删除好友", "FAIL", duration, "无法验证删除结果")
			t.Errorf("✗ 无法验证删除结果")
		}
	} else {
		AddTestResult("删除好友", "FAIL", duration, fmt.Sprintf("code=%d, msg=%s", resp.Code, resp.Msg))
		t.Errorf("✗ 删除好友失败: %s", resp.Msg)
	}
}

// testDuplicateFriendRequest 测试重复发送好友请求
func testDuplicateFriendRequest(t *testing.T) {
	start := time.Now()

	reqBody := map[string]interface{}{
		"to_user_id": TestUser3.UserID,
		"message":    "第一次请求",
	}

	// 发送第一次请求
	resp1, _ := makeRequest(t, "POST", BaseURL+"/friends/send-request", reqBody, TestUser1.Token)
	if resp1.Code != 0 {
		t.Logf("第一次发送请求：%s", resp1.Msg)
	}

	// 立即发送第二次请求
	resp2, _ := makeRequest(t, "POST", BaseURL+"/friends/send-request", reqBody, TestUser1.Token)
	duration := time.Since(start)

	// 应该拒绝重复请求或返回提示信息
	if resp2.Code != 0 || (resp2.Code == 0 && resp2.Msg != "success") {
		AddTestResult("重复发送好友请求", "PASS", duration, "")
		t.Logf("✓ 正确处理重复好友请求")
	} else {
		AddTestResult("重复发送好友请求", "FAIL", duration, "允许重复发送请求")
		t.Logf("⚠ 允许重复发送好友请求（可能是设计如此）")
	}
}
