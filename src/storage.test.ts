import { describe, it, expect } from "vitest";
import { loadData, saveData, makeBackup, parseBackup } from "./storage";
import { emptyData } from "./domain";

describe("local recipe storage and backups", () => {
  it("round-trips a locally saved shopping item", async () => {
    const data = {
      ...emptyData(),
      extras: [
        {
          id: "extra",
          week: "2026-10-26",
          name: "Milk",
          amount: 1.5,
          unit: "l" as const,
          category: "Dairy & eggs",
        },
      ],
    };
    await saveData(data);
    expect(await loadData()).toEqual(data);
  });
  it("round-trips a valid app-specific backup", () => {
    expect(parseBackup(makeBackup(emptyData()))).toEqual(emptyData());
  });
  it("rejects unrelated files, invalid amounts and broken recipe references", () => {
    expect(() => parseBackup('{"app":"another-app"}')).toThrow();
    expect(() =>
      parseBackup(
        makeBackup({
          ...emptyData(),
          extras: [
            {
              id: "x",
              week: "2026-10-26",
              name: "Milk",
              amount: -1,
              unit: "l",
              category: "Other",
            },
          ],
        }),
      ),
    ).toThrow();
    expect(() =>
      parseBackup(
        makeBackup({
          ...emptyData(),
          meals: [
            {
              id: "x",
              recipeId: "missing",
              servings: 1,
              date: "2026-10-26",
              slot: "Dinner",
            },
          ],
        }),
      ),
    ).toThrow();
  });
});
