import { useCallback, useEffect, useState } from "react";
import type { TimerPhase } from "@/hooks/useTimer";

type BrowserNotificationPermission = NotificationPermission | "unsupported";

const NOTIFICATION_COPY: Record<TimerPhase, { title: string; body: string }> = {
  focus: {
    title: "Focus session complete",
    body: "Beautiful work. Take a breath — your break is ready.",
  },
  lunch: {
    title: "Break complete",
    body: "Ready when you are. Your next focus session is waiting.",
  },
};

let visibleTimerNotification: Notification | null = null;
let notificationSequence = 0;

function showTimerNotification(phase: TimerPhase) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const copy = NOTIFICATION_COPY[phase];
  visibleTimerNotification?.close();
  notificationSequence += 1;
  const notification = new Notification(`${copy.title} · Earth Flow`, {
    body: copy.body,
    icon: new URL(
      phase === "focus" ? "/notification-focus.png" : "/notification-break.png",
      window.location.origin,
    ).href,
    badge: new URL(
      phase === "focus" ? "/notification-focus-badge.png" : "/notification-break-badge.png",
      window.location.origin,
    ).href,
    tag: `earth-flow-timer-${phase}-${Date.now()}-${notificationSequence}`,
    silent: true,
    data: { destination: "/" },
  });
  visibleTimerNotification = notification;

  notification.onclick = () => {
    window.focus();
    notification.close();
  };
  notification.onclose = () => {
    if (visibleTimerNotification === notification) visibleTimerNotification = null;
  };
}

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

  const notifyTimerComplete = useCallback((phase: TimerPhase) => {
    showTimerNotification(phase);
  }, []);

  const previewNotification = useCallback(() => {
    showTimerNotification("focus");
  }, []);

  return {
    notificationPermission: permission,
    requestNotificationPermission: requestPermission,
    notifyTimerComplete,
    previewNotification,
  };
}
