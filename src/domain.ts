export type Unit = "g" | "kg" | "ml" | "l" | "pcs";
export type Availability = "unchecked" | "found" | "substitute";
export interface Ingredient {
  id: string;
  name: string;
  searchTerm: string;
  category: string;
  amount: number;
  unit: Unit;
  packSize: number | null;
  packPrice: number | null;
  availability: Availability;
  checkedAt: string | null;
}
export interface Recipe {
  id: string;
  name: string;
  servings: number;
  minutes: number | null;
  ingredients: Ingredient[];
  instructions: string;
  favorite: boolean;
  color: "sage" | "peach" | "sand" | "lavender";
  updatedAt: string;
}
export interface PlannedMeal {
  id: string;
  date: string;
  recipeId: string;
  servings: number;
  slot: "Lunch" | "Dinner";
}
export interface ShoppingCheck {
  key: string;
  signature: string;
  state: "bought" | "pantry";
}
export interface ShoppingExtra {
  id: string;
  week: string;
  name: string;
  amount: number;
  unit: Unit;
  category: string;
}
export interface AppData {
  recipes: Recipe[];
  meals: PlannedMeal[];
  extras: ShoppingExtra[];
  checks: ShoppingCheck[];
}
export interface ShoppingRow {
  key: string;
  name: string;
  searchTerm: string;
  category: string;
  amount: number;
  unit: Unit;
  packSize: number | null;
  packPrice: number | null;
  packs: number | null;
  buyCost: number | null;
  availability: Availability;
  checkedAt: string | null;
  sources: string[];
  signature: string;
  state: "needed" | "bought" | "pantry";
  priceConflict: boolean;
  extraIds: string[];
}
export function normalizeName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}
export function buildShopping(data: AppData, week: string): ShoppingRow[] {
  const end = addDays(week, 7);
  const groups = new Map<string, ShoppingRow>();
  const add = (
    ingredient: Ingredient,
    amount: number,
    source: string,
    extraId?: string,
  ) => {
    const multiplier =
      ingredient.unit === "kg" || ingredient.unit === "l" ? 1000 : 1;
    const unit: Unit =
      ingredient.unit === "kg"
        ? "g"
        : ingredient.unit === "l"
          ? "ml"
          : ingredient.unit;
    const key = `${week}|${normalizeName(ingredient.name)}|${unit}`;
    const packSize =
      ingredient.packSize === null ? null : ingredient.packSize * multiplier;
    let row = groups.get(key);
    if (!row) {
      row = {
        key,
        name: ingredient.name,
        searchTerm: ingredient.searchTerm,
        category: ingredient.category,
        amount: 0,
        unit,
        packSize,
        packPrice: ingredient.packPrice,
        packs: null,
        buyCost: null,
        availability: ingredient.availability,
        checkedAt: ingredient.checkedAt,
        sources: [],
        signature: "",
        state: "needed",
        priceConflict: false,
        extraIds: [],
      };
      groups.set(key, row);
    } else {
      if (
        row.packPrice !== null &&
        ingredient.packPrice !== null &&
        (row.packPrice !== ingredient.packPrice || row.packSize !== packSize)
      )
        row.priceConflict = true;
      if (
        row.packPrice === null &&
        ingredient.packPrice !== null &&
        !row.priceConflict
      ) {
        row.packPrice = ingredient.packPrice;
        row.packSize = packSize;
      }
      if (
        ingredient.availability === "substitute" ||
        row.availability === "substitute"
      )
        row.availability = "substitute";
      else if (
        ingredient.availability === "unchecked" ||
        row.availability === "unchecked"
      )
        row.availability = "unchecked";
      if (!ingredient.checkedAt) row.checkedAt = null;
      else if (row.checkedAt && ingredient.checkedAt < row.checkedAt)
        row.checkedAt = ingredient.checkedAt;
    }
    row.amount += amount * multiplier;
    if (source && !row.sources.includes(source)) row.sources.push(source);
    if (extraId) row.extraIds.push(extraId);
  };
  for (const meal of data.meals.filter((m) => m.date >= week && m.date < end)) {
    const recipe = data.recipes.find((r) => r.id === meal.recipeId);
    if (recipe)
      for (const ingredient of recipe.ingredients)
        add(
          ingredient,
          (ingredient.amount * meal.servings) / recipe.servings,
          recipe.name,
        );
  }
  for (const item of data.extras.filter((i) => i.week === week))
    add(
      {
        ...item,
        searchTerm: item.name,
        packPrice: null,
        packSize: null,
        availability: "unchecked",
        checkedAt: null,
      },
      item.amount,
      "",
      item.id,
    );
  return [...groups.values()]
    .map((row) => {
      row.amount = Math.round(row.amount * 1e8) / 1e8;
      if (row.priceConflict) {
        row.packPrice = null;
        row.packSize = null;
      }
      if (row.packPrice !== null && row.packSize !== null && row.packSize > 0) {
        row.packs = Math.ceil(Number((row.amount / row.packSize).toFixed(8)));
        row.buyCost = row.packs * row.packPrice;
      }
      row.signature = `${row.amount}|${row.packSize}|${row.packPrice}`;
      row.state =
        data.checks.find(
          (c) => c.key === row.key && c.signature === row.signature,
        )?.state ?? "needed";
      return row;
    })
    .sort(
      (a, b) =>
        a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
    );
}
export function scaleRecipe(recipe: Recipe, servings: number): Recipe {
  if (
    !Number.isFinite(servings) ||
    !Number.isInteger(servings) ||
    servings < 1 ||
    servings > 100
  )
    throw new Error("Choose 1–100 servings.");
  return {
    ...recipe,
    servings,
    updatedAt: new Date().toISOString(),
    ingredients: recipe.ingredients.map((i) => ({
      ...i,
      amount: Number(((i.amount * servings) / recipe.servings).toPrecision(12)),
    })),
  };
}
export function dateISO(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return dateISO(date);
}
export function weekStart(iso = dateISO()): string {
  const date = new Date(`${iso}T12:00:00`);
  return addDays(iso, -(date.getDay() + 6) % 7);
}
export function decimal(value: string): number | null {
  const clean = value.trim().replace(",", ".");
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(clean)) return null;
  const number = Number(clean);
  return Number.isFinite(number) && number <= 1000000 ? number : null;
}
export const quantity = (value: number) =>
  new Intl.NumberFormat("en-GB", { maximumFractionDigits: 3 }).format(value);
export const money = (value: number) =>
  `${new Intl.NumberFormat("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} kr`;
export const coopSearch = (term: string) =>
  `https://www.coop.se/handla/sok/?q=${encodeURIComponent(term)}`;
export const emptyData = (): AppData => ({
  recipes: [],
  meals: [],
  extras: [],
  checks: [],
});
export function recipeCost(recipe: Recipe) {
  const costs = recipe.ingredients.map(ingredientCost);
  return {
    known: costs.reduce<number>((sum, cost) => sum + (cost ?? 0), 0),
    missing: costs.filter((c) => c === null).length,
  };
}

export function ingredientCost(ingredient: Ingredient): number | null {
  if (
    ingredient.packSize === null ||
    ingredient.packSize <= 0 ||
    ingredient.packPrice === null ||
    !Number.isFinite(ingredient.packSize) ||
    !Number.isFinite(ingredient.packPrice)
  )
    return null;
  return (ingredient.amount / ingredient.packSize) * ingredient.packPrice;
}
