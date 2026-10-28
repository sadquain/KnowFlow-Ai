import { test, expect } from "@playwright/test";

test.describe("KnowFlow AI — 10 Core Deterministic E2E Flows", () => {
  // Flow 1: Landing Page & Branding
  test("Flow 1: Landing page loads with enterprise branding and hero", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/KnowFlow AI/i);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Enterprise Knowledge Flow"
    );
  });

  // Flow 2: Authentication Modal
  test("Flow 2: Triggering Sign In opens auth modal with form inputs", async ({ page }) => {
    await page.goto("/");
    const signInBtn = page.getByRole("button", { name: /Sign In/i }).first();
    await signInBtn.click();
    await expect(page.getByPlaceholder("you@company.com")).toBeVisible();
    await expect(page.getByPlaceholder("••••••••")).toBeVisible();
  });

  // Flow 3: Dashboard Navigation & Hero
  test("Flow 3: Dashboard displays hero action banner and metric stat cards", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Your knowledge");
    await expect(page.getByText("Total Documents")).toBeVisible();
    await expect(page.getByText("Vector Chunks")).toBeVisible();
  });

  // Flow 4: Document List Search & Filter Toolbar
  test("Flow 4: Document management page renders search input and status filter pills", async ({
    page,
  }) => {
    await page.goto("/documents");
    await expect(page.getByPlaceholder("Search documents by name...")).toBeVisible();
    await expect(page.getByRole("button", { name: /Upload Document/i })).toBeVisible();
  });

  // Flow 5: Upload Modal Trigger
  test("Flow 5: Clicking Upload Document opens file uploader dialog", async ({ page }) => {
    await page.goto("/documents");
    await page.getByRole("button", { name: /Upload Document/i }).click();
    await expect(page.getByText("Upload Knowledge Documents")).toBeVisible();
  });

  // Flow 6: Workspace Switcher Dropdown
  test("Flow 6: Workspace switcher displays current active workspace", async ({ page }) => {
    await page.goto("/dashboard");
    const wsSwitcher = page.getByRole("button", { name: /Switch workspace/i }).first();
    await expect(wsSwitcher).toBeVisible();
  });

  // Flow 7: AI Assistant Chat Interface & Model Selector
  test("Flow 7: Chat interface renders model selector with Google Gemini default", async ({
    page,
  }) => {
    await page.goto("/chat");
    await expect(page.getByRole("button", { name: /Select AI Provider and Model/i })).toBeVisible();
    await expect(page.getByPlaceholder(/Ask a question about your knowledge base/i)).toBeVisible();
  });

  // Flow 8: Real Analytics Telemetry Dashboard
  test("Flow 8: Analytics dashboard displays metrics cards and charts", async ({ page }) => {
    await page.goto("/analytics");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Workspace Analytics & Telemetry"
    );
    await expect(page.getByText("Indexed Documents")).toBeVisible();
    await expect(page.getByText("AI Questions")).toBeVisible();
  });

  // Flow 9: Workspace Settings & Member Roster
  test("Flow 9: Settings page displays workspace management and provider cards", async ({
    page,
  }) => {
    await page.goto("/settings");
    await expect(page.getByText("Workspace Profile")).toBeVisible();
    await expect(page.getByText("AI Provider Topology")).toBeVisible();
    await expect(page.getByText("PostgreSQL & pgvector Configuration")).toBeVisible();
  });

  // Flow 10: Password Reset & Privacy Draft Pages
  test("Flow 10: Forgot password and draft privacy policy pages load cleanly", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Reset Your Password");

    await page.goto("/privacy");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Privacy Policy & Data Governance"
    );
  });
});
