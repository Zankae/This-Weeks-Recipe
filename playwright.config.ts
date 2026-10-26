import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 35000,
  use: {
    baseURL: process.env.APP_URL ?? "http://127.0.0.1:4178/This-Weeks-Recipe/",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium-tablet",
      use: {
        browserName: "chromium",
        viewport: { width: 820, height: 1180 },
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: true,
        launchOptions: {
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
          args: ["--disable-gpu"],
        },
      },
    },
    {
      name: "webkit-tablet",
      use: {
        browserName: "webkit",
        viewport: { width: 820, height: 1180 },
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
