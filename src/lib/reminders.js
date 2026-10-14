// Daily "log today's spending" reminder.
//
// These are *local* notifications: the OS holds the schedule, so the reminder
// fires at the set time whether or not the app is running, and nothing round-
// trips through the API. That also makes it a per-device setting rather than an
// account one — the backend's `user.settings` is a fixed shape (currency,
// weekStart, theme) and silently drops unknown keys — so the preference lives
// in AsyncStorage next to the device, same as the schedule it describes.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

import { colors } from '../theme';
import { formatLongDate, toDateStr } from './format';

// expo-notifications ships no web scheduler — the calls below would reach an
// unimplemented native module — so every entry point no-ops in the browser.
export const SUPPORTED = Platform.OS !== 'web';

const STORAGE_KEY = 'kb_expense.reminder.v1';
const CHANNEL_ID = 'daily-reminder';

// A stable identifier makes re-scheduling *replace* the pending notification
// rather than stack a second one every time the time is nudged.
const NOTIFICATION_ID = 'daily-expense-reminder';

// Stamped onto the payload so a stray notification left by an older build can
// be swept even if its identifier differs from the one above.
const KIND = 'daily-expense-reminder';

export const DEFAULT_REMINDER = { enabled: true, hour: 20, minute: 30 };

// Foreground notifications are discarded unless a handler opts them in, and the
// handler has to be in place before one can arrive — hence module scope, not an
// effect. The handler must settle within 3s or the notification is dropped, so
// it resolves a constant rather than reading storage.
if (SUPPORTED) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// ── Preference ────────────────────────────────────────────────

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const int = (v, fallback) => (Number.isFinite(Number(v)) ? Math.trunc(Number(v)) : fallback);

const normalise = (pref) => ({
  enabled: Boolean(pref?.enabled ?? DEFAULT_REMINDER.enabled),
  hour: clamp(int(pref?.hour, DEFAULT_REMINDER.hour), 0, 23),
  minute: clamp(int(pref?.minute, DEFAULT_REMINDER.minute), 0, 59),
});

// `stored` distinguishes "never configured" from "configured, happens to match
// the defaults" — only the former is allowed to raise a permission prompt.
async function readStored() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { stored: false, pref: normalise(null) };
    return { stored: true, pref: normalise(JSON.parse(raw)) };
  } catch {
    return { stored: false, pref: normalise(null) };
  }
}

export const loadReminder = async () => (await readStored()).pref;

export async function saveReminder(pref) {
  const next = normalise(pref);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // A failed write costs the preference on the next launch, not this schedule.
  }
  return next;
}

// ── Permission ────────────────────────────────────────────────

export async function getPermission() {
  if (!SUPPORTED) return { granted: false, canAskAgain: false };
  try {
    const { granted, canAskAgain } = await Notifications.getPermissionsAsync();
    return { granted, canAskAgain };
  } catch {
    return { granted: false, canAskAgain: false };
  }
}

export async function requestPermission() {
  if (!SUPPORTED) return { granted: false, canAskAgain: false };
  try {
    const { granted, canAskAgain } = await Notifications.requestPermissionsAsync({
      // No badge: an unread count on the icon is noise for a once-a-day nudge.
      ios: { allowAlert: true, allowSound: true, allowBadge: false },
    });
    return { granted, canAskAgain };
  } catch {
    return { granted: false, canAskAgain: false };
  }
}

// ── Scheduling ────────────────────────────────────────────────

// Android 8+ files every notification under a channel; without one created up
// front the system picks a fallback with no sound and low importance.
async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Daily expense reminder',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: colors.secondary,
  });
}

const triggerFor = ({ hour, minute }) => ({
  type: Notifications.SchedulableTriggerInputTypes.DAILY,
  hour,
  minute,
  ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : null),
});

async function cancelOurs() {
  await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID).catch(() => {});

  // Sweep by payload too. Cancelling the known id misses anything an older
  // build scheduled under a different one, and a leftover would keep firing
  // alongside the current reminder with no way to turn it off from here.
  const pending = await Notifications.getAllScheduledNotificationsAsync().catch(() => []);
  await Promise.all(
    pending
      .filter((n) => n?.content?.data?.kind === KIND)
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {})),
  );
}

/**
 * Makes the OS schedule match `pref`, and reports back what actually happened —
 * the caller cannot assume `enabled: true` means scheduled, since permission
 * may be missing.
 */
