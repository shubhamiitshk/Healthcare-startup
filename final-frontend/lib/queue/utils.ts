export const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export type DayName = (typeof DAYS_OF_WEEK)[number];

const DAY_MAP: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

export function formatDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function getNextDateOfWeek(dayName: string, todayName: string): string {
  if (!dayName || !DAY_MAP.hasOwnProperty(dayName)) {
    if (todayName && DAY_MAP.hasOwnProperty(todayName)) {
      dayName = todayName;
    } else {
      throw new Error("Invalid day name passed to getNextDateOfWeek");
    }
  }
  const targetDow = DAY_MAP[dayName];
  const today = new Date();
  const todayDow = today.getDay();
  const delta = (targetDow - todayDow + 7) % 7;
  const next = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + delta,
  );
  return formatDate(next);
}

export function getNext7Days(opts: { skipToday?: boolean } = {}): {
  day: string;
  date: string;
  label: string;
}[] {
  const { skipToday = false } = opts;
  const days: { day: string; date: string; label: string }[] = [];
  const today = new Date();
  let i = 0;
  while (days.length < 7) {
    if (skipToday && i === 0) {
      i++;
      continue;
    }
    const d = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + i,
    );
    const dayOfWeek = d.toLocaleDateString("en-US", { weekday: "long" });
    const date = formatDate(d);
    days.push({
      day: dayOfWeek,
      date,
      label: `${dayOfWeek} (${date})`,
    });
    i++;
  }
  return days;
}

export function convertTo24Hour(time12h: string): string {
  const [time, modifier] = time12h.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (modifier === "PM" && hours < 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;
  return `${pad2(hours)}:${pad2(minutes)}`;
}

export function toMinutes(t: string): number {
  const [h, m] = t.split(":");
  return parseInt(h, 10) * 60 + parseInt(m, 10);
}

export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function nowTimeString(): string {
  const now = new Date();
  return `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
}
