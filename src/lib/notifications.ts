import Constants from "expo-constants";

function isExpoGo() {
  return Constants.executionEnvironment === "storeClient";
}

type Ok = { ok: true; id?: string };
type Fail = { ok: false; reason: "expo-go" | "no_permission" | "not_supported" };

export async function enableDailyReminder(): Promise<Ok | Fail> {
  if (isExpoGo()) return { ok: false, reason: "expo-go" };

  const Notifications = await import("expo-notifications");

  const perm = await Notifications.getPermissionsAsync();
  if (perm.status !== "granted") {
    const req = await Notifications.requestPermissionsAsync();
    if (req.status !== "granted") return { ok: false, reason: "no_permission" };
  }

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const s of scheduled) {
    if ((s.identifier || "").startsWith("ecolife_rem_")) {
      await Notifications.cancelScheduledNotificationAsync(s.identifier);
    }
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "EcoLife 🐼",
      body: "Час зробити добру справу для планети 🌱",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 19,
      minute: 0,
    },
  });

  return { ok: true, id };
}

export async function disableDailyReminder(): Promise<Ok> {
  if (isExpoGo()) return { ok: true };

  const Notifications = await import("expo-notifications");

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const s of scheduled) {
    if ((s.identifier || "").startsWith("ecolife_rem_")) {
      await Notifications.cancelScheduledNotificationAsync(s.identifier);
    }
  }

  return { ok: true };
}
