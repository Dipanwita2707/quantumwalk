import { expect, test } from "@playwright/test";

test("document handoffs preserve content, require import, and recover the previous draft", async ({ page }) => {
  await page.addInitScript(() => { if (!localStorage.getItem("qw-hub-doc-editor")) localStorage.setItem("qw-hub-doc-editor", "# Original editor draft\n\nKeep this work."); });
  await page.goto("/hub/document-pro");
  await expect(page.getByRole("textbox", { name: "title", exact: true })).toBeEnabled();
  await page.getByRole("textbox", { name: "title", exact: true }).fill("Research memo");
  await page.getByRole("textbox", { name: "summary", exact: true }).fill("A prepared Bell pair is a joint quantum state.");
  await page.locator(".hub-send-actions").getByRole("button", { name: /Doc Editor/ }).click();
  await expect(page).toHaveURL(/\/hub\/doc-editor\?transfer=/);
  const source = page.getByRole("textbox", { name: "Markdown source" });
  await expect(source).toHaveValue("# Original editor draft\n\nKeep this work.");
  await expect(page.getByRole("region", { name: "Incoming document" })).toContainText("Research memo");
  await page.getByRole("button", { name: "Open incoming copy", exact: true }).click();
  await expect(source).toHaveValue(/# Research memo/);
  await expect(source).toHaveValue(/A prepared Bell pair/);
  await expect(page).toHaveURL(/\/hub\/doc-editor$/);
  await page.reload();
  await expect(source).toHaveValue(/# Research memo/);
  await page.getByRole("button", { name: "Restore previous draft", exact: true }).click();
  await expect(source).toHaveValue("# Original editor draft\n\nKeep this work.");

  const document = '# New findings\n\n<script>window.unwantedExecution = true</script>\n\n**Evidence**, preserved as Markdown.';
  await source.fill(document);
  await page.locator(".hub-send-actions").getByRole("button", { name: /Document Pro/ }).click();
  await expect(page.locator(".qw-doc-pro-render")).toContainText("Research memo");
  await page.getByRole("button", { name: "Keep current draft", exact: true }).click();
  await expect(page.locator(".qw-doc-pro-render")).toContainText("Research memo");
  await page.getByRole("navigation", { name: "Document workspace" }).getByRole("link", { name: "Doc Editor", exact: true }).click();
  await expect(source).toHaveValue(document);
  await page.locator(".hub-send-actions").getByRole("button", { name: /Document Pro/ }).click();
  await page.getByRole("button", { name: "Open incoming copy", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Document content" })).toHaveValue(document);
  await expect(page.locator(".qw-doc-pro-render script")).toHaveCount(0);
  expect(await page.evaluate(() => (window as Window & { unwantedExecution?: boolean }).unwantedExecution)).toBeUndefined();
  await page.reload();
  await expect(page.getByRole("combobox", { name: "Template", exact: true })).toHaveValue("imported");
  await expect(page.getByRole("textbox", { name: "Document content" })).toHaveValue(document);
  await page.getByRole("button", { name: "Restore previous draft", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "title", exact: true })).toHaveValue("Research memo");
});

test("ML design persists through navigation and sends a faithful report", async ({ page }, testInfo) => {
  await page.goto("/hub/ml-studio");
  const features = page.getByRole("spinbutton", { name: "Input features" });
  await expect(features).toBeEnabled();
  await features.fill("12");
  await page.getByRole("spinbutton", { name: "Units", exact: true }).first().fill("5");
  await page.getByRole("combobox", { name: "Layer 2 type", exact: true }).selectOption("softmax");
  await expect(page.getByLabel("Network diagram")).toContainText("Softmax → (5)");
  await page.getByRole("button", { name: "Add layer", exact: true }).click();
  await expect(page.locator(".qw-ml-layers li")).toHaveCount(5);
  await page.locator(".hub-send-actions").getByRole("button", { name: /Doc Editor/ }).click();
  await page.getByRole("button", { name: "Open incoming copy", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Markdown source" })).toHaveValue(/Input features: 12/);
  await expect(page.getByRole("textbox", { name: "Markdown source" })).toHaveValue(/Softmax → \(5\)/);
  await page.getByRole("navigation", { name: "Document workspace" }).getByRole("link", { name: "ML Studio", exact: true }).click();
  await expect(features).toHaveValue("12");
  await expect(page.locator(".qw-ml-layers li")).toHaveCount(5);
  await page.reload();
  await expect(features).toHaveValue("12");
  await page.getByRole("button", { name: "Remove layer 5", exact: true }).click();
  await expect(page.locator(".qw-ml-layers li")).toHaveCount(4);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export design", exact: true }).click();
  expect((await downloadPromise).suggestedFilename()).toBe("network-design.json");
  await page.locator(".hub-tool-main").screenshot({ path: testInfo.outputPath("connected-ml-studio.png") });
});

test("Hub filters and recent tools survive a tool visit", async ({ page }) => {
  await page.goto("/hub");
  const categories = page.getByRole("group", { name: "Tool categories" });
  await expect(categories.getByRole("button", { name: "Research", exact: true })).toBeEnabled();
  await categories.getByRole("button", { name: "Research", exact: true }).click();
  await page.getByRole("searchbox", { name: "Search tools" }).fill("ML");
  await page.locator(".qw-hub-catalog").getByRole("link", { name: "ML Studio", exact: true }).click();
  await expect(page).toHaveURL(/\/hub\/ml-studio$/);
  await page.getByRole("navigation", { name: "Tools directory" }).getByRole("link", { name: "All tools", exact: true }).click();
  await expect(page.getByRole("searchbox", { name: "Search tools" })).toHaveValue("ML");
  await expect(categories.getByRole("button", { name: "Research", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".qw-hub-jump")).toContainText("ML Studio");
  await page.getByRole("searchbox", { name: "Search tools" }).fill("no matching tool");
  await page.getByRole("button", { name: "Reset filters", exact: true }).click();
  await expect(page.getByRole("searchbox", { name: "Search tools" })).toHaveValue("");
  await expect(categories.getByRole("button", { name: "All", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("blocked transfer storage keeps the source draft and route", async ({ page }) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) { if (key === "qw-hub-transfers-v1") throw Error("blocked"); original.call(this, key, value); };
  });
  await page.goto("/hub/doc-editor");
  const source = page.getByRole("textbox", { name: "Markdown source" });
  await expect(source).toBeEnabled();
  await source.fill("# Keep this source");
  await page.locator(".hub-send-actions").getByRole("button", { name: /Document Pro/ }).click();
  await expect(page.locator(".hub-send-actions").getByRole("alert")).toContainText("Could not send this copy");
  await expect(source).toHaveValue("# Keep this source");
  await expect(page).toHaveURL(/\/hub\/doc-editor$/);
});

test("a missing transfer never replaces an existing document", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("qw-hub-doc-editor", "# Existing work"));
  await page.goto("/hub/doc-editor?transfer=missing-copy");
  await expect(page.locator(".hub-transfer-error")).toContainText("no longer available");
  await expect(page.getByRole("textbox", { name: "Markdown source" })).toHaveValue("# Existing work");
});

test("an import cannot replace a draft when its backup cannot be saved", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("qw-hub-doc-editor", "# Irreplaceable draft");
    localStorage.setItem("qw-hub-transfers-v1", JSON.stringify([{ version: 1, id: "backup-check", source: "document-pro", title: "Incoming", body: "# Incoming copy", createdAt: Date.now() }]));
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) { if (key.endsWith(":previous")) throw Error("quota"); original.call(this, key, value); };
  });
  await page.goto("/hub/doc-editor?transfer=backup-check");
  await expect(page.getByRole("textbox", { name: "Markdown source" })).toBeEnabled();
  await page.getByRole("button", { name: "Open incoming copy", exact: true }).click();
  await expect(page.locator(".hub-transfer-error")).toContainText("could not save a backup");
  await expect(page.getByRole("textbox", { name: "Markdown source" })).toHaveValue("# Irreplaceable draft");
  expect(await page.evaluate(() => localStorage.getItem("qw-hub-doc-editor"))).toBe("# Irreplaceable draft");
});

test("all Hub pages fit mobile and share the tool workspace navigation", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/hub", "/hub/doc-editor", "/hub/document-pro", "/hub/ml-studio"]) {
    await page.goto(path);
    await expect(page.getByRole("navigation", { name: "Tools directory" })).toBeVisible();
    if (path !== "/hub") await expect(page.getByRole("navigation", { name: "Document workspace" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`${path.split("/").pop()}-mobile.png`), fullPage: true });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/hub");
  await expect(page.getByRole("searchbox", { name: "Search tools" })).toBeEnabled();
  await page.screenshot({ path: testInfo.outputPath("hub-desktop.png"), fullPage: true });
});
