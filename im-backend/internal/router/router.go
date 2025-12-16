package router

import (
	"im-backend/internal/controller"
	"im-backend/internal/handler"
	"im-backend/internal/pkg"
	"im-backend/internal/repository"
	"im-backend/internal/service"
	"net/http"

	"github.com/gorilla/mux"
)

func InitRouter() *mux.Router {
	r := mux.NewRouter()

	// API 统一前缀
	api := r.PathPrefix("/api/v1").Subrouter()

	// 初始化依赖
	userRepo := repository.NewUserRepository(pkg.DB)
	codeService := service.NewCodeService()
	userService := service.NewUserService(userRepo, pkg.RDB, codeService)

	// 好友系统
	friendRepo := repository.NewFriendRepository(pkg.DB)
	friendService := service.NewFriendService(friendRepo, userRepo)

	// 朋友圈
	momentRepo := repository.NewMomentRepository(pkg.DB)
	momentService := service.NewMomentService(momentRepo, friendRepo)

	// 消息系统
	messageRepo := repository.NewMessageRepository(pkg.DB)
	messageService := service.NewMessageService(messageRepo, friendRepo)

	// 群聊系统
	groupRepo := repository.NewGroupRepository(pkg.DB)
	groupService := service.NewGroupService(groupRepo, friendRepo, userRepo)

	userController := controller.NewUserController(userService, codeService)
	friendController := controller.NewFriendController(friendService)
	momentController := controller.NewMomentController(momentService)
	messageController := controller.NewMessageController(messageService)
	groupController := controller.NewGroupController(groupService)
	//friendController := controller.NewFriendController()
	//messageController := controller.NewMessageController()
	//momentController := controller.NewMomentController()

	userHandler := handler.NewUserHandler(userController)
	friendHandler := handler.NewFriendHandler(friendController, userRepo)
	momentHandler := handler.NewMomentHandler(momentController)
	// 替换这里：为MessageHandler注入userRepo
	messageHandler := handler.NewMessageHandler(messageController, userRepo)
	groupHandler := handler.NewGroupHandler(groupController, userRepo)

	// 健康检查
	api.HandleFunc("/ping", func(w http.ResponseWriter, r *http.Request) {
		pkg.Success(w, "pong")
	}).Methods("GET")

	// user 用户
	api.HandleFunc("/users/register", userHandler.Register).Methods("POST")
	api.HandleFunc("/users/login", userHandler.Login).Methods("POST")
	api.HandleFunc("/users/register-pwd", userHandler.RegisterWithPassword).Methods("POST")
	api.HandleFunc("/users/login-pwd", userHandler.LoginWithPassword).Methods("POST")
	api.HandleFunc("/users/send-code", userHandler.SendCode).Methods("POST")
	api.HandleFunc("/users/verify-code", userHandler.VerifyCode).Methods("POST")

	// 带鉴权的接口
	api.HandleFunc("/users/me", pkg.AuthMiddleware(pkg.RDB, userHandler.Me)).Methods("GET")
	api.HandleFunc("/users/me", pkg.AuthMiddleware(pkg.RDB, userHandler.UpdateProfile)).Methods("PUT")
	api.HandleFunc("/users/logout", pkg.AuthMiddleware(pkg.RDB, userHandler.Logout)).Methods("POST")
	api.HandleFunc("/users/set-password", pkg.AuthMiddleware(pkg.RDB, userHandler.SetPassword)).Methods("POST")

	// friends 好友系统
	api.HandleFunc("/friends/send-request", pkg.AuthMiddleware(pkg.RDB, friendHandler.SendRequest)).Methods("POST")
	api.HandleFunc("/friends/accept-request", pkg.AuthMiddleware(pkg.RDB, friendHandler.AcceptRequest)).Methods("POST")
	api.HandleFunc("/friends/reject-request", pkg.AuthMiddleware(pkg.RDB, friendHandler.RejectRequest)).Methods("POST")
	api.HandleFunc("/friends/list", pkg.AuthMiddleware(pkg.RDB, friendHandler.GetFriendList)).Methods("GET")
	api.HandleFunc("/friends/{friend_id}", pkg.AuthMiddleware(pkg.RDB, friendHandler.DeleteFriend)).Methods("DELETE")
	api.HandleFunc("/friends/update-remark", pkg.AuthMiddleware(pkg.RDB, friendHandler.UpdateRemark)).Methods("PUT")
	api.HandleFunc("/friends/received-requests", pkg.AuthMiddleware(pkg.RDB, friendHandler.GetReceivedRequests)).Methods("GET")
	api.HandleFunc("/friends/sent-requests", pkg.AuthMiddleware(pkg.RDB, friendHandler.GetSentRequests)).Methods("GET")
	api.HandleFunc("/friends/search", pkg.AuthMiddleware(pkg.RDB, friendHandler.SearchFriend)).Methods("GET")

	// messages 消息管理
	//api.HandleFunc("/messages/send", messageHandler.Send).Methods("POST")
	//api.HandleFunc("/messages/history", messageHandler.History).Methods("GET")
	//api.HandleFunc("/messages/ws", messageHandler.WebSocket).Methods("GET")

	// moments 朋友圈
	api.HandleFunc("/moments/create", pkg.AuthMiddleware(pkg.RDB, momentHandler.CreateMoment)).Methods("POST")
	api.HandleFunc("/moments/my-list", pkg.AuthMiddleware(pkg.RDB, momentHandler.GetMyMoments)).Methods("GET")
	api.HandleFunc("/moments/timeline", pkg.AuthMiddleware(pkg.RDB, momentHandler.GetFriendMoments)).Methods("GET")
	api.HandleFunc("/moments/comments/{comment_id}", pkg.AuthMiddleware(pkg.RDB, momentHandler.DeleteComment)).Methods("DELETE")
	api.HandleFunc("/moments/{id}", pkg.AuthMiddleware(pkg.RDB, momentHandler.GetMomentByID)).Methods("GET")
	api.HandleFunc("/moments/{id}", pkg.AuthMiddleware(pkg.RDB, momentHandler.DeleteMoment)).Methods("DELETE")
	api.HandleFunc("/moments/{id}/like", pkg.AuthMiddleware(pkg.RDB, momentHandler.LikeMoment)).Methods("POST")
	api.HandleFunc("/moments/{id}/unlike", pkg.AuthMiddleware(pkg.RDB, momentHandler.UnlikeMoment)).Methods("DELETE")
	api.HandleFunc("/moments/{id}/likes", pkg.AuthMiddleware(pkg.RDB, momentHandler.GetLikeList)).Methods("GET")
	api.HandleFunc("/moments/{id}/comment", pkg.AuthMiddleware(pkg.RDB, momentHandler.CommentMoment)).Methods("POST")
	api.HandleFunc("/moments/{id}/comments", pkg.AuthMiddleware(pkg.RDB, momentHandler.GetCommentList)).Methods("GET")

	// messages 消息系统
	// WebSocket不使用中间件，在handler内部验证token（从URL参数）
	api.HandleFunc("/messages/ws", messageHandler.WebSocketHandler).Methods("GET")
	api.HandleFunc("/messages/send", pkg.AuthMiddleware(pkg.RDB, messageHandler.SendMessage)).Methods("POST")
	api.HandleFunc("/messages/conversations", pkg.AuthMiddleware(pkg.RDB, messageHandler.GetConversationList)).Methods("GET")
	api.HandleFunc("/messages/conversations/create", pkg.AuthMiddleware(pkg.RDB, messageHandler.GetOrCreateConversation)).Methods("POST")
	api.HandleFunc("/messages/conversations/{conversation_id}/messages", pkg.AuthMiddleware(pkg.RDB, messageHandler.GetConversationMessages)).Methods("GET")
	api.HandleFunc("/messages/conversations/{conversation_id}/read", pkg.AuthMiddleware(pkg.RDB, messageHandler.MarkConversationAsRead)).Methods("PUT")
	api.HandleFunc("/messages/{message_id}/recall", pkg.AuthMiddleware(pkg.RDB, messageHandler.RecallMessage)).Methods("PUT")
	api.HandleFunc("/messages/{message_id}", pkg.AuthMiddleware(pkg.RDB, messageHandler.DeleteMessage)).Methods("DELETE")
	api.HandleFunc("/messages/unread-count", pkg.AuthMiddleware(pkg.RDB, messageHandler.GetUnreadMessageCount)).Methods("GET")

	// groups 群聊系统
	api.HandleFunc("/groups/create", pkg.AuthMiddleware(pkg.RDB, groupHandler.CreateGroup)).Methods("POST")
	api.HandleFunc("/groups/{group_id}", pkg.AuthMiddleware(pkg.RDB, groupHandler.GetGroupInfo)).Methods("GET")
	api.HandleFunc("/groups/{group_id}", pkg.AuthMiddleware(pkg.RDB, groupHandler.UpdateGroupInfo)).Methods("PUT")
	api.HandleFunc("/groups/{group_id}", pkg.AuthMiddleware(pkg.RDB, groupHandler.DeleteGroup)).Methods("DELETE")
	api.HandleFunc("/groups/my-list", pkg.AuthMiddleware(pkg.RDB, groupHandler.GetUserGroups)).Methods("GET")
	api.HandleFunc("/groups/search", pkg.AuthMiddleware(pkg.RDB, groupHandler.SearchGroups)).Methods("GET")

	// 群成员管理
	api.HandleFunc("/groups/join", pkg.AuthMiddleware(pkg.RDB, groupHandler.JoinGroup)).Methods("POST")
	api.HandleFunc("/groups/{group_id}/leave", pkg.AuthMiddleware(pkg.RDB, groupHandler.LeaveGroup)).Methods("POST")
	api.HandleFunc("/groups/{group_id}/kick", pkg.AuthMiddleware(pkg.RDB, groupHandler.KickMember)).Methods("POST")
	api.HandleFunc("/groups/{group_id}/set-role", pkg.AuthMiddleware(pkg.RDB, groupHandler.SetMemberRole)).Methods("POST")
	api.HandleFunc("/groups/{group_id}/members", pkg.AuthMiddleware(pkg.RDB, groupHandler.GetGroupMembers)).Methods("GET")

	// 群消息管理
	api.HandleFunc("/groups/messages/send", pkg.AuthMiddleware(pkg.RDB, groupHandler.SendGroupMessage)).Methods("POST")
	api.HandleFunc("/groups/{group_id}/messages", pkg.AuthMiddleware(pkg.RDB, groupHandler.GetGroupMessages)).Methods("GET")
	api.HandleFunc("/groups/messages/{message_id}/recall", pkg.AuthMiddleware(pkg.RDB, groupHandler.RecallGroupMessage)).Methods("PUT")
	api.HandleFunc("/groups/{group_id}/messages/read", pkg.AuthMiddleware(pkg.RDB, groupHandler.MarkGroupMessagesAsRead)).Methods("PUT")
	api.HandleFunc("/groups/{group_id}/unread-count", pkg.AuthMiddleware(pkg.RDB, groupHandler.GetUserUnreadGroupMessages)).Methods("GET")

	return r
}
