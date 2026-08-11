import { WeightHistoryEntry } from "@/core/weight-history/interfaces/weight-history.interface";
import { sortStrategies } from "@/presentation/weight-history/utils/sort-strategies";

function buildEntry(
  id: string,
  date: string,
  weightKg: number,
): WeightHistoryEntry {
  return {
    id,
    weight: weightKg,
    weightUnit: "kg",
    weightKg,
    date,
    timestamp: new Date(date).getTime(),
  };
}

const entries: WeightHistoryEntry[] = [
  buildEntry("entry-2", "2024-02-01T00:00:00.000Z", 80),
  buildEntry("entry-1", "2024-01-01T00:00:00.000Z", 176.37),
  buildEntry("entry-3", "2024-03-01T00:00:00.000Z", 82),
];

const sortedIds = (strategy: keyof typeof sortStrategies) =>
  [...entries].sort(sortStrategies[strategy]).map((entry) => entry.id);

describe("sortStrategies", () => {
  it("orders from most recent to oldest with dateDesc", () => {
    expect(sortedIds("dateDesc")).toEqual(["entry-3", "entry-2", "entry-1"]);
  });

  it("orders from oldest to most recent with dateAsc", () => {
    expect(sortedIds("dateAsc")).toEqual(["entry-1", "entry-2", "entry-3"]);
  });

  it("orders from heaviest to lightest with weightDesc", () => {
    expect(sortedIds("weightDesc")).toEqual(["entry-1", "entry-3", "entry-2"]);
  });

  it("orders from lightest to heaviest with weightAsc", () => {
    expect(sortedIds("weightAsc")).toEqual(["entry-2", "entry-3", "entry-1"]);
  });

  it("keeps a deterministic order when an entry has an unparseable date", () => {
    const withInvalidDate = [
      ...entries,
      { ...buildEntry("entry-broken", "not-a-date", 90), timestamp: 0 },
    ];

    expect(
      [...withInvalidDate].sort(sortStrategies.dateDesc).map((e) => e.id),
    ).toEqual(["entry-3", "entry-2", "entry-1", "entry-broken"]);
  });
});
