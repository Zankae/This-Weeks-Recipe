import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  Clock3,
  Copy,
  ExternalLink,
  Heart,
  Leaf,
  PackageCheck,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  ShoppingBasket,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  addDays,
  coopSearch,
  dateISO,
  money,
  normalizeName,
  recipeCost,
  scaleRecipe,
  weekStart,
  type AppData,
  type Recipe,
  type PlannedMeal,
  type ShoppingRow,
} from "./domain";
import {
  categories,
  displayAmount,
  IconButton,
  RecipeArt,
  Status,
  Stepper,
} from "./components";
import starters from "./starters.json";

export const shortDate = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
const dayName = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long" });
export function WeekControl({
  week,
  onChange,
}: {
  week: string;
  onChange: (week: string) => void;
}) {
  return (
    <div className="week-control">
      <IconButton
        label="Previous week"
        onClick={() => onChange(addDays(week, -7))}
      >
        <ChevronLeft size={20} />
      </IconButton>
      <button
        className="week-range"
        onClick={() => onChange(weekStart())}
        title="Go to current week"
      >
        {shortDate(week)} – {shortDate(addDays(week, 6))}
      </button>
      <IconButton label="Next week" onClick={() => onChange(addDays(week, 7))}>
        <ChevronRight size={20} />
      </IconButton>
    </div>
  );
}
export function Library({
  recipes,
  onNew,
  onOpen,
  onUpdate,
  onStarter,
}: {
  recipes: Recipe[];
  onNew: () => void;
  onOpen: (id: string) => void;
  onUpdate: (r: Recipe) => void;
  onStarter: (i: number) => void;
}) {
  const [search, setSearch] = useState(""),
    [favorites, setFavorites] = useState(false),
    [showStarters, setShowStarters] = useState(false);
  const visible = recipes
    .filter(
      (r) =>
        (!favorites || r.favorite) &&
        normalizeName(r.name).includes(normalizeName(search)),
    )
    .sort(
      (a, b) =>
        Number(b.favorite) - Number(a.favorite) ||
        b.updatedAt.localeCompare(a.updatedAt),
    );
  return (
    <div className="page library-page">
      <header className="page-heading">
        <div>
          <h1>Recipes</h1>
          <p className="page-meta">
            {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"}
          </p>
        </div>
        <button className="primary" onClick={onNew}>
          <Plus size={20} /> New recipe
        </button>
      </header>
      {recipes.length > 0 && (
        <div className="library-toolbar">
          <label className="search-field">
            <Search size={20} />
            <input
              type="search"
              aria-label="Search recipes"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search recipes"
            />
          </label>
          <button
            className={`filter-button ${favorites ? "selected" : ""}`}
            aria-pressed={favorites}
            onClick={() => setFavorites(!favorites)}
          >
            <Heart size={18} fill={favorites ? "currentColor" : "none"} />
            <span>Favourites</span>
          </button>
        </div>
      )}
      {!recipes.length ? (
        <section className="welcome-panel">
          <RecipeArt />
          <div>
            <h2>Create your first recipe</h2>
            <p>Add ingredients one at a time, or start with a recipe below.</p>
          </div>
        </section>
      ) : !visible.length ? (
        <section className="empty-state">
          <Search size={30} />
          <h2>No matching recipes</h2>
          <button
            className="secondary"
            onClick={() => {
              setSearch("");
              setFavorites(false);
            }}
          >
            Clear filters
          </button>
        </section>
      ) : (
        <div className="recipe-grid">
          {visible.map((r) => {
            const c = recipeCost(r);
            return (
              <article className="recipe-card" key={r.id}>
                <button
                  className="recipe-card-main"
                  aria-label={`Open ${r.name}`}
                  onClick={() => onOpen(r.id)}
                >
                  <RecipeArt color={r.color} />
                  <div className="recipe-card-info">
                    <h2>{r.name}</h2>
                    <div className="recipe-meta">
                      <span>
                        <Users size={15} /> {r.servings} servings
                      </span>
                      {r.minutes && (
                        <span>
                          <Clock3 size={15} /> {r.minutes} min
                        </span>
                      )}
                    </div>
                    <div className="card-bottom">
                      <span>{r.ingredients.length} ingredients</span>
                      <span>
                        {r.ingredients.length > 0 && !c.missing
                          ? `${money(c.known / r.servings)} / serving`
                          : "Prices not complete"}
                      </span>
                    </div>
                  </div>
                </button>
                <IconButton
                  label={`${r.favorite ? "Unfavourite" : "Favourite"} ${r.name}`}
                  className={`favorite-button ${r.favorite ? "is-favorite" : ""}`}
                  onClick={() => onUpdate({ ...r, favorite: !r.favorite })}
                >
                  <Heart
                    size={20}
                    fill={r.favorite ? "currentColor" : "none"}
                  />
                </IconButton>
              </article>
            );
          })}
        </div>
      )}
      <section className="starter-section">
        <div className="section-row">
          <h2>Starter recipes</h2>
          {recipes.length > 0 && (
            <button
              className="text-button"
              onClick={() => setShowStarters(!showStarters)}
            >
              {showStarters ? "Hide" : "Browse starters"}
              <ArrowRight size={17} />
            </button>
          )}
        </div>
        {(!recipes.length || showStarters) && (
          <div className="starter-grid">
            {starters.map((s, i) => (
              <button
                key={s.name}
                className={`starter-card ${s.color}`}
                onClick={() => onStarter(i)}
              >
                <span className="starter-icon">
                  <Leaf size={24} />
                </span>
                <span>
                  <strong>{s.name}</strong>
                  <small>
                    {s.minutes} min · {s.servings} servings
                  </small>
                </span>
                <Plus size={20} />
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
export function RecipeDetail({
  recipe: r,
  onBack,
  onUpdate,
  onDetails,
  onDuplicate,
  onDelete,
  onPlan,
  onIngredient,
  onMethod,
  done,
  onStep,
}: {
  recipe: Recipe;
  onBack: () => void;
  onUpdate: (r: Recipe) => void;
  onDetails: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onPlan: () => void;
  onIngredient: (id?: string) => void;
  onMethod: () => void;
  done: number[];
  onStep: (i: number) => void;
}) {
  const cost = recipeCost(r);
  return (
    <div className="page detail-page">
      <div className="detail-top">
        <button className="text-button" onClick={onBack}>
          <ArrowLeft size={19} /> All recipes
        </button>
        <div className="button-row">
          <IconButton label="Edit recipe details" onClick={onDetails}>
            <Pencil size={20} />
          </IconButton>
          <IconButton label="Duplicate recipe" onClick={onDuplicate}>
            <Copy size={20} />
          </IconButton>
          <IconButton label="Delete recipe" onClick={onDelete}>
            <Trash2 size={20} />
          </IconButton>
        </div>
      </div>
      <div className={`recipe-hero ${r.color}`}>
        <div className="recipe-hero-text">
          <h1>{r.name}</h1>
          <div className="hero-meta">
            <span>
              <Users size={17} /> {r.servings} servings
            </span>
            {r.minutes && (
              <span>
                <Clock3 size={17} /> {r.minutes} min
              </span>
            )}
          </div>
          <button
            className="primary"
            aria-label="Plan this recipe"
            onClick={onPlan}
          >
            <CalendarDays size={19} /> Add to week
          </button>
        </div>
        <RecipeArt color={r.color} />
      </div>
      <div className="recipe-columns">
        <div className="recipe-main-column">
          <section className="panel ingredient-panel">
            <div className="section-row">
              <h2>Ingredients</h2>
              <div className="servings-control">
                <span>Servings</span>
                <Stepper
                  value={r.servings}
                  onChange={(n) => onUpdate(scaleRecipe(r, n))}
                />
              </div>
            </div>
            <ul className="ingredient-list">
              {r.ingredients.map((i) => (
                <li key={i.id}>
                  <button
                    aria-label={`Edit ${i.name}`}
                    onClick={() => onIngredient(i.id)}
                  >
                    <span className="ingredient-dot" />
                    <span className="ingredient-name">
                      <strong>{i.name}</strong>
                      <Status value={i.availability} />
                    </span>
                    <span className="ingredient-quantity">
                      {displayAmount(i.amount, i.unit)}
                    </span>
                    <Pencil size={15} className="edit-hint" />
                  </button>
                </li>
              ))}
            </ul>
            {!r.ingredients.length && (
              <p className="empty-copy">Add your first ingredient below.</p>
            )}
            <button className="add-ingredient" onClick={() => onIngredient()}>
              <Plus size={20} /> Add ingredient
            </button>
          </section>
          <section className="panel method-panel">
            <div className="section-row">
              <h2>Method</h2>
              <button className="text-button" onClick={onMethod}>
                <Pencil size={16} /> {r.instructions ? "Edit" : "Add steps"}
              </button>
            </div>
            {r.instructions ? (
              <ol className="method-list">
                {r.instructions
                  .split("\n")
                  .filter((s) => s.trim())
                  .map((step, i) => (
                    <li key={i}>
                      <label className={done.includes(i) ? "done" : ""}>
                        <input
                          type="checkbox"
                          aria-label={`Step ${i + 1}`}
                          checked={done.includes(i)}
                          onChange={() => onStep(i)}
                        />
                        <span className="step-number">{i + 1}</span>
                        <span>{step}</span>
                      </label>
                    </li>
                  ))}
              </ol>
            ) : (
              <p className="empty-copy">
                Add cooking steps or notes for next time.
              </p>
            )}
          </section>
        </div>
        <aside className="recipe-summary">
          <section className="panel cost-panel">
            <h2>Recipe cost</h2>
            <div className="cost-number">
              {r.ingredients.length && cost.missing < r.ingredients.length
                ? money(cost.known)
                : "—"}
            </div>
            <p className="muted">
              {cost.missing
                ? `Known-price subtotal · ${cost.missing} ${cost.missing === 1 ? "ingredient needs" : "ingredients need"} a price`
                : r.ingredients.length
                  ? "Estimated ingredient cost"
                  : "Add ingredients and pack prices"}
            </p>
            {r.ingredients.length > 0 &&
              cost.missing < r.ingredients.length && (
                <div className="cost-per-serving">
                  <span>
                    Per serving{cost.missing ? " (known prices)" : ""}
                  </span>
                  <strong>{money(cost.known / r.servings)}</strong>
                </div>
              )}
            <p className="hint">
              Uses only the amount in this recipe. Shopping rounds up to whole
              packs.
            </p>
          </section>
          <section className="panel coop-panel">
            <span className="store-mark">coop</span>
            <h2>Stora Coop Bäckebol</h2>
            <p className="muted">
              Check ingredients on Coop, then record their pack prices and
              availability.
            </p>
            <div className="store-summary">
              <span>
                <Check size={16} />{" "}
                {r.ingredients.filter((i) => i.availability === "found").length}{" "}
                found by you
              </span>
              <span>
                {
                  r.ingredients.filter((i) => i.availability === "unchecked")
                    .length
                }{" "}
                not checked
              </span>
            </div>
            <a
              className="secondary"
              href="https://www.coop.se/butiker-erbjudanden/stora-coop/stora-coop-backebol/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open store <ExternalLink size={16} />
            </a>
          </section>
        </aside>
      </div>
    </div>
  );
}
export function WeekPage({
  data,
  week,
  onWeek,
  onMeal,
  onShopping,
  onNewRecipe,
  onRepeat,
}: {
  data: AppData;
  week: string;
  onWeek: (s: string) => void;
  onMeal: (date?: string, meal?: PlannedMeal) => void;
  onShopping: () => void;
  onNewRecipe: () => void;
  onRepeat: () => void;
}) {
  const meals = data.meals.filter(
    (m) => m.date >= week && m.date < addDays(week, 7),
  );
  return (
    <div className="page week-page">
      <header className="page-heading">
        <div>
          <h1>This week</h1>
          <p className="page-meta">
            {meals.length} planned {meals.length === 1 ? "meal" : "meals"} ·{" "}
            {meals.reduce((s, m) => s + m.servings, 0)} servings
          </p>
        </div>
        <button
          className="primary"
          disabled={!data.recipes.length}
          onClick={() => onMeal()}
        >
          <Plus size={20} /> Add meal
        </button>
      </header>
      <div className="week-toolbar">
        <WeekControl week={week} onChange={onWeek} />
        <button className="secondary" onClick={onShopping}>
          <ShoppingBasket size={19} /> Shopping list <ArrowRight size={17} />
        </button>
      </div>
      {!data.recipes.length && (
        <div className="inline-notice">
          Create a recipe first, then add it to your week.
          <button className="text-button" onClick={onNewRecipe}>
            New recipe <ArrowRight size={16} />
          </button>
        </div>
      )}
      <div className="week-grid">
        {Array.from({ length: 7 }, (_, i) => addDays(week, i)).map((day) => (
          <section
            className={`day-card ${day === dateISO() ? "today" : ""}`}
            key={day}
          >
            <header>
              <div>
                <h2>{dayName(day)}</h2>
                <span>{shortDate(day)}</span>
              </div>
              {day === dateISO() && <span className="today-label">Today</span>}
              <IconButton
                label={`Add meal for ${dayName(day)}`}
                disabled={!data.recipes.length}
                onClick={() => onMeal(day)}
              >
                <Plus size={20} />
              </IconButton>
            </header>
            <div className="day-meals">
              {meals
                .filter((m) => m.date === day)
                .sort(
                  (a, b) =>
                    (a.slot === "Lunch" ? 0 : 1) - (b.slot === "Lunch" ? 0 : 1),
                )
                .map((m) => {
                  const r = data.recipes.find((r) => r.id === m.recipeId)!;
                  return (
                    <button
                      className={`planned-meal ${r.color}`}
                      key={m.id}
                      onClick={() => onMeal(undefined, m)}
                    >
                      <span className="meal-slot">{m.slot}</span>
                      <strong>{r.name}</strong>
                      <span className="meal-servings">
                        <Users size={14} /> {m.servings} servings
                      </span>
                    </button>
                  );
                })}
              {!meals.some((m) => m.date === day) && (
                <button
                  className="empty-day"
                  disabled={!data.recipes.length}
                  onClick={() => onMeal(day)}
                >
                  <Plus size={18} /> Add meal
                </button>
              )}
            </div>
          </section>
        ))}
      </div>
      {!meals.length &&
        data.meals.some(
          (m) => m.date >= addDays(week, -7) && m.date < week,
        ) && (
          <button className="secondary repeat-week" onClick={onRepeat}>
            <Copy size={18} /> Repeat last week’s meals
          </button>
        )}
    </div>
  );
}
export function ShoppingPage({
  rows,
  week,
  onWeek,
  onAdd,
  onCheck,
  onReset,
  onRemoveExtra,
  onPlan,
}: {
  rows: ShoppingRow[];
  week: string;
  onWeek: (s: string) => void;
  onAdd: () => void;
  onCheck: (r: ShoppingRow, state: "bought" | "pantry") => void;
  onReset: () => void;
  onRemoveExtra: (ids: string[]) => void;
  onPlan: () => void;
}) {
  const [showDone, setShowDone] = useState(true),
    [copied, setCopied] = useState(false),
    [fallback, setFallback] = useState("");
  const needed = rows.filter((r) => r.state === "needed"),
    priced = needed.filter((r) => r.buyCost !== null),
    cost = priced.reduce((s, r) => s + (r.buyCost ?? 0), 0);
  const text = [
    `Shopping · ${shortDate(week)} – ${shortDate(addDays(week, 6))}`,
    ...needed.map(
      (r) =>
        `${r.name} — ${displayAmount(r.amount, r.unit)}${r.packs !== null ? ` (${r.packs} ${r.packs === 1 ? "pack" : "packs"})` : ""}`,
    ),
    "",
    priced.length
      ? `${priced.length < needed.length ? "Known-price subtotal" : "Estimated pack cost"}: ${money(cost)}`
      : "Prices not entered",
  ].join("\n");
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setFallback(text);
    }
  }
  return (
    <div className="page shopping-page">
      <header className="page-heading">
        <div>
          <h1>Shopping</h1>
          <p className="page-meta">Stora Coop Bäckebol</p>
        </div>
        <button className="primary" onClick={onAdd}>
          <Plus size={20} /> Add item
        </button>
      </header>
      <div className="week-toolbar">
        <WeekControl week={week} onChange={onWeek} />
        <button
          className="secondary"
          disabled={!rows.length}
          onClick={() => void copy()}
        >
          <Clipboard size={17} /> {copied ? "Copied" : "Copy list"}
        </button>
      </div>
      {fallback && (
        <label className="copy-fallback">
          Copy this shopping list
          <textarea
            readOnly
            value={fallback}
            rows={6}
            onFocus={(e) => e.target.select()}
          />
          <button className="text-button" onClick={() => setFallback("")}>
            Close
          </button>
        </label>
      )}
      <div className="shopping-overview">
        <div>
          <span>Still to buy</span>
          <strong>
            {needed.length}
            <small> / {rows.length} items</small>
          </strong>
        </div>
        <div>
          <span>
            {priced.length < needed.length
              ? "Known-price subtotal"
              : "Estimated pack cost"}
          </span>
          <strong>
            {priced.length
              ? money(cost)
              : !needed.length && rows.length
                ? money(0)
                : "—"}
          </strong>
          {needed.length - priced.length > 0 && (
            <small>{needed.length - priced.length} without a price</small>
          )}
        </div>
      </div>
      {rows.length > 0 && (
        <div className="shopping-tools">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={showDone}
              onChange={(e) => setShowDone(e.target.checked)}
            />{" "}
            Show bought & in cupboard
          </label>
          <button
            className="text-button"
            disabled={!rows.some((r) => r.state !== "needed")}
            onClick={onReset}
          >
            <RotateCcw size={16} /> Reset ticks
          </button>
        </div>
      )}
      {!rows.length ? (
        <section className="empty-state shopping-empty">
          <ShoppingBasket size={42} strokeWidth={1.4} />
          <h2>Your shopping list is empty</h2>
          <p>Add meals to your week, or add an extra item.</p>
          <button className="secondary" onClick={onPlan}>
            <CalendarDays size={18} /> Plan your week
          </button>
        </section>
      ) : (
        <div className="shopping-groups">
          {categories.map((category) => {
            const group = rows.filter(
              (r) =>
                r.category === category && (showDone || r.state === "needed"),
            );
            return group.length ? (
              <section className="shopping-group" key={category}>
                <h2>
                  {category}
                  <span>{group.length}</span>
                </h2>
                <div className="shopping-items">
                  {group.map((r) => (
                    <div
                      className={`shopping-item ${r.state !== "needed" ? "checked" : ""}`}
                      key={r.key}
                    >
                      <label className="bought-check">
                        <input
                          type="checkbox"
                          aria-label={`Bought ${r.name}`}
                          checked={r.state === "bought"}
                          onChange={() => onCheck(r, "bought")}
                        />
                        <span aria-hidden="true">
                          <Check size={20} />
                        </span>
                      </label>
                      <div className="shopping-item-content">
                        <div className="shopping-item-top">
                          <strong>{r.name}</strong>
                          <span className="shopping-amount">
                            {displayAmount(r.amount, r.unit)}
                          </span>
                        </div>
                        <div className="shopping-item-bottom">
                          <span>
                            {r.packs !== null
                              ? `${r.packs} ${r.packs === 1 ? "pack" : "packs"} × ${displayAmount(r.packSize!, r.unit)}`
                              : r.priceConflict
                                ? "Different pack prices — edit recipe ingredients"
                                : "No pack price"}
                            {r.buyCost !== null ? ` · ${money(r.buyCost)}` : ""}
                          </span>
                          <Status value={r.availability} />
                        </div>
                        {r.sources.length > 0 && (
                          <p className="item-sources">
                            {r.sources.join(" · ")}
                          </p>
                        )}
                        {r.state === "pantry" && (
                          <small className="pantry-note">In cupboard</small>
                        )}
                      </div>
                      <div className="shopping-item-actions">
                        <IconButton
                          label={
                            r.state === "pantry"
                              ? `Need ${r.name} after all`
                              : `Already have ${r.name}`
                          }
                          className={
                            r.state === "pantry" ? "pantry-active" : ""
                          }
                          onClick={() => onCheck(r, "pantry")}
                        >
                          <PackageCheck size={20} />
                        </IconButton>
                        <a
                          className="icon-button"
                          aria-label={`Find ${r.name} at Coop`}
                          href={coopSearch(r.searchTerm)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink size={18} />
                        </a>
                        {r.extraIds.length > 0 && (
                          <IconButton
                            label={`Remove extra ${r.name}`}
                            onClick={() => onRemoveExtra(r.extraIds)}
                          >
                            <X size={18} />
                          </IconButton>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null;
          })}
          {!showDone && !needed.length && (
            <section className="empty-state">
              <Check size={36} />
              <h2>Everything is ticked off</h2>
              <button className="secondary" onClick={() => setShowDone(true)}>
                Show all items
              </button>
            </section>
          )}
        </div>
      )}
      {rows.length > 0 && (
        <p className="shopping-disclaimer">
          Pack prices are your entries, not live Coop prices. “Found by me” is a
          saved check, not a stock guarantee.
        </p>
      )}
    </div>
  );
}
