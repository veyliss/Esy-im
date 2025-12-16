/**
 * 时间格式化工具
 */

/**
 * 格式化时间为聊天显示格式
 * @param dateString ISO时间字符串
 * @returns 格式化后的时间字符串
 */
export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  // 一分钟内
  if (diff < 60000) {
    return "刚刚";
  }
  
  // 一小时内
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`;
  }
  
  // 辅助函数：格式化时间为 HH:MM
  const formatTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // 辅助函数：格式化日期为 MM-DD
  const formatDate = (date: Date): string => {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${month}-${day}`;
  };

  // 今天
  if (date.toDateString() === now.toDateString()) {
    return formatTime(date);
  }
  
  // 昨天
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `昨天 ${formatTime(date)}`;
  }
  
  // 一周内
  if (diff < 7 * 24 * 3600000) {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${days[date.getDay()]} ${formatTime(date)}`;
  }
  
  // 今年
  if (date.getFullYear() === now.getFullYear()) {
    return `${formatDate(date)} ${formatTime(date)}`;
  }
  
  // 更早
  return `${date.getFullYear()}-${formatDate(date)}`;
}

/**
 * 格式化会话列表的时间
 * @param dateString ISO时间字符串
 * @returns 简化的时间字符串
 */
export function formatConversationTime(dateString: string | null): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  // 一小时内
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return minutes < 1 ? '刚刚' : `${minutes}分钟前`;
  }
  
  // 辅助函数：格式化时间为 HH:MM
  const formatTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // 今天
  if (date.toDateString() === now.toDateString()) {
    return formatTime(date);
  }
  
  // 昨天
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return '昨天';
  }
  
  // 一周内
  if (diff < 7 * 24 * 3600000) {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return days[date.getDay()];
  }
  
  // 更早 - 显示天数
  const daysDiff = Math.floor(diff / (24 * 3600000));
  return `${daysDiff}天前`;
}
