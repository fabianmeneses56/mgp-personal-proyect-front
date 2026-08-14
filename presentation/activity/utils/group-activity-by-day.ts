import { ActivityItem } from "@/core/activity/interfaces/activity.interface";

export interface ActivitySection {
  title: string; // "Hoy" | "Ayer" | "12 ago"
  dayKey: string; // "2026-08-14", clave estable para keyExtractor
  data: ActivityItem[]; // orden del backend (createdAt DESC), sin reordenar
}

const MONTH_ABBREVIATIONS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

function buildDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildShortDateTitle(date: Date): string {
  return `${date.getDate()} ${MONTH_ABBREVIATIONS[date.getMonth()]}`;
}

function buildSectionTitle(itemDate: Date, now: Date): string {
  const itemDayKey = buildDayKey(itemDate);
  if (itemDayKey === buildDayKey(now)) return "Hoy";

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (itemDayKey === buildDayKey(yesterday)) return "Ayer";

  return buildShortDateTitle(itemDate);
}

export function groupActivityByDay(
  items: ActivityItem[],
  now: Date = new Date()
): ActivitySection[] {
  const sections: ActivitySection[] = [];
  const sectionsByKey = new Map<string, ActivitySection>();

  for (const item of items) {
    const itemDate = new Date(item.createdAt);
    const isInvalid = Number.isNaN(itemDate.getTime());

    const dayKey = isInvalid ? "invalid" : buildDayKey(itemDate);
    let section = sectionsByKey.get(dayKey);

    if (!section) {
      const title = isInvalid
        ? item.createdAt
        : buildSectionTitle(itemDate, now);
      section = { title, dayKey, data: [] };
      sectionsByKey.set(dayKey, section);
      sections.push(section);
    }

    section.data.push(item);
  }

  return sections;
}
