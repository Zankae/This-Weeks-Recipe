import { describe, it, expect } from "vitest";
import {
  ingredientCost,
  buildShopping,
  scaleRecipe,
  type Ingredient,
  type Recipe,
  type AppData,
} from "./domain";

export const rice: Ingredient = {
  id: "rice",
  name: "Rice",
  searchTerm: "ris",
  category: "Pantry",
  amount: 120,
  unit: "g",
  packSize: 500,
  packPrice: 35,
  availability: "unchecked",
  checkedAt: null,
};

describe("ingredient cost", () => {
  it("calculates only the fraction of a purchased pack used in the recipe", () => {
    expect(ingredientCost(rice)).toBeCloseTo((35 * 120) / 500);
  });
  it("keeps an unknown price distinct from a genuine zero price", () => {
    expect(ingredientCost({ ...rice, packPrice: null })).toBeNull();
    expect(ingredientCost({ ...rice, packPrice: 0 })).toBe(0);
    expect(ingredientCost({ ...rice, packSize: 0 })).toBeNull();
  });
});

const recipe: Recipe = {
  id: "meal",
  name: "Rice bowl",
  servings: 2,
  minutes: 20,
  ingredients: [rice],
  instructions: "",
  favorite: false,
  color: "sage",
  updatedAt: "2026-10-26",
};
const data: AppData = {
  recipes: [recipe],
  meals: [
    {
      id: "mon",
      recipeId: "meal",
      date: "2026-10-26",
      servings: 4,
      slot: "Dinner",
    },
    {
      id: "tue",
      recipeId: "meal",
      date: "2026-10-27",
      servings: 6,
      slot: "Lunch",
    },
    {
      id: "next",
      recipeId: "meal",
      date: "2026-11-02",
      servings: 2,
      slot: "Dinner",
    },
  ],
  extras: [],
  checks: [],
};

describe("weekly shopping", () => {
  it("combines planned portions for the selected week and rounds up whole packs", () => {
    const rows = buildShopping(data, "2026-10-26");
    expect(rows).toHaveLength(1);
    expect(rows[0].amount).toBe((120 * (4 + 6)) / 2);
    expect(rows[0].packs).toBe(2);
    expect(rows[0].buyCost).toBe(2 * 35);
    expect(rows[0].state).toBe("needed");
  });
  it("converts kg to grams before combining and keeps pieces separate", () => {
    const rows = buildShopping(
      {
        ...data,
        recipes: [
          {
            ...recipe,
            ingredients: [
              rice,
              { ...rice, id: "kg", amount: 0.12, unit: "kg", packSize: 0.5 },
              {
                ...rice,
                id: "piece",
                amount: 1,
                unit: "pcs",
                packPrice: null,
                packSize: null,
              },
            ],
          },
        ],
      },
      "2026-10-26",
    );
    expect(rows).toHaveLength(2);
    expect(rows.find((r) => r.unit === "g")?.amount).toBe(
      (120 * 2 * (4 + 6)) / 2,
    );
  });
  it("invalidates a checked item if its required quantity changes", () => {
    const row = buildShopping(data, "2026-10-26")[0];
    expect(row).toBeDefined();
    const checked = {
      ...data,
      checks: [
        { key: row.key, signature: row.signature, state: "bought" as const },
      ],
    };
    expect(buildShopping(checked, "2026-10-26")[0].state).toBe("bought");
    expect(
      buildShopping(
        { ...checked, meals: data.meals.slice(0, 1) },
        "2026-10-26",
      )[0].state,
    ).toBe("needed");
  });
  it("does not treat missing prices as zero or invent a price from conflicting packs", () => {
    const missing = buildShopping(
      {
        ...data,
        recipes: [{ ...recipe, ingredients: [{ ...rice, packPrice: null }] }],
      },
      "2026-10-26",
    )[0];
    expect(missing).toBeDefined();
    expect(missing.buyCost).toBeNull();
    const conflict = buildShopping(
      {
        ...data,
        recipes: [
          {
            ...recipe,
            ingredients: [rice, { ...rice, id: "other", packPrice: 45 }],
          },
        ],
      },
      "2026-10-26",
    )[0];
    expect(conflict.priceConflict).toBe(true);
    expect(conflict.buyCost).toBeNull();
  });
});

describe("recipe scaling", () => {
  it("scales ingredient amounts but not package size or package price", () => {
    const result = scaleRecipe(recipe, 5);
    expect(result.servings).toBe(5);
    expect(result.ingredients[0].amount).toBe((120 * 5) / 2);
    expect(result.ingredients[0].packSize).toBe(500);
    expect(result.ingredients[0].packPrice).toBe(35);
    expect(recipe.ingredients[0].amount).toBe(120);
  });
  it("rejects invalid serving counts", () => {
    expect(() => scaleRecipe(recipe, 0)).toThrow();
    expect(() => scaleRecipe(recipe, Number.NaN)).toThrow();
  });
});
