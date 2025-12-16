package apitests

import (
	"fmt"
	"os"
	"strings"
	"testing"
	"time"
)

// TestAllAPIs 执行所有API测试
func TestAllAPIs(t *testing.T) {
	fmt.Println("\n" + strings.Repeat("=", 80))
	fmt.Println("开始执行 IM 后端 API 全面测试")
	fmt.Println(strings.Repeat("=", 80) + "\n")

	GlobalReport.StartTime = time.Now()

	// 执行各模块测试
	t.Run("用户管理模块测试", TestUserManagement)
	t.Run("好友关系模块测试", TestFriendManagement)
	t.Run("朋友圈模块测试", TestMomentManagement)
	t.Run("消息通信模块测试", TestMessageManagement)

	// 生成并输出测试报告
	generateFinalReport(t)
}

// 生成最终测试报告
func generateFinalReport(t *testing.T) {
	GlobalReport.EndTime = time.Now()
	GlobalReport.Duration = GlobalReport.EndTime.Sub(GlobalReport.StartTime)

	report := generateDetailedReport()

	// 输出到控制台
	fmt.Println(report)

	// 保存到文件
	reportFile := fmt.Sprintf("API_TEST_REPORT_%s.txt", time.Now().Format("20060102_150405"))
	if err := os.WriteFile(reportFile, []byte(report), 0644); err != nil {
		t.Logf("⚠ 保存报告文件失败: %v", err)
	} else {
		t.Logf("✓ 测试报告已保存至: %s", reportFile)
	}
}

