import { groupActivityByDay } from "@/presentation/activity/utils/group-activity-by-day";
import { ActivityItem } from "@/core/activity/interfaces/activity.interface";

function buildItem(overrides: Partial<ActivityItem>): ActivityItem {
  return {
    id: "activity-1",
    type: "category",
    action: "created",
    entityId: "category-1",
    description: "Push",
    weightGrams: null,
    weightUnit: null,
    createdAt: "2024-03-01T12:00:00.000Z",
    ...overrides,
  };
}

describe("groupActivityByDay", () => {
  it("returns an empty array for an empty list", () => {
    expect(groupActivityByDay([], new Date("2024-03-15T10:00:00"))).toEqual(
      []
    );
  });

  it('groups an item created today under "Hoy"', () => {
    const now = new Date("2024-03-15T10:00:00");
    const item = buildItem({
      id: "today",
      createdAt: new Date("2024-03-15T08:00:00").toISOString(),
    });

    const sections = groupActivityByDay([item], now);

    expect(sections).toEqual([
      { title: "Hoy", dayKey: "2024-03-15", data: [item] },
    ]);
  });

  it('groups an item created yesterday under "Ayer"', () => {
    const now = new Date("2024-03-15T10:00:00");
    const item = buildItem({
      id: "yesterday",
      createdAt: new Date("2024-03-14T08:00:00").toISOString(),
    });

    const sections = groupActivityByDay([item], now);

    expect(sections).toEqual([
      { title: "Ayer", dayKey: "2024-03-14", data: [item] },
    ]);
  });

  it("groups an older item under a short date title", () => {
    const now = new Date("2024-03-15T10:00:00");
    const item = buildItem({
      id: "older",
      createdAt: new Date("2024-03-01T08:00:00").toISOString(),
    });

    const sections = groupActivityByDay([item], now);

    expect(sections).toEqual([
      { title: "1 mar", dayKey: "2024-03-01", data: [item] },
    ]);
  });

  it("puts multiple items from the same local day in a single section", () => {
    const now = new Date("2024-03-15T10:00:00");
    const first = buildItem({
      id: "first",
      createdAt: new Date("2024-03-15T20:00:00").toISOString(),
    });
    const second = buildItem({
      id: "second",
      createdAt: new Date("2024-03-15T08:00:00").toISOString(),
    });

    const sections = groupActivityByDay([first, second], now);

    expect(sections).toEqual([
      { title: "Hoy", dayKey: "2024-03-15", data: [first, second] },
    ]);
  });

  it("does not reorder items across or within sections", () => {
    const now = new Date("2024-03-15T10:00:00");
    const newest = buildItem({
      id: "newest",
      createdAt: new Date("2024-03-15T09:00:00").toISOString(),
    });
    const oldest = buildItem({
      id: "oldest",
      createdAt: new Date("2024-03-01T09:00:00").toISOString(),
    });

    const sections = groupActivityByDay([newest, oldest], now);

    expect(sections.map((section) => section.dayKey)).toEqual([
      "2024-03-15",
      "2024-03-01",
    ]);
  });

  it("keeps a late-night local entry under today, not the next UTC day", () => {
    // 23:00 local time is 04:00 UTC the next day; grouping must use the
    // local calendar day, not the UTC one.
    const now = new Date(2024, 2, 15, 23, 30);
    const lateNightItem = buildItem({
      id: "late-night",
      createdAt: new Date(2024, 2, 15, 23, 0).toISOString(),
    });

    const sections = groupActivityByDay([lateNightItem], now);

    expect(sections).toEqual([
      { title: "Hoy", dayKey: "2024-03-15", data: [lateNightItem] },
    ]);
  });

  it('falls back to an "invalid" section without throwing for a bad createdAt', () => {
    const now = new Date("2024-03-15T10:00:00");
    const item = buildItem({ id: "broken", createdAt: "not-a-date" });

    const sections = groupActivityByDay([item], now);

    expect(sections).toEqual([
      { title: "not-a-date", dayKey: "invalid", data: [item] },
    ]);
  });
});
