import { expect, test, type Page } from "@playwright/test";

const route = "/tools/image-converter/";

async function imageFile(page: Page, name = "투명 샘플.png") {
  const base64 = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 24;
    return canvas.toDataURL("image/png").split(",")[1];
  });
  return { name, mimeType: "image/png", buffer: Buffer.from(base64, "base64") };
}

test("JPEG 변환 시 투명 영역을 서비스 정책에 따라 흰색으로 채운다", async ({ page }) => {
  await page.goto(route);
  await page.getByLabel("이미지 선택 또는 여기에 끌어 놓기").setInputFiles(await imageFile(page));
  await page.getByLabel("출력 형식").selectOption("image/jpeg");
  await page.getByRole("button", { name: "이미지 변환", exact: true }).click();
  const preview = page.getByAltText("변환된 이미지 미리보기");
  await expect(preview).toBeVisible();
  const pixel = await preview.evaluate(async (element) => {
    const image = element as HTMLImageElement;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext("2d")!;
    context.drawImage(image, 0, 0);
    return Array.from(context.getImageData(0, 0, 1, 1).data);
  });
  expect(pixel).toEqual([255, 255, 255, 255]);
});

test("잘못된 파일과 손상 파일을 안내하고 정상 파일로 다시 변환할 수 있다", async ({ page }) => {
  await page.goto(route);
  const input = page.getByLabel("이미지 선택 또는 여기에 끌어 놓기");
  const button = page.getByRole("button", { name: "이미지 변환", exact: true });
  await expect(button).toBeDisabled();
  await input.setInputFiles({ name: "문서.txt", mimeType: "text/plain", buffer: Buffer.from("문서") });
  await expect(page.getByRole("main").getByRole("alert")).toContainText("PNG, JPEG, WebP");
  await expect(button).toBeDisabled();
  await input.setInputFiles({ name: "빈파일.png", mimeType: "image/png", buffer: Buffer.alloc(0) });
  await expect(page.getByRole("main").getByRole("alert")).toContainText("비어 있는 파일");
  await input.setInputFiles({ name: "대용량.png", mimeType: "image/png", buffer: Buffer.alloc(20 * 1024 * 1024 + 1) });
  await expect(page.getByRole("main").getByRole("alert")).toContainText("20 MiB 이하");
  await input.setInputFiles({ name: "손상.png", mimeType: "image/png", buffer: Buffer.from("손상된 이미지") });
  await button.click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("이미지를 읽을 수 없습니다");
  await input.setInputFiles(await imageFile(page));
  await button.click();
  await expect(page.getByRole("status")).toHaveText("변환이 완료되었습니다.");
  await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
});

test("요청과 다른 출력 형식 및 서비스 해상도 제한 초과를 거절한다", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.toBlob;
    // 미지원 형식이 PNG로 대체되는 브라우저를 재현한다.
    HTMLCanvasElement.prototype.toBlob = function (callback) { original.call(this, callback, "image/png"); };
  });
  await page.goto(route);
  const input = page.getByLabel("이미지 선택 또는 여기에 끌어 놓기");
  await input.setInputFiles(await imageFile(page));
  await page.getByRole("button", { name: "이미지 변환", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("선택한 출력 형식을 지원하지 않습니다");
  await expect(page.getByRole("link", { name: "변환 이미지 다운로드" })).toHaveCount(0);
  await page.getByLabel("출력 형식").selectOption("image/png");
  const oversized = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 8193;
    canvas.height = 1;
    return canvas.toDataURL("image/png").split(",")[1];
  });
  await input.setInputFiles({ name: "긴이미지.png", mimeType: "image/png", buffer: Buffer.from(oversized, "base64") });
  await page.getByRole("button", { name: "이미지 변환", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("8,192px 이하");
  await input.setInputFiles(await imageFile(page));
  await page.getByRole("button", { name: "이미지 변환", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("변환이 완료되었습니다.");
});

test("새 파일의 결과를 늦게 끝난 이전 변환이 덮어쓰지 않는다", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.toBlob;
    let calls = 0;
    HTMLCanvasElement.prototype.toBlob = function (callback, type, quality) {
      // 첫 작업만 보류해 새 파일의 변환이 먼저 끝나는 순서를 보장한다.
      if (calls++ !== 0) return original.call(this, callback, type, quality);
      original.call(this, (blob) => {
        document.documentElement.dataset.firstConversion = "대기";
        window.addEventListener("release-first-conversion", () => {
          callback(blob);
          setTimeout(() => { document.documentElement.dataset.firstConversion = "완료"; }, 0);
        }, { once: true });
      }, type, quality);
    };
  });
  await page.goto(route);
  const input = page.getByLabel("이미지 선택 또는 여기에 끌어 놓기");
  await page.getByLabel("출력 형식").selectOption("image/png");
  await input.setInputFiles(await imageFile(page, "이전.png"));
  await page.getByRole("button", { name: "이미지 변환", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-first-conversion", "대기");
  await input.setInputFiles(await imageFile(page, "새파일.png"));
  await page.getByRole("button", { name: "이미지 변환", exact: true }).click();
  await expect(page.getByRole("link", { name: "변환 이미지 다운로드" })).toHaveAttribute("download", "새파일.png");
  await page.evaluate(() => window.dispatchEvent(new Event("release-first-conversion")));
  await expect(page.locator("html")).toHaveAttribute("data-first-conversion", "완료");
  await expect(page.getByRole("link", { name: "변환 이미지 다운로드" })).toHaveAttribute("download", "새파일.png");
});

test("한 번에 여러 파일을 선택하면 변환을 허용하지 않는다", async ({ page }) => {
  await page.goto(route);
  const file = await imageFile(page);
  const transfer = await page.evaluateHandle((bytes) => {
    const transfer = new DataTransfer();
    transfer.items.add(new File([new Uint8Array(bytes)], "첫번째.png", { type: "image/png" }));
    transfer.items.add(new File([new Uint8Array(bytes)], "두번째.png", { type: "image/png" }));
    return transfer;
  }, Array.from(file.buffer));
  const dropzone = page.getByLabel("이미지 선택 또는 여기에 끌어 놓기").locator("..");
  await dropzone.dispatchEvent("drop", { dataTransfer: transfer });
  await expect(page.getByRole("main").getByRole("alert")).toContainText("한 번에 한 장씩");
  await expect(page.getByRole("button", { name: "이미지 변환", exact: true })).toBeDisabled();
  await transfer.dispose();
});

test("인코딩 실패 시 오류를 표시하고 다운로드 결과를 노출하지 않는다", async ({ page }) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.toBlob = function (callback) { callback(null); };
  });
  await page.goto(route);
  await page.getByLabel("이미지 선택 또는 여기에 끌어 놓기").setInputFiles(await imageFile(page));
  await page.getByRole("button", { name: "이미지 변환", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("변환 결과를 만들지 못했습니다");
  await expect(page.getByRole("link", { name: "변환 이미지 다운로드" })).toHaveCount(0);
});
