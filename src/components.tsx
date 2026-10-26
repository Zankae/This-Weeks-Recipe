import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type FormEvent,
} from "react";
import {
  X,
  Plus,
  Minus,
  ExternalLink,
  Download,
  Upload,
  Check,
  Trash2,
} from "lucide-react";
import ingredients from "./ingredients.json";
import {
  coopSearch,
  decimal,
  dateISO,
  addDays,
  quantity,
  type Ingredient,
  type Recipe,
  type PlannedMeal,
  type Unit,
  type AppData,
} from "./domain";
import { makeBackup, parseBackup } from "./storage";

export const categories = [
  "Produce",
  "Meat & fish",
  "Dairy & eggs",
  "Pantry",
  "Frozen",
  "Other",
];
export const units: Unit[] = ["g", "kg", "ml", "l", "pcs"];
export function IconButton({
  label,
  onClick,
  children,
  className = "",
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`icon-button ${className}`}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
export function Dialog({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const heading = useId();
  const ref = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus({ preventScroll: true });
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close.current();
      }
      if (event.key !== "Tab") return;
      const items = Array.from(
        ref.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), select, textarea, summary, [tabindex="0"]',
        ) ?? [],
      ).filter(
        (e) => !e.closest("details:not([open])") || e.tagName === "SUMMARY",
      );
      const first = items[0],
        last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);
  return (
    <div className="modal-backdrop">
      <section
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={heading}
        className={`modal ${wide ? "wide" : ""}`}
      >
        <header className="modal-header">
          <h2 id={heading}>{title}</h2>
          <button
            type="button"
            ref={closeRef}
            className="icon-button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={22} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
export function Stepper({
  value,
  onChange,
  label = "Servings",
  min = 1,
  max = 100,
}: {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  min?: number;
  max?: number;
}) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <IconButton
        label={`Fewer ${label.toLowerCase()}`}
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
      >
        <Minus size={18} />
      </IconButton>
      <output aria-label={label}>{value}</output>
      <IconButton
        label={`More ${label.toLowerCase()}`}
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
      >
        <Plus size={18} />
      </IconButton>
    </div>
  );
}
export function RecipeArt({
  color = "sage",
  compact = false,
}: {
  color?: Recipe["color"];
  compact?: boolean;
}) {
  return (
    <div
      className={`recipe-art ${color} ${compact ? "compact" : ""}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 320 190" fill="none">
        <ellipse
          cx="165"
          cy="156"
          rx="87"
          ry="9"
          fill="#233d30"
          opacity=".09"
        />
        <circle cx="160" cy="96" r="72" fill="#fffdf7" />
        <circle cx="160" cy="96" r="59" stroke="#deded0" strokeWidth="1.5" />
        <path
          d="M122 111C111 86 127 57 153 58C170 65 168 95 151 112C144 121 132 121 122 111Z"
          fill="#6e925f"
        />
        <path
          d="M132 110L149 70M132 96L123 83M141 88L154 85"
          stroke="#dbe6c8"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M161 63C178 53 205 76 199 93C190 107 169 112 159 97C151 87 150 72 161 63Z"
          fill={
            color === "peach"
              ? "#e99a78"
              : color === "sand"
                ? "#c58359"
                : "#d5aa6a"
          }
        />
        <path
          d="M166 68L184 95M174 66L192 86"
          stroke="#fff0d9"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="171" cy="124" r="10" fill="#bb563e" />
        <circle cx="189" cy="112" r="9" fill="#c96b48" />
        <path
          d="M142 126C149 115 158 116 160 126C158 136 147 137 142 126Z"
          fill="#e5cb75"
        />
        <path
          d="M107 54L102 72M216 126L227 137M221 53L229 44"
          stroke="#fffdf7"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M64 59V129M54 55V73C54 84 74 84 74 73V55M64 55V79M253 55V129M253 55C238 69 242 90 253 90"
          stroke="#536b52"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
export function IngredientEditor({
  initial,
  onSave,
  onDelete,
  onClose,
  suggestions = [],
}: {
  initial?: Ingredient;
  onSave: (value: Ingredient) => void;
  onDelete?: () => void;
  onClose: () => void;
  suggestions?: Ingredient[];
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [term, setTerm] = useState(initial?.searchTerm ?? "");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [unit, setUnit] = useState<Unit>(initial?.unit ?? "g");
  const [category, setCategory] = useState(initial?.category ?? "Other");
  const [packSize, setPackSize] = useState(
    initial?.packSize != null ? String(initial.packSize) : "",
  );
  const [price, setPrice] = useState(
    initial?.packPrice != null ? String(initial.packPrice) : "",
  );
  const [availability, setAvailability] = useState(
    initial?.availability ?? "unchecked",
  );
  const [chosen, setChosen] = useState(!!initial);
  const [error, setError] = useState("");
  const builtIn = ingredients.map(([n, s, c, u]) => ({
    name: n,
    searchTerm: s,
    category: c,
    unit: u as Unit,
  }));
  const options = [...suggestions, ...builtIn]
    .filter(
      (item, index, all) =>
        all.findIndex(
          (i) => i.name.toLowerCase() === item.name.toLowerCase(),
        ) === index,
    )
    .filter((i) =>
      `${i.name} ${i.searchTerm}`.toLowerCase().includes(name.toLowerCase()),
    )
    .slice(0, 6);
  function submit(event: FormEvent) {
    event.preventDefault();
    const n = decimal(amount),
      size = packSize.trim() ? decimal(packSize) : null,
      p = price.trim() ? decimal(price) : null;
    if (!name.trim() || n === null || n <= 0) {
      setError("Enter an ingredient name and an amount greater than zero.");
      return;
    }
    if (
      (packSize.trim() && (size === null || size <= 0)) ||
      (price.trim() && p === null)
    ) {
      setError(
        "Check the pack size and price. Use a comma or dot for decimals.",
      );
      return;
    }
    if ((size === null) !== (p === null)) {
      setError("Enter both pack size and pack price, or leave both empty.");
      return;
    }
    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      name: name.trim(),
      searchTerm: term.trim() || name.trim(),
      amount: n,
      unit,
      category,
      packSize: size,
      packPrice: p,
      availability,
      checkedAt:
        availability === "unchecked"
          ? null
          : availability !== initial?.availability
            ? new Date().toISOString()
            : (initial?.checkedAt ?? new Date().toISOString()),
    });
  }
  return (
    <Dialog
      title={initial ? "Edit ingredient" : "Add ingredient"}
      onClose={onClose}
    >
      <form onSubmit={submit} className="modal-body">
        <label>
          Ingredient name
          <input
            value={name}
            maxLength={150}
            onChange={(e) => {
              setName(e.target.value);
              setTerm(e.target.value);
              setChosen(false);
            }}
            placeholder="Search in English or Swedish"
            autoComplete="off"
          />
        </label>
        {!chosen && options.length > 0 && (
          <div className="suggestions">
            {options.map((i) => (
              <button
                type="button"
                key={i.name}
                onClick={() => {
                  setName(i.name);
                  setTerm(i.searchTerm);
                  setCategory(i.category);
                  setUnit(i.unit);
                  setChosen(true);
                }}
              >
                <span>{i.name}</span>
                <small>{i.searchTerm}</small>
                <Plus size={16} />
              </button>
            ))}
          </div>
        )}
        <div className="form-row">
          <label>
            Amount
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="text"
              inputMode="decimal"
              placeholder="e.g. 300"
              maxLength={16}
            />
          </label>
          <label>
            Unit
            <select
              value={unit}
              onChange={(e) => {
                setUnit(e.target.value as Unit);
                if (e.target.value !== unit) {
                  setPackSize("");
                  setPrice("");
                }
              }}
            >
              {units.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Aisle
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <details
          className="price-details"
          open={initial?.packPrice != null ? true : undefined}
        >
          <summary>Pack price (optional)</summary>
          <div className="form-row">
            <label>
              Pack size ({unit})
              <input
                value={packSize}
                onChange={(e) => setPackSize(e.target.value)}
                type="text"
                inputMode="decimal"
                maxLength={16}
                placeholder={unit === "g" ? "e.g. 500" : "Pack quantity"}
              />
            </label>
            <label>
              Price per pack (kr)
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                type="text"
                inputMode="decimal"
                maxLength={16}
                placeholder="e.g. 29,90"
              />
            </label>
          </div>
        </details>
        <div className="store-field">
          <div className="section-row">
            <h3>Coop Bäckebol</h3>
            <a
              href={coopSearch(term || name)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-link"
            >
              Search Coop <ExternalLink size={15} />
            </a>
          </div>
          <label>
            Availability
            <select
              value={availability}
              onChange={(e) =>
                setAvailability(e.target.value as Ingredient["availability"])
              }
            >
              <option value="unchecked">Not checked</option>
              <option value="found">Found by me</option>
              <option value="substitute">Needs substitute</option>
            </select>
          </label>
          <p className="hint">
            Select Bäckebol on Coop. Availability and prices are your own
            checks, not live stock.
          </p>
          {initial?.checkedAt && (
            <small className="muted">
              Last checked{" "}
              {new Date(initial.checkedAt).toLocaleDateString("en-GB")}
            </small>
          )}
        </div>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <footer className="modal-actions">
          {onDelete && (
            <button type="button" className="danger-link" onClick={onDelete}>
              <Trash2 size={18} /> Remove
            </button>
          )}
          <button type="button" className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary">
            {initial ? "Save ingredient" : "Add to recipe"}
          </button>
        </footer>
      </form>
    </Dialog>
  );
}
export function RecipeForm({
  initial,
  onSave,
  onClose,
}: {
  initial?: Recipe;
  onSave: (value: {
    name: string;
    servings: number;
    minutes: number | null;
    color: Recipe["color"];
  }) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [servings, setServings] = useState(initial?.servings ?? 4);
  const [minutes, setMinutes] = useState(
    initial?.minutes ? String(initial.minutes) : "",
  );
  const [color, setColor] = useState<Recipe["color"]>(initial?.color ?? "sage");
  const [error, setError] = useState("");
  return (
    <Dialog title={initial ? "Recipe details" : "New recipe"} onClose={onClose}>
      <form
        className="modal-body"
        onSubmit={(e) => {
          e.preventDefault();
          const m = minutes.trim() ? decimal(minutes) : null;
          if (
            !name.trim() ||
            (minutes.trim() &&
              (m === null || !Number.isInteger(m) || m < 1 || m > 1440))
          ) {
            setError(
              "Enter a recipe name and a valid cooking time (1–1440 minutes).",
            );
            return;
          }
          onSave({ name: name.trim(), servings, minutes: m, color });
        }}
      >
        <label>
          Recipe name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="What are you making?"
            maxLength={150}
          />
        </label>
        <div className="form-row">
          <div>
            <span className="field-label">Servings</span>
            <Stepper value={servings} onChange={setServings} />
          </div>
          <label>
            Cooking time (min)
            <input
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              type="text"
              inputMode="numeric"
              maxLength={4}
              placeholder="Optional"
            />
          </label>
        </div>
        <fieldset className="color-picker">
          <legend>Recipe colour</legend>
          {(["sage", "peach", "sand", "lavender"] as const).map((c) => (
            <button
              type="button"
              key={c}
              aria-label={c}
              aria-pressed={color === c}
              className={c}
              onClick={() => setColor(c)}
            >
              {color === c && <Check size={20} />}
            </button>
          ))}
        </fieldset>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <footer className="modal-actions">
          <button type="button" className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="primary" type="submit">
            {initial ? "Save details" : "Create recipe"}
          </button>
        </footer>
      </form>
    </Dialog>
  );
}
export function MealForm({
  recipes,
  week,
  recipeId,
  date,
  initial,
  onSave,
  onDelete,
  onClose,
}: {
  recipes: Recipe[];
  week: string;
  recipeId?: string;
  date?: string;
  initial?: PlannedMeal;
  onSave: (meal: PlannedMeal) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const first =
    recipes.find((r) => r.id === (initial?.recipeId ?? recipeId)) ?? recipes[0];
  const [selected, setSelected] = useState(first?.id ?? "");
  const [day, setDay] = useState(
    initial?.date ??
      date ??
      (dateISO() >= week && dateISO() < addDays(week, 7) ? dateISO() : week),
  );
  const [servings, setServings] = useState(
    initial?.servings ?? first?.servings ?? 1,
  );
  const [slot, setSlot] = useState<PlannedMeal["slot"]>(
    initial?.slot ?? "Dinner",
  );
  const [error, setError] = useState("");
  return (
    <Dialog title={initial ? "Planned meal" : "Add to week"} onClose={onClose}>
      <form
        className="modal-body"
        onSubmit={(e) => {
          e.preventDefault();
          if (!selected || !/^\d{4}-\d{2}-\d{2}$/.test(day)) {
            setError("Choose a recipe and date.");
            return;
          }
          onSave({
            id: initial?.id ?? crypto.randomUUID(),
            recipeId: selected,
            date: day,
            servings,
            slot,
          });
        }}
      >
        <label>
          Recipe
          <select
            value={selected}
            onChange={(e) => {
              setSelected(e.target.value);
              setServings(
                recipes.find((r) => r.id === e.target.value)?.servings ?? 1,
              );
            }}
          >
            {recipes.map((r) => (
              <option value={r.id} key={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <div className="form-row">
          <label>
            Date
            <input
              type="date"
              value={day}
              onChange={(e) => setDay(e.target.value)}
            />
          </label>
          <label>
            Meal
            <select
              value={slot}
              onChange={(e) => setSlot(e.target.value as PlannedMeal["slot"])}
            >
              <option>Lunch</option>
              <option>Dinner</option>
            </select>
          </label>
        </div>
        <div className="section-row">
          <span className="field-label">Servings to cook</span>
          <Stepper value={servings} onChange={setServings} />
        </div>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <footer className="modal-actions">
          {onDelete && (
            <button type="button" className="danger-link" onClick={onDelete}>
              Remove meal
            </button>
          )}
          <button type="button" className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary">
            {initial ? "Save meal" : "Add to week"}
          </button>
        </footer>
      </form>
    </Dialog>
  );
}
export function ExtraForm({
  onSave,
  onClose,
}: {
  onSave: (name: string, amount: number, unit: Unit, category: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(""),
    [amount, setAmount] = useState("1"),
    [unit, setUnit] = useState<Unit>("pcs"),
    [category, setCategory] = useState("Other"),
    [error, setError] = useState("");
  return (
    <Dialog title="Add shopping item" onClose={onClose}>
      <form
        className="modal-body"
        onSubmit={(e) => {
          e.preventDefault();
          const n = decimal(amount);
          if (!name.trim() || n === null || n <= 0) {
            setError("Enter a name and an amount greater than zero.");
            return;
          }
          onSave(name.trim(), n, unit, category);
        }}
      >
        <label>
          Item name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={150}
            placeholder="Anything else you need"
          />
        </label>
        <div className="form-row">
          <label>
            Amount
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              maxLength={16}
            />
          </label>
          <label>
            Unit
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as Unit)}
            >
              {units.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Aisle
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <footer className="modal-actions">
          <button type="button" className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary">
            Add item
          </button>
        </footer>
      </form>
    </Dialog>
  );
}
export function downloadText(
  text: string,
  name: string,
  type = "application/json",
) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
export function Settings({
  data,
  onRestore,
  onClose,
}: {
  data: AppData;
  onRestore: (data: AppData) => Promise<void>;
  onClose: () => void;
}) {
  const [pending, setPending] = useState<AppData | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <Dialog title="Settings & backup" onClose={onClose}>
      <div className="modal-body settings-body">
        <section>
          <h3>Your recipes stay on this device</h3>
          <p className="muted">
            No account or automatic sync. Export a backup to move recipes to
            another device or protect them before clearing Safari data.
          </p>
          <button
            className="secondary full-width"
            onClick={() =>
              downloadText(
                makeBackup(data),
                `This-Weeks-Recipe-${dateISO()}.json`,
              )
            }
          >
            <Download size={19} /> Export backup
          </button>
          <label className="file-button secondary">
            <Upload size={19} /> Import backup
            <input
              type="file"
              accept=".json,application/json"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                setError("");
                setPending(null);
                if (file.size > 20000000) {
                  setError(
                    "This file is too large. Choose an app backup under 20 MB.",
                  );
                  return;
                }
                try {
                  setPending(parseBackup(await file.text()));
                } catch (err) {
                  setError((err as Error).message);
                }
              }}
            />
          </label>
          {pending && (
            <div className="import-confirm">
              <p>
                This backup contains {pending.recipes.length} recipes and{" "}
                {pending.meals.length} planned meals. Importing{" "}
                <strong>replaces</strong> the recipes and plans on this device.
              </p>
              <div className="button-row">
                <button className="secondary" onClick={() => setPending(null)}>
                  Cancel import
                </button>
                <button
                  className="primary"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await onRestore(pending);
                      onClose();
                    } catch {
                      setError(
                        "Could not save the backup. Your current recipes have not been replaced.",
                      );
                      setBusy(false);
                    }
                  }}
                >
                  Replace & import
                </button>
              </div>
            </div>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
        </section>
        <section>
          <h3>Add to your iPad Home Screen</h3>
          <p className="muted">
            Open this link in Safari. Tap Share → Add to Home Screen, then
            enable “Open as Web App” if shown. Open the Home Screen app online
            once to cache it.
          </p>
        </section>
        <section>
          <h3>Coop Bäckebol</h3>
          <p className="muted">
            Coop searches open on Coop’s website. Select Bäckebol there; the
            default area may be different. Stock checks and pack prices in this
            app are entered by you, not a live Coop feed.
          </p>
          <a
            className="text-link"
            href="https://www.coop.se/butiker-erbjudanden/stora-coop/stora-coop-backebol/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open store page <ExternalLink size={16} />
          </a>
        </section>
        <p className="version">This-Weeks-Recipe · v1.0.0</p>
      </div>
    </Dialog>
  );
}
export function Status({ value }: { value: Ingredient["availability"] }) {
  return (
    <span className={`stock-status ${value}`}>
      {value === "found" ? (
        <>
          <Check size={14} /> Found by me
        </>
      ) : value === "substitute" ? (
        "Needs substitute"
      ) : (
        "Not checked"
      )}
    </span>
  );
}
export function displayAmount(amount: number, unit: Unit): string {
  if (unit === "g" && amount >= 1000) return `${quantity(amount / 1000)} kg`;
  if (unit === "ml" && amount >= 1000) return `${quantity(amount / 1000)} l`;
  return `${quantity(amount)} ${unit}`;
}
