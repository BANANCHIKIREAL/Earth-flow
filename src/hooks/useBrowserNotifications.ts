import { useCallback, useEffect, useState } from "react";

type BrowserNotificationPermission = NotificationPermission | "unsupported";

export function useBrowserNotifications() {
  const [permission, setPermission] = useState<BrowserNotificationPermission>("default");

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return "unsupported" as const;
    }
    const nextPermission = await Notification.requestPermission();
    setPermission(nextPermission);
    return nextPermission;
  }, []);

  const notifyTimerComplete = useCallback(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const notification = new Notification("Earth Flow", {
      body: "Timer finished. Time to take a breath.",
      silent: true,
    });

    window.setTimeout(() => notification.close(), 6000);
  }, []);

  return {
    notificationPermission: permission,
    requestNotificationPermission: requestPermission,
    notifyTimerComplete,
  };
}