// 生成详细测试报告
func generateDetailedReport() string {
	report := "\n" + strings.Repeat("=", 80) + "\n"
	report += "IM 后端 API 全面测试报告\n"
	report += strings.Repeat("=", 80) + "\n\n"

	// 基本信息
	report += "测试概况\n"
	report += strings.Repeat("-", 80) + "\n"
	report += fmt.Sprintf("测试开始时间: %s\n", GlobalReport.StartTime.Format("2006-01-02 15:04:05"))
	report += fmt.Sprintf("测试结束时间: %s\n", GlobalReport.EndTime.Format("2006-01-02 15:04:05"))
	report += fmt.Sprintf("总耗时: %v\n", GlobalReport.Duration)
	report += fmt.Sprintf("测试服务器: %s\n\n", BaseURL)

	// 统计信息
	report += "测试统计\n"
	report += strings.Repeat("-", 80) + "\n"
	report += fmt.Sprintf("总测试数: %d\n", GlobalReport.TotalTests)
	report += fmt.Sprintf("✓ 通过: %d (%.1f%%)\n", GlobalReport.PassedTests,
		float64(GlobalReport.PassedTests)/float64(GlobalReport.TotalTests)*100)
	report += fmt.Sprintf("✗ 失败: %d (%.1f%%)\n", GlobalReport.FailedTests,
		float64(GlobalReport.FailedTests)/float64(GlobalReport.TotalTests)*100)
	report += fmt.Sprintf("⊘ 跳过: %d (%.1f%%)\n\n", GlobalReport.SkippedTests,
		float64(GlobalReport.SkippedTests)/float64(GlobalReport.TotalTests)*100)

	// 按模块分组统计
	report += "模块测试详情\n"
	report += strings.Repeat("-", 80) + "\n"

	modules := map[string][]TestResult{
		"用户管理": {},
		"好友关系": {},
		"朋友圈":  {},
		"消息通信": {},
	}

	for _, result := range GlobalReport.TestResults {
		// 根据测试名称分类到模块
		if contains(result.Name, "注册") || contains(result.Name, "登录") ||
			contains(result.Name, "个人信息") || contains(result.Name, "密码") ||
			contains(result.Name, "健康") {
			modules["用户管理"] = append(modules["用户管理"], result)
		} else if contains(result.Name, "好友") || contains(result.Name, "请求") ||
			contains(result.Name, "搜索") || contains(result.Name, "备注") {
			modules["好友关系"] = append(modules["好友关系"], result)
		} else if contains(result.Name, "朋友圈") || contains(result.Name, "动态") ||
			contains(result.Name, "点赞") || contains(result.Name, "评论") {
			modules["朋友圈"] = append(modules["朋友圈"], result)
		} else if contains(result.Name, "消息") || contains(result.Name, "会话") ||
			contains(result.Name, "未读") || contains(result.Name, "撤回") {
			modules["消息通信"] = append(modules["消息通信"], result)
		}
	}

	for moduleName, results := range modules {
		if len(results) == 0 {
			continue
		}

		passed := 0
		failed := 0
		skipped := 0
		for _, r := range results {
			switch r.Status {
			case "PASS":
				passed++
			case "FAIL":
				failed++
			case "SKIP":
				skipped++
			}
		}

		report += fmt.Sprintf("\n【%s模块】\n", moduleName)
		report += fmt.Sprintf("  测试数: %d | 通过: %d | 失败: %d | 跳过: %d\n",
			len(results), passed, failed, skipped)

		// 列出每个测试的结果
		for i, r := range results {
			status := "✓"
			if r.Status == "FAIL" {
				status = "✗"
			} else if r.Status == "SKIP" {
				status = "⊘"
			}
			report += fmt.Sprintf("  %d. [%s] %s (耗时: %v)\n",
				i+1, status, r.Name, r.Duration)
			if r.Error != "" {
				report += fmt.Sprintf("      错误: %s\n", r.Error)
			}
		}
	}

	// 失败测试汇总
	if GlobalReport.FailedTests > 0 {
		report += "\n" + strings.Repeat("=", 80) + "\n"
		report += "失败测试汇总\n"
		report += strings.Repeat("-", 80) + "\n"
		failCount := 0
		for _, result := range GlobalReport.TestResults {
			if result.Status == "FAIL" {
				failCount++
				report += fmt.Sprintf("%d. %s\n", failCount, result.Name)
				if result.Error != "" {
					report += fmt.Sprintf("   错误: %s\n", result.Error)
				}
			}
		}
	}

	// 性能分析
	report += "\n" + strings.Repeat("=", 80) + "\n"
	report += "性能分析\n"
	report += strings.Repeat("-", 80) + "\n"

	// 计算平均响应时间
	var totalDuration time.Duration
	for _, result := range GlobalReport.TestResults {
		totalDuration += result.Duration
	}
	avgDuration := totalDuration / time.Duration(len(GlobalReport.TestResults))
	report += fmt.Sprintf("平均响应时间: %v\n", avgDuration)

	// 找出最慢的5个测试
	slowTests := findSlowestTests(5)
	report += "\n最慢的测试:\n"
	for i, result := range slowTests {
		report += fmt.Sprintf("  %d. %s - %v\n", i+1, result.Name, result.Duration)
	}

	// 测试建议
	report += "\n" + strings.Repeat("=", 80) + "\n"
	report += "测试建议\n"
	report += strings.Repeat("-", 80) + "\n"

	if GlobalReport.FailedTests == 0 {
		report += "✓ 所有测试通过！系统运行正常。\n"
	} else {
		report += fmt.Sprintf("⚠ 发现 %d 个失败的测试，建议检查以下内容：\n", GlobalReport.FailedTests)
		report += "  1. 检查数据库连接和数据完整性\n"
		report += "  2. 检查Redis服务是否正常运行\n"
		report += "  3. 检查JWT配置和Token生成\n"
		report += "  4. 检查API参数校验逻辑\n"
		report += "  5. 查看后端日志获取详细错误信息\n"
	}

	if GlobalReport.SkippedTests > 0 {
		report += fmt.Sprintf("\n⊘ 有 %d 个测试被跳过，可能需要手动检查相关功能。\n", GlobalReport.SkippedTests)
	}

	// 覆盖率说明
	report += "\n" + strings.Repeat("=", 80) + "\n"
	report += "测试覆盖范围\n"
	report += strings.Repeat("-", 80) + "\n"
	report += "本次测试覆盖了以下API端点：\n\n"

	report += "【用户管理】\n"
	report += "  ✓ POST /users/register-pwd - 密码注册\n"
	report += "  ✓ POST /users/login-pwd - 密码登录\n"
	report += "  ✓ GET  /users/me - 获取个人信息\n"
	report += "  ✓ POST /users/logout - 登出\n"
	report += "  ✓ POST /users/set-password - 设置密码\n"
	report += "  ✓ GET  /ping - 健康检查\n\n"

	report += "【好友关系】\n"
	report += "  ✓ GET  /friends/search - 搜索用户\n"
	report += "  ✓ POST /friends/send-request - 发送好友请求\n"
	report += "  ✓ GET  /friends/received-requests - 获取收到的请求\n"
	report += "  ✓ GET  /friends/sent-requests - 获取发出的请求\n"
	report += "  ✓ POST /friends/accept-request - 接受好友请求\n"
	report += "  ✓ POST /friends/reject-request - 拒绝好友请求\n"
	report += "  ✓ GET  /friends/list - 获取好友列表\n"
	report += "  ✓ PUT  /friends/update-remark - 更新好友备注\n"
	report += "  ✓ DELETE /friends/{friend_id} - 删除好友\n\n"

	report += "【朋友圈】\n"
	report += "  ✓ POST /moments/create - 发布朋友圈\n"
	report += "  ✓ GET  /moments/{id} - 获取动态详情\n"
	report += "  ✓ GET  /moments/my-list - 获取自己的朋友圈\n"
	report += "  ✓ GET  /moments/timeline - 获取朋友圈时间线\n"
	report += "  ✓ POST /moments/{id}/like - 点赞\n"
	report += "  ✓ DELETE /moments/{id}/unlike - 取消点赞\n"
	report += "  ✓ GET  /moments/{id}/likes - 获取点赞列表\n"
	report += "  ✓ POST /moments/{id}/comment - 评论\n"
	report += "  ✓ GET  /moments/{id}/comments - 获取评论列表\n"
	report += "  ✓ DELETE /moments/comments/{comment_id} - 删除评论\n"
	report += "  ✓ DELETE /moments/{id} - 删除动态\n\n"

	report += "【消息通信】\n"
	report += "  ✓ POST /messages/conversations/create - 创建会话\n"
	report += "  ✓ POST /messages/send - 发送消息\n"
	report += "  ✓ GET  /messages/conversations - 获取会话列表\n"
	report += "  ✓ GET  /messages/conversations/{id}/messages - 获取消息历史\n"
	report += "  ✓ GET  /messages/unread-count - 获取未读消息数\n"
	report += "  ✓ PUT  /messages/conversations/{id}/read - 标记已读\n"
	report += "  ✓ PUT  /messages/{id}/recall - 撤回消息\n"
	report += "  ✓ DELETE /messages/{id} - 删除消息\n\n"

	report += strings.Repeat("=", 80) + "\n"
	report += "测试完成时间: " + time.Now().Format("2006-01-02 15:04:05") + "\n"
	report += strings.Repeat("=", 80) + "\n"

	return report
}

// 找出最慢的N个测试
func findSlowestTests(n int) []TestResult {
	results := make([]TestResult, len(GlobalReport.TestResults))
	copy(results, GlobalReport.TestResults)

	// 简单冒泡排序
	for i := 0; i < len(results)-1; i++ {
		for j := 0; j < len(results)-i-1; j++ {
			if results[j].Duration < results[j+1].Duration {
				results[j], results[j+1] = results[j+1], results[j]
			}
		}
	}

	if len(results) < n {
		return results
	}
	return results[:n]
}

func contains(str, substr string) bool {
	return len(str) >= len(substr) && (str == substr || len(substr) == 0 || findSubstring(str, substr))
}

func findSubstring(str, substr string) bool {
	for i := 0; i <= len(str)-len(substr); i++ {
		if str[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
