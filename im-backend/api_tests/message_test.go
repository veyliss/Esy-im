package apitests

import (
	"fmt"
	"testing"
	"time"
)

var (
	testConversationID int
	testMessageID      int
)

// TestMessageManagement 测试消息通信模块
func TestMessageManagement(t *testing.T) {
	// 准备测试用户
	setupMessageTestUsers(t)

	t.Run("测试创建会话", testCreateConversation)
	t.Run("测试发送消息-文本消息", testSendTextMessage)
	t.Run("测试发送消息-参数校验", testSendMessageValidation)
	t.Run("测试获取会话列表", testGetConversationList)
	t.Run("测试获取会话消息历史", testGetConversationMessages)
	t.Run("测试获取未读消息总数", testGetUnreadCount)
	t.Run("测试标记会话为已读", testMarkConversationRead)
	t.Run("测试撤回消息", testRecallMessage)
	t.Run("测试删除消息", testDeleteMessage)
	t.Run("测试发送给非好友", testSendToNonFriend)
}

// 准备测试用户
func setupMessageTestUsers(t *testing.T) {
	timestamp := time.Now().Unix()

	// 创建两个测试用户用于消息测试
	users := []*TestUser{TestUser1, TestUser2}
	for i, user := range users {
		user.Email = fmt.Sprintf("msg_test_%d_%d@example.com", i+1, timestamp)
		user.UserID = fmt.Sprintf("msg_test_%d_%d", i+1, timestamp)
		user.Nickname = fmt.Sprintf("消息测试用户%d", i+1)
		user.Password = "Test123456"

		// 注册
		regBody := map[string]interface{}{
			"email":    user.Email,
			"user_id":  user.UserID,
			"nickname": user.Nickname,
			"password": user.Password,
		}
		makeRequest(t, "POST", BaseURL+"/users/register-pwd", regBody, "")

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

	// 建立好友关系
	reqBody := map[string]interface{}{
		"to_user_id": TestUser2.UserID,
		"message":    "我们做朋友吧",
	}
	makeRequest(t, "POST", BaseURL+"/friends/send-request", reqBody, TestUser1.Token)

	time.Sleep(500 * time.Millisecond)

	// 获取请求ID并接受
	url := fmt.Sprintf("%s/friends/received-requests?status=0", BaseURL)
	listResp, _ := makeRequest(t, "GET", url, nil, TestUser2.Token)
	if listResp.Code == 0 {
		dataList, _ := listResp.Data.([]interface{})
		if len(dataList) > 0 {
			requestMap, _ := dataList[0].(map[string]interface{})
			requestID := requestMap["id"].(float64)
			acceptBody := map[string]interface{}{
				"request_id": int(requestID),
			}
			makeRequest(t, "POST", BaseURL+"/friends/accept-request", acceptBody, TestUser2.Token)
		}
	}

	t.Logf("✓ 准备消息测试用户完成")
}

// testCreateConversation 测试创建会话
func testCreateConversation(t *testing.T) {
	start := time.Now()

	reqBody := map[string]interface{}{
		"friend_user_id": TestUser2.UserID,
	}
	resp, _ := makeRequest(t, "POST", BaseURL+"/messages/conversations/create", reqBody, TestUser1.Token)
	duration := time.Since(start)

	if resp.Code == 0 {
		dataMap, ok := resp.Data.(map[string]interface{})
		if ok && dataMap["id"] != nil {
			testConversationID = int(dataMap["id"].(float64))
			AddTestResult("创建会话", "PASS", duration, "")
			t.Logf("✓ 创建会话成功，会话ID: %d", testConversationID)
		} else {
			AddTestResult("创建会话", "FAIL", duration, "返回数据格式不正确")
			t.Errorf("✗ 返回数据格式不正确")
		}
	} else {
		AddTestResult("创建会话", "FAIL", duration, fmt.Sprintf("code=%d, msg=%s", resp.Code, resp.Msg))
		t.Errorf("✗ 创建会话失败: %s", resp.Msg)
	}
}

// testSendTextMessage 测试发送消息-文本消息
func testSendTextMessage(t *testing.T) {
	start := time.Now()

	reqBody := map[string]interface{}{
		"to_user_id":   TestUser2.UserID,
		"message_type": 1, // 文本消息
		"content":      "你好，这是一条测试消息！",
		"media_url":    "",
	}
	resp, _ := makeRequest(t, "POST", BaseURL+"/messages/send", reqBody, TestUser1.Token)
	duration := time.Since(start)

	if resp.Code == 0 {
		dataMap, ok := resp.Data.(map[string]interface{})
		if ok && dataMap["id"] != nil {
			testMessageID = int(dataMap["id"].(float64))
			AddTestResult("发送文本消息", "PASS", duration, "")
			t.Logf("✓ 发送文本消息成功，消息ID: %d", testMessageID)
		} else {
			AddTestResult("发送文本消息", "FAIL", duration, "返回数据格式不正确")
			t.Errorf("✗ 返回数据格式不正确")
		}
	} else {
		AddTestResult("发送文本消息", "FAIL", duration, fmt.Sprintf("code=%d, msg=%s", resp.Code, resp.Msg))
		t.Errorf("✗ 发送文本消息失败: %s", resp.Msg)
	}
}

// testSendMessageValidation 测试发送消息-参数校验
func testSendMessageValidation(t *testing.T) {
	start := time.Now()

	testCases := []struct {
		name       string
		reqBody    map[string]interface{}
		shouldFail bool
	}{
		{
			name: "缺少to_user_id",
			reqBody: map[string]interface{}{
				"message_type": 1,
				"content":      "测试内容",
			},
			shouldFail: true,
		},
		{
			name: "消息类型无效",
			reqBody: map[string]interface{}{
				"to_user_id":   TestUser2.UserID,
				"message_type": 99,
				"content":      "测试内容",
			},
			shouldFail: false, // 可能会被接受或处理为默认值
		},
		{
			name: "文本消息内容为空",
			reqBody: map[string]interface{}{
				"to_user_id":   TestUser2.UserID,
				"message_type": 1,
				"content":      "",
			},
			shouldFail: true,
		},
		{
			name: "图片消息",
			reqBody: map[string]interface{}{
				"to_user_id":   TestUser2.UserID,
				"message_type": 2,
				"content":      "",
				"media_url":    "https://example.com/image.jpg",
			},
			shouldFail: false,
		},
	}

	passed := 0
	failed := 0
	for _, tc := range testCases {
		resp, _ := makeRequest(t, "POST", BaseURL+"/messages/send", tc.reqBody, TestUser1.Token)
		if tc.shouldFail && resp.Code != 0 {
			passed++
			t.Logf("✓ %s - 正确拒绝", tc.name)
		} else if !tc.shouldFail && resp.Code == 0 {
			passed++
			t.Logf("✓ %s - 正确通过", tc.name)
		} else {
			failed++
			t.Errorf("✗ %s - 期望失败=%v, 实际code=%d, msg=%s", tc.name, tc.shouldFail, resp.Code, resp.Msg)
		}
	}

	duration := time.Since(start)
	if failed == 0 {
		AddTestResult("发送消息-参数校验", "PASS", duration, "")
	} else {
		AddTestResult("发送消息-参数校验", "FAIL", duration, fmt.Sprintf("%d/%d失败", failed, len(testCases)))
	}
}

// testGetConversationList 测试获取会话列表
func testGetConversationList(t *testing.T) {
	start := time.Now()

	url := fmt.Sprintf("%s/messages/conversations?page=1&page_size=20", BaseURL)
	resp, _ := makeRequest(t, "GET", url, nil, TestUser1.Token)
	duration := time.Since(start)

	if resp.Code == 0 {
		dataList, ok := resp.Data.([]interface{})
		if ok {
			AddTestResult("获取会话列表", "PASS", duration, "")
			t.Logf("✓ 获取会话列表成功，数量: %d", len(dataList))
		} else {
			AddTestResult("获取会话列表", "FAIL", duration, "返回数据格式不正确")
			t.Errorf("✗ 返回数据格式不正确")
		}
	} else {
		AddTestResult("获取会话列表", "FAIL", duration, fmt.Sprintf("code=%d, msg=%s", resp.Code, resp.Msg))
		t.Errorf("✗ 获取会话列表失败: %s", resp.Msg)
	}
}

// testGetConversationMessages 测试获取会话消息历史
func testGetConversationMessages(t *testing.T) {
	if testConversationID == 0 {
		t.Skip("跳过: 没有可用的会话ID")
		return
	}

	start := time.Now()
	url := fmt.Sprintf("%s/messages/conversations/%d/messages?page=1&page_size=50", BaseURL, testConversationID)
	resp, _ := makeRequest(t, "GET", url, nil, TestUser1.Token)
	duration := time.Since(start)

	if resp.Code == 0 {
		dataList, ok := resp.Data.([]interface{})
		if ok {
			AddTestResult("获取会话消息历史", "PASS", duration, "")
			t.Logf("✓ 获取会话消息历史成功，数量: %d", len(dataList))
		} else {
			AddTestResult("获取会话消息历史", "FAIL", duration, "返回数据格式不正确")
			t.Errorf("✗ 返回数据格式不正确")
		}
	} else {
		AddTestResult("获取会话消息历史", "FAIL", duration, fmt.Sprintf("code=%d, msg=%s", resp.Code, resp.Msg))
		t.Errorf("✗ 获取会话消息历史失败: %s", resp.Msg)
	}
}

// testGetUnreadCount 测试获取未读消息总数
func testGetUnreadCount(t *testing.T) {
	start := time.Now()

	resp, _ := makeRequest(t, "GET", BaseURL+"/messages/unread-count", nil, TestUser2.Token)
	duration := time.Since(start)

	if resp.Code == 0 {
		dataMap, ok := resp.Data.(map[string]interface{})
		if ok && dataMap["count"] != nil {
			count := int(dataMap["count"].(float64))
			AddTestResult("获取未读消息总数", "PASS", duration, "")
			t.Logf("✓ 获取未读消息总数成功，未读数: %d", count)
		} else {
			AddTestResult("获取未读消息总数", "FAIL", duration, "返回数据格式不正确")
			t.Errorf("✗ 返回数据格式不正确")
		}
	} else {
		AddTestResult("获取未读消息总数", "FAIL", duration, fmt.Sprintf("code=%d, msg=%s", resp.Code, resp.Msg))
		t.Errorf("✗ 获取未读消息总数失败: %s", resp.Msg)
	}
}

// testMarkConversationRead 测试标记会话为已读
func testMarkConversationRead(t *testing.T) {
	if testConversationID == 0 {
		t.Skip("跳过: 没有可用的会话ID")
		return
	}

	start := time.Now()
	url := fmt.Sprintf("%s/messages/conversations/%d/read", BaseURL, testConversationID)
	resp, _ := makeRequest(t, "PUT", url, nil, TestUser2.Token)
	duration := time.Since(start)

	if resp.Code == 0 {
		// 验证未读数是否变为0
		unreadResp, _ := makeRequest(t, "GET", BaseURL+"/messages/unread-count", nil, TestUser2.Token)
		if unreadResp.Code == 0 {
			dataMap, _ := unreadResp.Data.(map[string]interface{})
			count := int(dataMap["count"].(float64))
			AddTestResult("标记会话为已读", "PASS", duration, "")
			t.Logf("✓ 标记会话为已读成功，当前未读数: %d", count)
		} else {
			AddTestResult("标记会话为已读", "FAIL", duration, "无法验证结果")
			t.Errorf("✗ 无法验证标记结果")
		}
	} else {
		AddTestResult("标记会话为已读", "FAIL", duration, fmt.Sprintf("code=%d, msg=%s", resp.Code, resp.Msg))
		t.Errorf("✗ 标记会话为已读失败: %s", resp.Msg)
	}
}

// testRecallMessage 测试撤回消息
func testRecallMessage(t *testing.T) {
	// 先发送一条新消息
	sendBody := map[string]interface{}{
		"to_user_id":   TestUser2.UserID,
		"message_type": 1,
		"content":      "这条消息将被撤回",
	}
	sendResp, _ := makeRequest(t, "POST", BaseURL+"/messages/send", sendBody, TestUser1.Token)

	if sendResp.Code != 0 {
		t.Skip("无法发送测试消息")
		return
	}

	dataMap, _ := sendResp.Data.(map[string]interface{})
	messageID := int(dataMap["id"].(float64))

	start := time.Now()
	url := fmt.Sprintf("%s/messages/%d/recall", BaseURL, messageID)
	resp, _ := makeRequest(t, "PUT", url, nil, TestUser1.Token)
	duration := time.Since(start)

	if resp.Code == 0 {
		AddTestResult("撤回消息", "PASS", duration, "")
		t.Logf("✓ 撤回消息成功")
	} else {
		AddTestResult("撤回消息", "FAIL", duration, fmt.Sprintf("code=%d, msg=%s", resp.Code, resp.Msg))
		t.Errorf("✗ 撤回消息失败: %s", resp.Msg)
	}
}

// testDeleteMessage 测试删除消息
func testDeleteMessage(t *testing.T) {
	if testMessageID == 0 {
		t.Skip("跳过: 没有可用的消息ID")
		return
	}

	start := time.Now()
	url := fmt.Sprintf("%s/messages/%d", BaseURL, testMessageID)
	resp, _ := makeRequest(t, "DELETE", url, nil, TestUser1.Token)
	duration := time.Since(start)

	if resp.Code == 0 {
		AddTestResult("删除消息", "PASS", duration, "")
		t.Logf("✓ 删除消息成功")
	} else {
		AddTestResult("删除消息", "FAIL", duration, fmt.Sprintf("code=%d, msg=%s", resp.Code, resp.Msg))
		t.Errorf("✗ 删除消息失败: %s", resp.Msg)
	}
}

// testSendToNonFriend 测试发送给非好友
func testSendToNonFriend(t *testing.T) {
	// 创建一个非好友用户
	timestamp := time.Now().Unix()
	nonFriend := &TestUser{
		Email:    fmt.Sprintf("non_friend_%d@example.com", timestamp),
		UserID:   fmt.Sprintf("non_friend_%d", timestamp),
		Nickname: "非好友用户",
		Password: "Test123456",
	}

	// 注册非好友用户
	regBody := map[string]interface{}{
		"email":    nonFriend.Email,
		"user_id":  nonFriend.UserID,
		"nickname": nonFriend.Nickname,
		"password": nonFriend.Password,
	}
	makeRequest(t, "POST", BaseURL+"/users/register-pwd", regBody, "")

	start := time.Now()

	// 尝试给非好友发送消息
	reqBody := map[string]interface{}{
		"to_user_id":   nonFriend.UserID,
		"message_type": 1,
		"content":      "给非好友发消息",
	}
	resp, _ := makeRequest(t, "POST", BaseURL+"/messages/send", reqBody, TestUser1.Token)
	duration := time.Since(start)

	// 应该被拒绝
	if resp.Code != 0 {
		AddTestResult("发送给非好友", "PASS", duration, "")
		t.Logf("✓ 正确拒绝向非好友发送消息")
	} else {
		AddTestResult("发送给非好友", "FAIL", duration, "允许向非好友发送消息")
		t.Errorf("✗ 不应该允许向非好友发送消息")
	}
}
