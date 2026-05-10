import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Login|TSplineForge/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('should show validation error for invalid email', async ({ page }) => {
    await page.goto('/');
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('invalid-email');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('[role="alert"]')).toBeVisible();
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[type="email"]').fill('test@example.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();
    await page.waitForNavigation();
    await expect(page).toHaveURL(/dashboard/);
  });
});

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('should display user projects', async ({ page }) => {
    await expect(page.locator('[data-testid="projects-list"]')).toBeVisible();
  });

  test('should allow creating new project', async ({ page }) => {
    await page.locator('button:has-text("New Project")').click();
    await page.locator('input[placeholder="Project name"]').fill('Test Project');
    await page.locator('button:has-text("Create")').click();
    await expect(page.locator('text=Test Project')).toBeVisible();
  });
});

test.describe('Editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/editor');
  });

  test('should load 3D viewport', async ({ page }) => {
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('should have viewport controls', async ({ page }) => {
    await expect(page.locator('button:has-text("Front")')).toBeVisible();
    await expect(page.locator('button:has-text("Top")')).toBeVisible();
    await expect(page.locator('button:has-text("Isometric")')).toBeVisible();
  });

  test('should switch camera presets', async ({ page }) => {
    const frontBtn = page.locator('button:has-text("Front")');
    await frontBtn.click();
    await expect(frontBtn).toHaveClass(/bg-primary/);
  });
});
