import Dexie, { type Table } from "dexie";
import { z } from "zod";
import { emptyData, dateISO, type AppData } from "./domain";

const id = z.string().min(1).max(200);
const name = z.string().trim().min(1).max(150);
const amount = z.number().finite().positive().max(1000000);
const unit = z.enum(["g", "kg", "ml", "l", "pcs"]);
const day = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((s) => dateISO(new Date(`${s}T12:00:00`)) === s);
const ingredient = z.object({
  id,
  name,
  searchTerm: z.string().max(200),
  category: z.string().min(1).max(80),
  amount,
  unit,
  packSize: amount.nullable(),
  packPrice: z.number().finite().min(0).max(1000000).nullable(),
  availability: z.enum(["unchecked", "found", "substitute"]),
  checkedAt: z.string().max(100).nullable(),
});
export const dataSchema = z
  .object({
    recipes: z
      .array(
        z.object({
          id,
          name,
          servings: z.number().int().min(1).max(100),
          minutes: z.number().int().min(1).max(1440).nullable(),
          ingredients: z.array(ingredient).max(500),
          instructions: z.string().max(50000),
          favorite: z.boolean(),
          color: z.enum(["sage", "peach", "sand", "lavender"]),
          updatedAt: z.string().max(100),
        }),
      )
      .max(2000),
    meals: z
      .array(
        z.object({
          id,
          date: day,
          recipeId: id,
          servings: z.number().int().min(1).max(100),
          slot: z.enum(["Lunch", "Dinner"]),
        }),
      )
      .max(20000),
    extras: z
      .array(
        z.object({
          id,
          week: day,
          name,
          amount,
          unit,
          category: z.string().min(1).max(80),
        }),
      )
      .max(10000),
    checks: z
      .array(
        z.object({
          key: z.string().max(500),
          signature: z.string().max(200),
          state: z.enum(["bought", "pantry"]),
        }),
      )
      .max(50000),
  })
  .superRefine((data, ctx) => {
    const recipes = new Set(data.recipes.map((r) => r.id));
    if (data.meals.some((m) => !recipes.has(m.recipeId)))
      ctx.addIssue({
        code: "custom",
        message: "A planned meal references a missing recipe.",
      });
    for (const values of [
      data.recipes,
      data.meals,
      data.extras,
      ...data.recipes.map((r) => r.ingredients),
    ]) {
      if (new Set(values.map((v) => v.id)).size !== values.length)
        ctx.addIssue({ code: "custom", message: "Duplicate identifiers." });
    }
  });
const envelope = z.object({
  app: z.literal("This-Weeks-Recipe"),
  schemaVersion: z.literal(1),
  data: dataSchema,
});
class RecipeDatabase extends Dexie {
  snapshots!: Table<{ id: string; data: AppData; schemaVersion: number }>;
  constructor() {
    super("this-weeks-recipe");
    this.version(1).stores({ snapshots: "&id" });
  }
}
const db = new RecipeDatabase();
export async function loadData(): Promise<AppData> {
  const row = await db.snapshots.get("current");
  if (!row) return emptyData();
  if (row.schemaVersion !== 1)
    throw new Error("Saved data uses a different version.");
  return dataSchema.parse(row.data);
}
export async function saveData(data: AppData): Promise<void> {
  const validated = dataSchema.parse(data);
  await db.snapshots.put({ id: "current", schemaVersion: 1, data: validated });
}
export function parseBackup(text: string): AppData {
  try {
    return envelope.parse(JSON.parse(text)).data;
  } catch {
    throw new Error(
      "This is not a valid This-Weeks-Recipe backup. Nothing has been changed.",
    );
  }
}
export function makeBackup(data: AppData): string {
  return JSON.stringify(
    {
      app: "This-Weeks-Recipe",
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      data,
    },
    null,
    2,
  );
}
