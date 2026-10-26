import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  ShoppingBasket,
  ChartNoAxesCombined,
  Settings2,
  ExternalLink,
} from "lucide-react";
import {
  addDays,
  buildShopping,
  scaleRecipe,
  weekStart,
  type AppData,
  type Ingredient,
  type PlannedMeal,
  type Recipe,
  type ShoppingRow,
} from "./domain";
import { loadData, saveData } from "./storage";
import {
  Dialog,
  ExtraForm,
  IconButton,
  IngredientEditor,
  MealForm,
  RecipeForm,
  Settings,
} from "./components";
import { Library, RecipeDetail, ShoppingPage, WeekPage } from "./pages";
import catalogue from "./ingredients.json";
import starters from "./starters.json";

type Page = "recipes" | "week" | "shopping" | "nutrients";
type Modal =
  | { type: "recipe"; recipe?: Recipe }
  | { type: "ingredient"; ingredient?: Ingredient }
  | { type: "meal"; meal?: PlannedMeal; recipeId?: string; date?: string }
  | { type: "extra" }
  | { type: "settings" }
  | { type: "delete"; recipe: Recipe }
  | { type: "method" };
const navigation = [
  { id: "recipes", name: "Recipes", icon: BookOpen },
  { id: "week", name: "This week", icon: CalendarDays },
  { id: "shopping", name: "Shopping", icon: ShoppingBasket },
  { id: "nutrients", name: "Nutrients", icon: ChartNoAxesCombined },
] as const;
function MethodForm({
  initial,
  onSave,
  onClose,
}: {
  initial: string;
  onSave: (text: string) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState(initial);
  return (
    <Dialog title="Cooking instructions" onClose={onClose}>
      <form
        className="modal-body"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(text.trim());
        }}
      >
        <label>
          One step per line
          <textarea
            value={text}
            maxLength={50000}
            rows={9}
            onChange={(e) => setText(e.target.value)}
            placeholder="Prepare your ingredients…"
          />
        </label>
        <footer className="modal-actions">
          <button className="secondary" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary" type="submit">
            Save instructions
          </button>
        </footer>
      </form>
    </Dialog>
  );
}
export default function AppView() {
  const [data, setData] = useState<AppData | null>(null),
    [loadError, setLoadError] = useState(false),
    [saveError, setSaveError] = useState(false);
  const [page, setPage] = useState<Page>("recipes"),
    [selectedId, setSelectedId] = useState<string | null>(null),
    [modal, setModal] = useState<Modal | null>(null),
    [week, setWeek] = useState(weekStart);
  const [stepsDone, setStepsDone] = useState<Record<string, number[]>>({});
  const mainRef = useRef<HTMLElement>(null);
  const modalOpener = useRef<HTMLElement | null>(null);
  function closeModal() {
    const opener = modalOpener.current;
    setModal(null);
    // Safari does not focus a button when tapped. Restore the actual opener,
    // after the app shell is no longer inert, without focusing an input.
    setTimeout(() => {
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    }, 0);
  }
  useEffect(() => {
    let active = true;
    loadData()
      .then((value) => {
        if (active) setData(value);
      })
      .catch(() => {
        if (active) setLoadError(true);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (data)
      void saveData(data)
        .then(() => setSaveError(false))
        .catch(() => setSaveError(true));
  }, [data]);
  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }, [page, selectedId]);
  const recipe = data?.recipes.find((r) => r.id === selectedId);
  const rows = useMemo(
    () => (data ? buildShopping(data, week) : []),
    [data, week],
  );
  function change(fn: (d: AppData) => AppData) {
    setData((current) => (current ? fn(current) : current));
  }
  function updateRecipe(next: Recipe) {
    change((d) => ({
      ...d,
      recipes: d.recipes.map((r) =>
        r.id === next.id ? { ...next, updatedAt: new Date().toISOString() } : r,
      ),
    }));
  }
  function openRecipe(id: string) {
    setSelectedId(id);
    setPage("recipes");
  }
  function createRecipe(values: {
    name: string;
    servings: number;
    minutes: number | null;
    color: Recipe["color"];
  }) {
    const next: Recipe = {
      ...values,
      id: crypto.randomUUID(),
      instructions: "",
      ingredients: [],
      favorite: false,
      updatedAt: new Date().toISOString(),
    };
    change((d) => ({ ...d, recipes: [...d.recipes, next] }));
    openRecipe(next.id);
    closeModal();
    void navigator.storage?.persist?.().catch(() => {});
  }
  function addStarter(index: number) {
    const starter = starters[index];
    const next: Recipe = {
      id: crypto.randomUUID(),
      name: starter.name,
      servings: starter.servings,
      minutes: starter.minutes,
      color: starter.color as Recipe["color"],
      instructions: starter.instructions,
      favorite: false,
      updatedAt: new Date().toISOString(),
      ingredients: starter.ingredients.map(([name, amount]) => {
        const match = catalogue.find((i) => i[0] === name)!;
        return {
          id: crypto.randomUUID(),
          name: String(name),
          searchTerm: match[1],
          category: match[2],
          unit: match[3] as Ingredient["unit"],
          amount: Number(amount),
          packSize: null,
          packPrice: null,
          availability: "unchecked",
          checkedAt: null,
        };
      }),
    };
    change((d) => ({ ...d, recipes: [...d.recipes, next] }));
    openRecipe(next.id);
  }
  function toggleCheck(row: ShoppingRow, state: "bought" | "pantry") {
    change((d) => ({
      ...d,
      checks: [
        ...d.checks.filter((c) => c.key !== row.key),
        ...(row.state === state
          ? []
          : [{ key: row.key, signature: row.signature, state }]),
      ],
    }));
  }
  if (loadError)
    return (
      <div className="startup">
        <BookOpen size={42} />
        <h1>Couldn’t open your recipes</h1>
        <p>
          Your saved data has not been replaced. Close and reopen the app, or
          try reloading.
        </p>
        <button className="primary" onClick={() => location.reload()}>
          Reload
        </button>
      </div>
    );
  if (!data)
    return (
      <div className="startup" role="status">
        <img
          src={`${import.meta.env.BASE_URL}favicon.svg`}
          alt=""
          width="64"
          height="64"
        />
        <p>Opening recipes…</p>
      </div>
    );
  return (
    <>
      <div
        className="app-shell"
        inert={modal !== null}
        onClickCapture={(event) => {
          const target = (event.target as Element).closest<HTMLElement>(
            "button,a[href]",
          );
          if (target) modalOpener.current = target;
        }}
      >
        <aside className="sidebar">
          <a
            className="brand"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setPage("recipes");
              setSelectedId(null);
            }}
            aria-label="This-Weeks-Recipe home"
          >
            <img
              src={`${import.meta.env.BASE_URL}favicon.svg`}
              width="42"
              height="42"
              alt=""
            />
            <span>
              This-Weeks-
              <br />
              Recipe
            </span>
          </a>
          <nav aria-label="Main navigation">
            {navigation.map(({ id, name, icon: Icon }) => (
              <button
                key={id}
                className={`nav-item ${page === id ? "active" : ""}`}
                aria-current={page === id ? "page" : undefined}
                aria-label={name}
                onClick={() => {
                  setPage(id);
                  if (id === "recipes") setSelectedId(null);
                }}
              >
                <Icon size={22} strokeWidth={1.8} />
                <span>{name}</span>
                {id === "shopping" &&
                  rows.some((r) => r.state === "needed") && (
                    <span className="nav-count" aria-hidden="true">
                      {rows.filter((r) => r.state === "needed").length}
                    </span>
                  )}
              </button>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <a
              className="store-link"
              href="https://www.coop.se/butiker-erbjudanden/stora-coop/stora-coop-backebol/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="store-mark">coop</span>
              <span>
                Stora Coop
                <br />
                <strong>Bäckebol</strong>
              </span>
              <ExternalLink size={14} />
            </a>
            <button
              className="settings-link"
              onClick={() => setModal({ type: "settings" })}
            >
              <Settings2 size={20} /> Settings & backup
            </button>
          </div>
        </aside>
        <div className="content-shell">
          <header className="mobile-header">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setPage("recipes");
                setSelectedId(null);
              }}
            >
              <img
                src={`${import.meta.env.BASE_URL}favicon.svg`}
                alt=""
                width="32"
                height="32"
              />
              <span>This-Weeks-Recipe</span>
            </a>
            <IconButton
              label="Settings & backup"
              onClick={() => setModal({ type: "settings" })}
            >
              <Settings2 size={22} />
            </IconButton>
          </header>
          {saveError && (
            <div role="alert" className="save-warning">
              Your latest changes couldn’t be saved on this device. Keep the app
              open and export a backup.
              <button onClick={() => setModal({ type: "settings" })}>
                Export backup
              </button>
            </div>
          )}
          <main
            ref={mainRef}
            id="main-content"
            className={`main-content ${page === "nutrients" ? "nutrients-main" : ""}`}
          >
            {page === "nutrients" && (
              <div className="wip">
                <h1>Work In Progress</h1>
              </div>
            )}
            {page === "recipes" && !recipe && (
              <Library
                recipes={data.recipes}
                onNew={() => setModal({ type: "recipe" })}
                onOpen={openRecipe}
                onUpdate={updateRecipe}
                onStarter={addStarter}
              />
            )}
            {page === "recipes" && recipe && (
              <RecipeDetail
                recipe={recipe}
                onBack={() => setSelectedId(null)}
                onUpdate={updateRecipe}
                onDetails={() => setModal({ type: "recipe", recipe })}
                onDelete={() => setModal({ type: "delete", recipe })}
                onDuplicate={() => {
                  const copy: Recipe = {
                    ...recipe,
                    id: crypto.randomUUID(),
                    name: `${recipe.name.slice(0, 140)} (copy)`,
                    ingredients: recipe.ingredients.map((i) => ({
                      ...i,
                      id: crypto.randomUUID(),
                    })),
                    updatedAt: new Date().toISOString(),
                  };
                  change((d) => ({ ...d, recipes: [...d.recipes, copy] }));
                  openRecipe(copy.id);
                }}
                onPlan={() => setModal({ type: "meal", recipeId: recipe.id })}
                onIngredient={(id) =>
                  setModal({
                    type: "ingredient",
                    ingredient: recipe.ingredients.find((i) => i.id === id),
                  })
                }
                onMethod={() => setModal({ type: "method" })}
                done={stepsDone[recipe.id] ?? []}
                onStep={(i) =>
                  setStepsDone((p) => {
                    const previous = p[recipe.id] ?? [];
                    return {
                      ...p,
                      [recipe.id]: previous.includes(i)
                        ? previous.filter((n) => n !== i)
                        : [...previous, i],
                    };
                  })
                }
              />
            )}
            {page === "week" && (
              <WeekPage
                data={data}
                week={week}
                onWeek={setWeek}
                onMeal={(date, meal) => setModal({ type: "meal", date, meal })}
                onShopping={() => setPage("shopping")}
                onNewRecipe={() => {
                  setPage("recipes");
                  setModal({ type: "recipe" });
                }}
                onRepeat={() =>
                  change((d) => ({
                    ...d,
                    meals: [
                      ...d.meals,
                      ...d.meals
                        .filter(
                          (m) => m.date >= addDays(week, -7) && m.date < week,
                        )
                        .map((m) => ({
                          ...m,
                          id: crypto.randomUUID(),
                          date: addDays(m.date, 7),
                        })),
                    ],
                  }))
                }
              />
            )}
            {page === "shopping" && (
              <ShoppingPage
                rows={rows}
                week={week}
                onWeek={setWeek}
                onAdd={() => setModal({ type: "extra" })}
                onCheck={toggleCheck}
                onReset={() =>
                  change((d) => ({
                    ...d,
                    checks: d.checks.filter(
                      (c) => !rows.some((r) => r.key === c.key),
                    ),
                  }))
                }
                onRemoveExtra={(ids) =>
                  change((d) => ({
                    ...d,
                    extras: d.extras.filter((e) => !ids.includes(e.id)),
                  }))
                }
                onPlan={() => setPage("week")}
              />
            )}
          </main>
        </div>
      </div>
      {modal?.type === "recipe" && (
        <RecipeForm
          initial={modal.recipe}
          onClose={() => closeModal()}
          onSave={(values) => {
            if (modal.recipe) {
              updateRecipe({
                ...scaleRecipe(modal.recipe, values.servings),
                ...values,
              });
              closeModal();
            } else createRecipe(values);
          }}
        />
      )}
      {modal?.type === "ingredient" && recipe && (
        <IngredientEditor
          initial={modal.ingredient}
          suggestions={data.recipes.flatMap((r) => r.ingredients)}
          onClose={() => closeModal()}
          onSave={(ingredient) => {
            updateRecipe({
              ...recipe,
              ingredients: modal.ingredient
                ? recipe.ingredients.map((i) =>
                    i.id === ingredient.id ? ingredient : i,
                  )
                : [...recipe.ingredients, ingredient],
            });
            closeModal();
          }}
          onDelete={
            modal.ingredient
              ? () => {
                  updateRecipe({
                    ...recipe,
                    ingredients: recipe.ingredients.filter(
                      (i) => i.id !== modal.ingredient?.id,
                    ),
                  });
                  closeModal();
                }
              : undefined
          }
        />
      )}
      {modal?.type === "meal" && (
        <MealForm
          recipes={data.recipes}
          week={week}
          initial={modal.meal}
          recipeId={modal.recipeId}
          date={modal.date}
          onClose={() => closeModal()}
          onSave={(meal) => {
            change((d) => ({
              ...d,
              meals: modal.meal
                ? d.meals.map((m) => (m.id === meal.id ? meal : m))
                : [...d.meals, meal],
            }));
            setWeek(weekStart(meal.date));
            closeModal();
          }}
          onDelete={
            modal.meal
              ? () => {
                  change((d) => ({
                    ...d,
                    meals: d.meals.filter((m) => m.id !== modal.meal?.id),
                  }));
                  closeModal();
                }
              : undefined
          }
        />
      )}
      {modal?.type === "extra" && (
        <ExtraForm
          onClose={() => closeModal()}
          onSave={(name, amount, unit, category) => {
            change((d) => ({
              ...d,
              extras: [
                ...d.extras,
                { id: crypto.randomUUID(), week, name, amount, unit, category },
              ],
            }));
            closeModal();
          }}
        />
      )}
      {modal?.type === "settings" && (
        <Settings
          data={data}
          onClose={() => closeModal()}
          onRestore={async (next) => {
            await saveData(next);
            setData(next);
            setSelectedId(null);
            setPage("recipes");
            setSaveError(false);
          }}
        />
      )}
      {modal?.type === "delete" && (
        <Dialog title="Delete recipe?" onClose={() => closeModal()}>
          <div className="modal-body">
            <p>
              <strong>{modal.recipe.name}</strong> will be removed from your
              recipes and every weekly plan. This cannot be undone.
            </p>
            <footer className="modal-actions">
              <button className="secondary" onClick={() => closeModal()}>
                Cancel
              </button>
              <button
                className="danger"
                onClick={() => {
                  const id = modal.recipe.id;
                  change((d) => ({
                    ...d,
                    recipes: d.recipes.filter((r) => r.id !== id),
                    meals: d.meals.filter((m) => m.recipeId !== id),
                  }));
                  setSelectedId(null);
                  closeModal();
                }}
              >
                Delete recipe
              </button>
            </footer>
          </div>
        </Dialog>
      )}
      {modal?.type === "method" && recipe && (
        <MethodForm
          initial={recipe.instructions}
          onClose={() => closeModal()}
          onSave={(instructions) => {
            updateRecipe({ ...recipe, instructions });
            setStepsDone((p) => ({ ...p, [recipe.id]: [] }));
            closeModal();
          }}
        />
      )}
    </>
  );
}
