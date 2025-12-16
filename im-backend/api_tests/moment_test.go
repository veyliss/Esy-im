package apitests

import (
	"fmt"
	"testing"
	"time"
)

var (
	testMomentID  int
	testCommentID int
)

// TestMomentManagement 测试朋友圈模块
func TestMomentManagement(t *testing.T) {
	// 准备测试用户
	setupMomentTestUsers(t)

	t.Run("测试发布朋友圈", testCreateMoment)
	t.Run("测试发布朋友圈-参数校验", testCreateMomentValidation)
	t.Run("测试获取自己的朋友圈列表", testGetMyMoments)
	t.Run("测试获取朋友圈动态详情", testGetMomentDetail)
	t.Run("测试获取朋友圈时间线", testGetMomentsTimeline)
	t.Run("测试点赞朋友圈", testLikeMoment)
	t.Run("测试取消点赞", testUnlikeMoment)
	t.Run("测试获取点赞列表", testGetLikeList)
	t.Run("测试评论朋友圈", testCommentMoment)
	t.Run("测试回复评论", testReplyComment)
	t.Run("测试获取评论列表", testGetCommentList)
	t.Run("测试删除评论", testDeleteComment)
	t.Run("测试删除朋友圈", testDeleteMoment)
}

// 准备测试用户
func setupMomentTestUsers(t *testing.T) {
	timestamp := time.Now().Unix()

	// 创建两个测试用户用于朋友圈测试
	users := []*TestUser{TestUser1, TestUser2}
	for i, user := range users {
		user.Email = fmt.Sprintf("moment_test_%d_%d@example.com", i+1, timestamp)
		user.UserID = fmt.Sprintf("moment_test_%d_%d", i+1, timestamp)
		user.Nickname = fmt.Sprintf("朋友圈测试用户%d", i+1)
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

	t.Logf("✓ 准备朋友圈测试用户完成")
}

// testCreateMoment 测试发布朋友圈
func testCreateMoment(t *testing.T) {
	start := time.Now()

	reqBody := map[string]interface{}{
		"content":  "这是一条测试朋友圈动态，今天天气不错！",
		"images":   `["https://example.com/image1.jpg", "https://example.com/image2.jpg"]`,
		"location": "北京市朝阳区",
		"visible":  0, // 所有人可见
	}
	resp, _ := makeRequest(t, "POST", BaseURL+"/moments/create", reqBody, TestUser1.Token)
	duration := time.Since(start)

	if resp.Code == 0 {
		AddTestResult("发布朋友圈", "PASS", duration, "")
		t.Logf("✓ 发布朋友圈成功")
	} else {
		AddTestResult("发布朋友圈", "FAIL", duration, fmt.Sprintf("code=%d, msg=%s", resp.Code, resp.Msg))
		t.Errorf("✗ 发布朋友圈失败: %s", resp.Msg)
	}
}

// testCreateMomentValidation 测试发布朋友圈-参数校验
func testCreateMomentValidation(t *testing.T) {
	start := time.Now()

	testCases := []struct {
		name       string
		reqBody    map[string]interface{}
		shouldFail bool
	}{
		{
			name: "内容为空",
			reqBody: map[string]interface{}{
				"content": "",
				"visible": 0,
			},
			shouldFail: true,
		},
		{
			name: "visible值无效",
			reqBody: map[string]interface{}{
				"content": "测试内容",
				"visible": 99,
			},
			shouldFail: false, // 可能会被处理为默认值
		},
		{
			name: "正常发布-仅好友可见",
			reqBody: map[string]interface{}{
				"content": "仅好友可见的动态",
				"visible": 1,
			},
			shouldFail: false,
		},
		{
			name: "正常发布-仅自己可见",
			reqBody: map[string]interface{}{
				"content": "私密动态",
				"visible": 2,
			},
			shouldFail: false,
		},
	}

	passed := 0
	failed := 0
	for _, tc := range testCases {
		resp, _ := makeRequest(t, "POST", BaseURL+"/moments/create", tc.reqBody, TestUser1.Token)
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
		AddTestResult("发布朋友圈-参数校验", "PASS", duration, "")
	} else {
		AddTestResult("发布朋友圈-参数校验", "FAIL", duration, fmt.Sprintf("%d/%d失败", failed, len(testCases)))
	}
}

// testGetMyMoments 测试获取自己的朋友圈列表
func testGetMyMoments(t *testing.T) {
	start := time.Now()

	url := fmt.Sprintf("%s/moments/my-list?page=1&page_size=20", BaseURL)
	resp, _ := makeRequest(t, "GET", url, nil, TestUser1.Token)

	// 打印响应调试
	t.Logf("响应: code=%d, msg='%s'", resp.Code, resp.Msg)

	duration := time.Since(start)

	if resp.Code == 0 {
		dataList, ok := resp.Data.([]interface{})
		if ok {
			if len(dataList) > 0 {
				// 保存第一个动态的ID供后续测试使用
				momentMap, _ := dataList[0].(map[string]interface{})
				testMomentID = int(momentMap["id"].(float64))
			}
			AddTestResult("获取自己的朋友圈列表", "PASS", duration, "")
			t.Logf("✓ 获取自己的朋友圈列表成功，数量: %d", len(dataList))
		} else {
			AddTestResult("获取自己的朋友圈列表", "FAIL", duration, "返回数据格式不正确")
			t.Errorf("✗ 返回数据格式不正确")
		}
	} else {
		AddTestResult("获取自己的朋友圈列表", "FAIL", duration, fmt.Sprintf("code=%d, msg=%s", resp.Code, resp.Msg))
		t.Errorf("✗ 获取自己的朋友圈列表失败: %s", resp.Msg)
	}
}

// testGetMomentDetail 测试获取朋友圈动态详情
func testGetMomentDetail(t *testing.T) {
	if testMomentID == 0 {
		t.Skip("跳过: 没有可用的动态ID")
		return
	}

	start := time.Now()
	url := fmt.Sprintf("%s/moments/%d", BaseURL, testMomentID)
	resp, _ := makeRequest(t, "GET", url, nil, TestUser1.Token)
	duration := time.Since(start)

	if resp.Code == 0 {
		dataMap, ok := resp.Data.(map[string]interface{})
		if ok && dataMap["id"] != nil {
			AddTestResult("获取朋友圈动态详情", "PASS", duration, "")
			t.Logf("✓ 获取朋友圈动态详情成功")
		} else {
			AddTestResult("获取朋友圈动态详情", "FAIL", duration, "返回数据格式不正确")
			t.Errorf("✗ 返回数据格式不正确")
		}
	} else {
		AddTestResult("获取朋友圈动态详情", "FAIL", duration, fmt.Sprintf("code=%d, msg=%s", resp.Code, resp.Msg))
		t.Errorf("✗ 获取朋友圈动态详情失败: %s", resp.Msg)
	}
}

// testGetMomentsTimeline 测试获取朋友圈时间线
func testGetMomentsTimeline(t *testing.T) {
	start := time.Now()

	url := fmt.Sprintf("%s/moments/timeline?page=1&page_size=20", BaseURL)
	resp, _ := makeRequest(t, "GET", url, nil, TestUser1.Token)
	duration := time.Since(start)

	if resp.Code == 0 {
		dataList, ok := resp.Data.([]interface{})
		if ok {
			AddTestResult("获取朋友圈时间线", "PASS", duration, "")
			t.Logf("✓ 获取朋友圈时间线成功，数量: %d", len(dataList))
		} else {
			AddTestResult("获取朋友圈时间线", "FAIL", duration, "返回数据格式不正确")
			t.Errorf("✗ 返回数据格式不正确")
		}
	} else {
		AddTestResult("获取朋友圈时间线", "FAIL", duration, fmt.Sprintf("code=%d, msg=%s", resp.Code, resp.Msg))
		t.Errorf("✗ 获取朋友圈时间线失败: %s", resp.Msg)
	}
}

// testLikeMoment 测试点赞朋友圈
func testLikeMoment(t *testing.T) {
	if testMomentID == 0 {
		t.Skip("跳过: 没有可用的动态ID")
		return
	}

	start := time.Now()
	url := fmt.Sprintf("%s/moments/%d/like", BaseURL, testMomentID)
	resp, _ := makeRequest(t, "POST", url, nil, TestUser2.Token)
	duration := time.Since(start)

	if resp.Code == 0 {
		AddTestResult("点赞朋友圈", "PASS", duration, "")
		t.Logf("✓ 点赞朋友圈成功")
	} else {
		AddTestResult("点赞朋友圈", "FAIL", duration, fmt.Sprintf("code=%d, msg=%s", resp.Code, resp.Msg))
		t.Errorf("✗ 点赞朋友圈失败: %s", resp.Msg)
	}
}

// testUnlikeMoment 测试取消点赞
func testUnlikeMoment(t *testing.T) {
	if testMomentID == 0 {
		t.Skip("跳过: 没有可用的动态ID")
		return
	}

	start := time.Now()
	url := fmt.Sprintf("%s/moments/%d/unlike", BaseURL, testMomentID)
	resp, _ := makeRequest(t, "DELETE", url, nil, TestUser2.Token)
	duration := time.Since(start)

	if resp.Code == 0 {
		AddTestResult("取消点赞", "PASS", duration, "")
		t.Logf("✓ 取消点赞成功")
	} else {
		AddTestResult("取消点赞", "FAIL", duration, fmt.Sprintf("code=%d, msg=%s", resp.Code, resp.Msg))
		t.Errorf("✗ 取消点赞失败: %s", resp.Msg)
	}
}

// testGetLikeList 测试获取点赞列表
func testGetLikeList(t *testing.T) {
	if testMomentID == 0 {
		t.Skip("跳过: 没有可用的动态ID")
		return
	}

	// 先点个赞
	likeURL := fmt.Sprintf("%s/moments/%d/like", BaseURL, testMomentID)
	makeRequest(t, "POST", likeURL, nil, TestUser2.Token)

	start := time.Now()
	url := fmt.Sprintf("%s/moments/%d/likes", BaseURL, testMomentID)
	resp, _ := makeRequest(t, "GET", url, nil, TestUser1.Token)
	duration := time.Since(start)

	if resp.Code == 0 {
		dataList, ok := resp.Data.([]interface{})
		if ok {
			AddTestResult("获取点赞列表", "PASS", duration, "")
			t.Logf("✓ 获取点赞列表成功，数量: %d", len(dataList))
		} else {
			AddTestResult("获取点赞列表", "FAIL", duration, "返回数据格式不正确")
			t.Errorf("✗ 返回数据格式不正确")
		}
	} else {
		AddTestResult("获取点赞列表", "FAIL", duration, fmt.Sprintf("code=%d, msg=%s", resp.Code, resp.Msg))
		t.Errorf("✗ 获取点赞列表失败: %s", resp.Msg)
	}
}

// testCommentMoment 测试评论朋友圈
func testCommentMoment(t *testing.T) {
	if testMomentID == 0 {
		t.Skip("跳过: 没有可用的动态ID")
		return
	}

	start := time.Now()
	url := fmt.Sprintf("%s/moments/%d/comment", BaseURL, testMomentID)
	reqBody := map[string]interface{}{
		"content":     "这是一条测试评论",
		"reply_to_id": nil,
	}
	resp, _ := makeRequest(t, "POST", url, reqBody, TestUser2.Token)
	duration := time.Since(start)

	if resp.Code == 0 {
		AddTestResult("评论朋友圈", "PASS", duration, "")
		t.Logf("✓ 评论朋友圈成功")
	} else {
		AddTestResult("评论朋友圈", "FAIL", duration, fmt.Sprintf("code=%d, msg=%s", resp.Code, resp.Msg))
		t.Errorf("✗ 评论朋友圈失败: %s", resp.Msg)
	}
}

// testReplyComment 测试回复评论
func testReplyComment(t *testing.T) {
	if testMomentID == 0 {
		t.Skip("跳过: 没有可用的动态ID")
		return
	}

	// 先获取评论列表
	listURL := fmt.Sprintf("%s/moments/%d/comments", BaseURL, testMomentID)
	listResp, _ := makeRequest(t, "GET", listURL, nil, TestUser1.Token)

	if listResp.Code != 0 {
		t.Skip("无法获取评论列表")
		return
	}

	dataList, ok := listResp.Data.([]interface{})
	if !ok || len(dataList) == 0 {
		t.Skip("没有可用的评论")
		return
	}

	commentMap, _ := dataList[0].(map[string]interface{})
	testCommentID = int(commentMap["id"].(float64))

	start := time.Now()
	url := fmt.Sprintf("%s/moments/%d/comment", BaseURL, testMomentID)
	reqBody := map[string]interface{}{
		"content":     "这是一条回复评论",
		"reply_to_id": testCommentID,
	}
	resp, _ := makeRequest(t, "POST", url, reqBody, TestUser1.Token)
	duration := time.Since(start)

	if resp.Code == 0 {
		AddTestResult("回复评论", "PASS", duration, "")
		t.Logf("✓ 回复评论成功")
	} else {
		AddTestResult("回复评论", "FAIL", duration, fmt.Sprintf("code=%d, msg=%s", resp.Code, resp.Msg))
		t.Errorf("✗ 回复评论失败: %s", resp.Msg)
	}
}

// testGetCommentList 测试获取评论列表
func testGetCommentList(t *testing.T) {
	if testMomentID == 0 {
		t.Skip("跳过: 没有可用的动态ID")
		return
	}

	start := time.Now()
	url := fmt.Sprintf("%s/moments/%d/comments", BaseURL, testMomentID)
	resp, _ := makeRequest(t, "GET", url, nil, TestUser1.Token)
	duration := time.Since(start)

	if resp.Code == 0 {
		dataList, ok := resp.Data.([]interface{})
		if ok {
			AddTestResult("获取评论列表", "PASS", duration, "")
			t.Logf("✓ 获取评论列表成功，数量: %d", len(dataList))
		} else {
			AddTestResult("获取评论列表", "FAIL", duration, "返回数据格式不正确")
			t.Errorf("✗ 返回数据格式不正确")
		}
	} else {
		AddTestResult("获取评论列表", "FAIL", duration, fmt.Sprintf("code=%d, msg=%s", resp.Code, resp.Msg))
		t.Errorf("✗ 获取评论列表失败: %s", resp.Msg)
	}
}

// testDeleteComment 测试删除评论
func testDeleteComment(t *testing.T) {
	if testCommentID == 0 {
		t.Skip("跳过: 没有可用的评论ID")
		return
	}

	start := time.Now()
	url := fmt.Sprintf("%s/moments/comments/%d", BaseURL, testCommentID)
	resp, _ := makeRequest(t, "DELETE", url, nil, TestUser2.Token)
	duration := time.Since(start)

	if resp.Code == 0 {
		AddTestResult("删除评论", "PASS", duration, "")
		t.Logf("✓ 删除评论成功")
	} else {
		AddTestResult("删除评论", "FAIL", duration, fmt.Sprintf("code=%d, msg=%s", resp.Code, resp.Msg))
		t.Errorf("✗ 删除评论失败: %s", resp.Msg)
	}
}

// testDeleteMoment 测试删除朋友圈
func testDeleteMoment(t *testing.T) {
	if testMomentID == 0 {
		t.Skip("跳过: 没有可用的动态ID")
		return
	}

	start := time.Now()
	url := fmt.Sprintf("%s/moments/%d", BaseURL, testMomentID)
	resp, _ := makeRequest(t, "DELETE", url, nil, TestUser1.Token)
	duration := time.Since(start)

	if resp.Code == 0 {
		// 验证是否真的删除了
		getResp, _ := makeRequest(t, "GET", url, nil, TestUser1.Token)
		if getResp.Code != 0 {
			AddTestResult("删除朋友圈", "PASS", duration, "")
			t.Logf("✓ 删除朋友圈成功")
		} else {
			AddTestResult("删除朋友圈", "FAIL", duration, "删除后仍能获取")
			t.Errorf("✗ 删除后仍能获取该动态")
		}
	} else {
		AddTestResult("删除朋友圈", "FAIL", duration, fmt.Sprintf("code=%d, msg=%s", resp.Code, resp.Msg))
		t.Errorf("✗ 删除朋友圈失败: %s", resp.Msg)
	}
}
