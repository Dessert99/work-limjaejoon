import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

const routes = [
  { path: "/", file: "out/index.html", title: "환경 확인", heading: "Next.js + Emotion 환경 확인" },
  { path: "/style-check/", file: "out/style-check/index.html", title: "페이지 이동 확인 | 스타일 검증", heading: "페이지 이동 후 스타일 확인" },
];

test("정적 HTML에 본문, 메타데이터, Emotion 스타일이 포함된다", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  for (const route of routes) {
    const html = await readFile(route.file, "utf8");
    expect(html).toContain(route.heading);
    expect(html).toContain(`<title>${route.title}</title>`);
    expect(html).toMatch(/<meta name="description" content="[^"]+"/);
    expect(html).toMatch(/<style data-emotion="web [^"]+">[^<]+<\/style>/);
    expect(html.indexOf('<style data-emotion="web ')).toBeLessThan(html.indexOf("<main"));

    await page.goto(route.path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(route.heading);
    await expect(page.locator("main")).toHaveCSS("background-color", "rgb(238, 242, 255)");
    await expect(page.getByRole("button")).toHaveCSS("background-color", "rgb(67, 56, 202)");
  }
  await context.close();
});

test("스타일 변경, 클라이언트 이동, 새로고침에 hydration 오류가 없다", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await page.getByRole("button").click();
  await expect(page.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  await page.mouse.move(0, 0);
  await expect(page.getByRole("button")).toHaveCSS("background-color", "rgb(22, 101, 52)");
  await page.getByRole("button").click();
  await expect(page.getByRole("button")).toHaveAttribute("aria-pressed", "false");

  await page.evaluate(() => { document.documentElement.dataset.navigationCheck = "유지"; });
  await page.getByRole("link", { name: "페이지 이동 확인" }).click();
  await expect(page).toHaveURL("/style-check/");
  await expect(page).toHaveTitle(routes[1].title);
  await expect(page.locator("html")).toHaveAttribute("data-navigation-check", "유지");
  await expect(page.locator("main")).toHaveCSS("border-top-width", "2px");
  await expect(page.locator("main")).toHaveCSS("background-color", "rgb(238, 242, 255)");

  await page.reload();
  await expect(page.locator("main")).toHaveCSS("border-top-width", "2px");
  await page.getByRole("button").click();
  await expect(page.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("link", { name: "처음으로 돌아가기" }).click();
  await expect(page).toHaveTitle(routes[0].title);
  await expect(page.locator("main")).toHaveCSS("background-color", "rgb(238, 242, 255)");
  await expect(page.getByRole("button")).toHaveAttribute("aria-pressed", "false");
  await page.reload();
  await expect(page.locator("main")).toHaveCSS("background-color", "rgb(238, 242, 255)");
  expect(errors).toEqual([]);
});
