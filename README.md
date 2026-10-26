# This-Weeks-Recipe

An iPad-first recipe book, weekly meal planner and shopping list.

**App:** https://zankae.github.io/This-Weeks-Recipe/

## What works

- Create recipes one ingredient at a time. Search the built-in ingredient-name suggestions in English or Swedish, or enter your own ingredient. These are name suggestions, not a nutritional database or Coop catalogue.
- Optional starter recipes: lemon chicken and rice, salmon tray bake, red lentil bolognese. These are editable examples, with no invented prices or stock confirmations.
- Change servings to scale ingredient quantities. Save cooking instructions and tick off steps while cooking.
- Plan lunch or dinner on any date. Set the servings to cook for each meal; browse earlier and later weeks and repeat the previous week's meals.
- Combine ingredients across meals into an aisle-grouped shopping list. Grams/kilograms and millilitres/litres are combined correctly; pieces remain separate.
- Tick an item as bought or already in the cupboard. Changed quantities invalidate stale ticks.
- Enter package sizes and prices in SEK, including Swedish decimal commas. Recipe cost uses the fraction of each package consumed; shopping cost rounds up to whole packages. Missing or conflicting prices remain unknown rather than becoming zero.
- Open ingredient searches on Coop and record your own availability checks.
- Export and restore validated JSON backups in Settings & backup. Import requires explicit confirmation before replacing local recipes and plans.
- Nutrients displays **Work In Progress**, as requested. NCCDB and nutrient calculations are intentionally not integrated.

## Coop: important limitations

This app does **not** have a live stock or pricing feed for Stora Coop Bäckebol. Coop's public search may default to a different delivery area. Select Bäckebol on Coop itself before checking products and prices.

“Found by me” is a user's recorded observation, not a current-stock guarantee. No ingredient is automatically marked available. Prices are manually entered estimates; offers, membership pricing, variable-weight produce and checkout prices can differ. An ingredient without a price is not included in a “known-price subtotal.” Shopping extras have no package pricing and are identified as unpriced.

The store page is https://www.coop.se/butiker-erbjudanden/stora-coop/stora-coop-backebol/ . Ingredient searches use Coop's public `/handla/sok/?q=…` page.

## Install on iPad

1. Open the app link in **Safari**.
2. Tap **Share → Add to Home Screen**.
3. Enable **Open as Web App** if offered, then tap **Add**.
4. Open the new Home Screen app while connected to the internet, allowing it to finish loading and cache its files.

Recipes, plans and shopping lists are stored in IndexedDB on that device. After the app has cached successfully, it can reopen offline. Coop searches still require internet. Home Screen app storage can be separate from the Safari tab: install first, then enter your real recipes in the installed app, or use backup export/import to transfer them.

There is no account, server database, analytics or automatic cross-device sync. Export backups regularly and before deleting the app or clearing Safari's website data. Browser storage is not a substitute for a backup.

Updates display a small “New version ready” prompt and do not force a reload while you are editing.

## Development

React + TypeScript + Vite, Dexie, Zod, vite-plugin-pwa, local DM Sans fonts and Lucide icons.

```sh
npm ci
npm run dev
npm test
npm run build
```

GitHub Actions builds and deploys `main` to GitHub Pages, using the repository name to derive the base path. No secrets or API keys are shipped in the app.

To exercise the Pages path locally, set `GITHUB_ACTIONS=true` and `GITHUB_REPOSITORY=Zankae/This-Weeks-Recipe` for **both** build and preview:

```sh
GITHUB_ACTIONS=true GITHUB_REPOSITORY=Zankae/This-Weeks-Recipe npm run build
GITHUB_ACTIONS=true GITHUB_REPOSITORY=Zankae/This-Weeks-Recipe npm run preview -- --port 4178
```

Headless browser checks (never open a visible browser window):

```sh
npx playwright install chromium webkit
npm run test:ui
```

The browser tests expect the production preview at `http://127.0.0.1:4178/This-Weeks-Recipe/`. Set `APP_URL` to test another deployment. If using an existing Chromium installation, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to its executable path. Browser checks use one worker and cover iPad-sized portrait/landscape, compact layouts, focus restoration without opening the keyboard, costs, shopping, persistence, export and offline reload. Emulation is not certification on a physical iPad.
