"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store";
import { useGroupStore } from "@/lib/store/group";
import { GroupAPI } from "@/lib/api/group";
import { handleApiError, createUserFriendlyErrorMessage } from "@/lib/utils/errors";
import type { Group, User } from "@/lib/types/api";
import { UserAPI } from "@/lib/api/user";

export default function GroupsPage() {
  const token = useAuthStore((state) => state.token);
  const {
    groups,
    setGroups,
    currentGroup,
    setCurrentGroup,
    loading,
    setLoading,
    error,
    setError,
  } = useGroupStore();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<Group[]>([]);

  // 加载当前用户信息
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const res = await UserAPI.getMe();
        if (res.data.code === 0) {
          setCurrentUser(res.data.data);
        }
      } catch (error) {
        console.error("加载用户信息失败:", error);
        const apiError = handleApiError(error);
        setError(createUserFriendlyErrorMessage(apiError));
      }
    };

    if (token) {
      loadCurrentUser();
    }
  }, [token, setError]);

  // 加载用户群组列表
  const loadUserGroups = async () => {
    try {
      setLoading(true);
      const res = await GroupAPI.getUserGroups();
      if (res.data.code === 0) {
        setGroups(res.data.data);
      }
    } catch (error) {
      console.error("加载群组列表失败:", error);
      const apiError = handleApiError(error);
      setError(createUserFriendlyErrorMessage(apiError));
    } finally {
      setLoading(false);
    }
  };

  // 搜索群组
  const searchGroups = async () => {
    if (!searchKeyword.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const res = await GroupAPI.searchGroups(searchKeyword);
      if (res.data.code === 0) {
        setSearchResults(res.data.data);
      }
    } catch (error) {
      console.error("搜索群组失败:", error);
      const apiError = handleApiError(error);
      setError(createUserFriendlyErrorMessage(apiError));
    }
  };

  // 加入群组
  const handleJoinGroup = async (groupId: string) => {
    try {
      const res = await GroupAPI.joinGroup({ group_id: groupId });
      if (res.data.code === 0) {
        // 重新加载群组列表
        await loadUserGroups();
        setError(null);
      }
    } catch (error) {
      console.error("加入群组失败:", error);
      const apiError = handleApiError(error);
      setError(createUserFriendlyErrorMessage(apiError));
    }
  };

  // 初始加载
  useEffect(() => {
    if (token) {
      loadUserGroups();
    }
  }, [token]);

  // 搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      searchGroups();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchKeyword]);

  return (
    <div className="flex h-screen flex-col bg-background-light dark:bg-background-dark font-display">
      <header className="flex-shrink-0 bg-background-light dark:bg-background-dark border-b border-gray-200 dark:border-gray-800">
        <div className="mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <nav className="flex items-center gap-6">
                <a className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary" href="/chat">聊天</a>
                <a className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary" href="/contacts">通讯录</a>
                <a className="text-sm font-medium text-primary" href="/groups">群聊</a>
                <a className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary" href="/moments">朋友圈</a>
                <a className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary" href="/me">我的</a>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                创建群聊
              </button>
              {currentUser?.avatar && (
                <div
                  className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
                  style={{ backgroundImage: `url(${currentUser.avatar})` }}
                />
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-grow flex overflow-hidden">
        <aside className="w-80 flex-shrink-0 bg-background-light dark:bg-background-dark border-r border-gray-200 dark:border-gray-800 flex flex-col">
          {/* 搜索框 */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <input
              type="text"
              placeholder="搜索群组..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* 群组列表 */}
          <div className="flex-grow overflow-y-auto">
            {searchKeyword.trim() ? (
              // 搜索结果
              <div className="p-2">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 px-2">搜索结果</h3>
                {searchResults.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    未找到相关群组
                  </div>
                ) : (
                  searchResults.map((group) => (
                    <div
                      key={group.group_id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                    >
                      <div
                        className="bg-center bg-no-repeat aspect-square bg-cover rounded-lg size-12"
                        style={{ backgroundImage: `url(${group.avatar || '/default-group-avatar.png'})` }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 dark:text-white font-medium text-sm truncate">
                          {group.name}
                        </p>
                        <p className="text-gray-500 dark:text-gray-400 text-xs">
                          {group.member_count} 人
                        </p>
                      </div>
                      <button
                        onClick={() => handleJoinGroup(group.group_id)}
                        className="bg-primary hover:bg-primary/90 text-white px-3 py-1 rounded text-xs"
                      >
                        加入
                      </button>
                    </div>
                  ))
                )}
              </div>
            ) : (
              // 我的群组
              <div className="p-2">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 px-2">我的群组</h3>
                {loading ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    加载中...
                  </div>
                ) : groups.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    暂无群组
                    <p className="text-xs mt-1">点击右上角创建群聊</p>
                  </div>
                ) : (
                  groups.map((group) => {
                    const isActive = currentGroup?.group_id === group.group_id;
                    return (
                      <div
                        key={group.group_id}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          isActive
                            ? "bg-primary/10 dark:bg-primary/20"
                            : "hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                        onClick={() => setCurrentGroup(group)}
                      >
                        <div
                          className="bg-center bg-no-repeat aspect-square bg-cover rounded-lg size-12"
                          style={{ backgroundImage: `url(${group.avatar || '/default-group-avatar.png'})` }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 dark:text-white font-medium text-sm truncate">
                            {group.name}
                          </p>
                          <p className="text-gray-500 dark:text-gray-400 text-xs">
                            {group.member_count} 人
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 flex flex-col bg-white dark:bg-gray-900">
          {currentGroup ? (
            <GroupDetail group={currentGroup} currentUser={currentUser} />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-slate-400">
              <span className="material-symbols-outlined text-5xl text-slate-300">groups</span>
              <p className="text-lg font-semibold text-slate-500">选择一个群组查看详情</p>
              <p className="text-sm">或者创建一个新的群组</p>
            </div>
          )}
        </main>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-3 text-xs text-red-600 underline"
          >
            知道了
          </button>
        </div>
      )}

      {/* 创建群组模态框 */}
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadUserGroups();
          }}
        />
      )}
    </div>
  );
}

// 群组详情组件
function GroupDetail({ group, currentUser }: { group: Group; currentUser: User | null }) {
  const { groupMembers, setGroupMembers } = useGroupStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const members = groupMembers[group.group_id] || [];

  // 加载群成员
  const loadGroupMembers = async () => {
    try {
      setLoading(true);
      const res = await GroupAPI.getGroupMembers(group.group_id);
      if (res.data.code === 0) {
        setGroupMembers(group.group_id, res.data.data);
      }
    } catch (error) {
      console.error("加载群成员失败:", error);
      const apiError = handleApiError(error);
      setError(createUserFriendlyErrorMessage(apiError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroupMembers();
  }, [group.group_id]);

  return (
    <div className="flex flex-col h-full">
      {/* 群组信息头部 */}
      <div className="flex-shrink-0 p-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-4">
          <div
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-lg size-16"
            style={{ backgroundImage: `url(${group.avatar || '/default-group-avatar.png'})` }}
          />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{group.name}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {group.description || '暂无群描述'}
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
              {group.member_count} 人 · 群号: {group.group_id}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm">
              发消息
            </button>
            <button className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm">
              管理
            </button>
          </div>
        </div>
      </div>

      {/* 群成员列表 */}
      <div className="flex-1 overflow-y-auto p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">群成员</h3>
        {loading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            加载中...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member) => (
              <div
                key={member.user_id}
                className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div
                  className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
                  style={{ backgroundImage: `url(${member.user?.avatar || '/default-avatar.png'})` }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 dark:text-white font-medium text-sm truncate">
                    {member.nickname || member.user?.nickname || `用户${member.user_id}`}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">
                    {member.role === 3 ? '群主' : member.role === 2 ? '管理员' : '成员'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mx-6 mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-3 text-xs text-red-600 underline"
          >
            知道了
          </button>
        </div>
      )}
    </div>
  );
}

// 创建群组模态框组件
function CreateGroupModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    avatar: '',
    max_members: 500,
    is_public: true,
    join_approval: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('群组名称不能为空');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const res = await GroupAPI.createGroup(formData);
      if (res.data.code === 0) {
        onSuccess();
      }
    } catch (error) {
      console.error("创建群组失败:", error);
      const apiError = handleApiError(error);
      setError(createUserFriendlyErrorMessage(apiError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">创建群组</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              群组名称 *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="请输入群组名称"
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              群组描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="请输入群组描述"
              rows={3}
              maxLength={500}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              最大成员数
            </label>
            <input
              type="number"
              value={formData.max_members}
              onChange={(e) => setFormData({ ...formData, max_members: parseInt(e.target.value) || 500 })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              min={2}
              max={2000}
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_public}
                onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">公开群组</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.join_approval}
                onChange={(e) => setFormData({ ...formData, join_approval: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">需要审批</span>
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg disabled:opacity-50"
            >
              {loading ? '创建中...' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}