export async function syncReminder(pref) {
  const next = normalise(pref);
  if (!SUPPORTED) return { ...next, granted: false, canAskAgain: false, nextAt: null };

  const perm = await getPermission();
  await cancelOurs();

  if (!next.enabled || !perm.granted) return { ...next, ...perm, nextAt: null };

  const trigger = triggerFor(next);
  await ensureChannel();
  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_ID,
    content: {
      title: "Log today's spending",
      body: 'Tap to add what you spent today, while you still remember it.',
      data: { kind: KIND },
      sound: true,
    },
    trigger,
  });

  const nextAt = await Notifications.getNextTriggerDateAsync(trigger).catch(() => null);
  return { ...next, ...perm, nextAt };
}

/**
 * Re-applies the stored schedule at launch.
 *
 * This is not what makes the reminder fire — the OS keeps pending notifications
 * across restarts on its own. It is what repairs the schedule after a reinstall,
 * after an OS update drops pending alarms, or after the user grants permission
 * from system settings rather than from the app.
 */
export async function bootstrapReminder() {
  if (!SUPPORTED) return null;
  try {
    const { stored, pref } = await readStored();

    // First run only: the reminder ships on, so ask once here. Every later
    // launch stays silent — the Settings toggle is the only other place that
    // prompts, so someone who declined is not re-asked on every cold start.
    if (!stored) {
      if (pref.enabled) await requestPermission();
      await saveReminder(pref);
    }
    return await syncReminder(pref);
  } catch {
    return null;
  }
}

/**
 * Calls `handler` when the reminder is tapped — both while the app is running
 * and for the cold start where that tap is what launched it. Returns an
 * unsubscribe function.
 */
export function onReminderTap(handler) {
  if (!SUPPORTED) return () => {};

  let alive = true;
  const fire = (response) => {
    if (!alive || !response) return;
    if (response.notification?.request?.content?.data?.kind === KIND) handler();
  };

  Notifications.getLastNotificationResponseAsync()
    .then((response) => {
      if (!response) return undefined;
      fire(response);
      // Without clearing, the launch response replays on every later start and
      // yanks the user to the entry form unprompted.
      return Notifications.clearLastNotificationResponseAsync();
    })
    .catch(() => {});

  const sub = Notifications.addNotificationResponseReceivedListener(fire);
  return () => {
    alive = false;
    sub.remove();
  };
}

// ── Display helpers ───────────────────────────────────────────

/** "8:30 PM" — the 12-hour clock the rest of the app reads in. */
export const formatTime = (hour, minute) =>
  `${hour % 12 === 0 ? 12 : hour % 12}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;

/** "Today at 8:30 PM" / "Tomorrow at 8:30 PM" for the next scheduled fire. */
export const describeNext = (ms) => {
  if (!ms) return null;
  const d = new Date(ms);
  const at = formatTime(d.getHours(), d.getMinutes());
  const day = toDateStr(d);

  if (day === toDateStr(new Date())) return `Today at ${at}`;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (day === toDateStr(tomorrow)) return `Tomorrow at ${at}`;
  return `${formatLongDate(day)} at ${at}`;
};

// ── Hook ──────────────────────────────────────────────────────

/**
 * Reminder state for the Settings card: the stored preference, whether the OS
 * actually granted permission, and when it will next fire.
 */
export function useReminder() {
  const [state, setState] = useState({
    ...DEFAULT_REMINDER,
    granted: false,
    canAskAgain: true,
    nextAt: null,
    loading: true,
    busy: false,
  });

  // The setters read the current preference to merge a patch into it; a ref
  // keeps them stable so a time bump does not rebuild every stepper.
  const latest = useRef(state);
  latest.current = state;

  useEffect(() => {
    let alive = true;
    (async () => {
      const pref = await loadReminder();
      const perm = await getPermission();
      const nextAt =
        SUPPORTED && pref.enabled && perm.granted
          ? await Notifications.getNextTriggerDateAsync(triggerFor(pref)).catch(() => null)
          : null;
      if (alive) setState({ ...pref, ...perm, nextAt, loading: false, busy: false });
    })();
    return () => {
      alive = false;
    };
  }, []);

  const update = useCallback(async (patch) => {
    const pref = normalise({ ...latest.current, ...patch });
    // Optimistic: the switch and the clock move under the thumb rather than
    // after a round trip through the OS scheduler.
    setState((s) => ({ ...s, ...pref, busy: true }));

    // Only prompt on the way on. Re-asking on every minute bump would be
    // hostile, and iOS shows the system prompt once per install regardless.
    if (pref.enabled) {
      const perm = await getPermission();
      if (!perm.granted && perm.canAskAgain) await requestPermission();
    }

    await saveReminder(pref);
    const result = await syncReminder(pref);
    setState({ ...result, loading: false, busy: false });
    return result;
  }, []);

  return {
    ...state,
    setEnabled: useCallback((enabled) => update({ enabled }), [update]),
    setTime: useCallback((hour, minute) => update({ hour, minute }), [update]),
  };
}
