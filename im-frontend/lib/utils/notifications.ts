const PREFS_KEY = "esy-im:user-preferences";

function getPreferences(): Record<string, unknown> {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function isNotificationEnabled(): boolean {
  const prefs = getPreferences();
  return !!prefs.desktopNotifications;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function showNotification(title: string, options?: NotificationOptions): void {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  if (!isNotificationEnabled()) return;
  // Only show when page is not visible
  if (!document.hidden) return;

  try {
    new Notification(title, options);
  } catch {
    // iOS Safari doesn't support new Notification
  }
}
