import {
  toDisplayWeight,
  toKg,
} from "@/core/weight-history/interfaces/weight-history.interface";

describe("toKg", () => {
  it("converts grams to kg", () => {
    expect(toKg(1000)).toBe(1);
  });

  it("rounds to 2 decimals", () => {
    expect(toKg(1234)).toBe(1.23);
  });
});

describe("toDisplayWeight", () => {
  it("converts grams to kg when weightUnit is kg", () => {
    expect(toDisplayWeight(1000, "kg")).toBe(1);
  });

  it("rounds kg to 2 decimals", () => {
    expect(toDisplayWeight(1234, "kg")).toBe(1.23);
  });

  it("converts grams to lb when weightUnit is lb", () => {
    expect(toDisplayWeight(453.59237, "lb")).toBe(1);
  });

  it("rounds lb to 2 decimals", () => {
    expect(toDisplayWeight(1000, "lb")).toBe(2.2);
  });

  it("returns the grams unchanged when weightUnit is g", () => {
    expect(toDisplayWeight(500, "g")).toBe(500);
  });
});
