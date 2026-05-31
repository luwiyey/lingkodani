import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import dotenv from "dotenv";
import { chromium } from "@playwright/test";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  query,
  setDoc,
  where,
} from "firebase/firestore";

dotenv.config({ path: ".env.local" });

const baseUrl = process.env.LIVE_QA_URL ?? "https://lingkod-ani.com";
const email = process.env.LIVE_QA_EMAIL;
const password = process.env.LIVE_QA_PASSWORD;

if (!email || !password) {
  throw new Error("Missing LIVE_QA_EMAIL or LIVE_QA_PASSWORD environment variables.");
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig, `live-ui-smoke-${Date.now()}`);
const auth = getAuth(app);
const db = getFirestore(app);

const stamp = Date.now();
const farmerName = `QA Farmer ${stamp}`;
const farmerPhone = `+63999${String(stamp).slice(-7)}`;
const inventoryName = `QA Resource ${stamp}`;
const inventoryUpdatedName = `QA Resource Updated ${stamp}`;
const priceCrop = `QA Crop ${stamp}`;
const priceCropUpdated = `QA Crop Updated ${stamp}`;
const voucherResourceId = `QA-RESOURCE-VOUCHER-${stamp}`;
const voucherResourceName = `QA Voucher Resource ${stamp}`;
const voucherCode = `QA-${String(stamp).slice(-8)}`;
const tempPng = path.join(os.tmpdir(), `qa-avatar-${stamp}.png`);

fs.writeFileSync(
  tempPng,
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7Z0X8AAAAASUVORK5CYII=",
    "base64"
  )
);

async function deleteMatchingDocs(collectionName, field, value) {
  const snaps = await getDocs(query(collection(db, collectionName), where(field, "==", value)));
  for (const snap of snaps.docs) {
    try {
      await deleteDoc(doc(db, collectionName, snap.id));
    } catch {
      // Best-effort cleanup only.
    }
  }
}

async function getFirstActiveFarmerId() {
  const snaps = await getDocs(query(collection(db, "farmers"), where("status", "==", "active")));
  const first = snaps.docs[0];
  if (!first) {
    throw new Error("No active farmer found for voucher smoke test.");
  }
  return first.id;
}

async function prepareVoucherFixtures() {
  const farmerId = await getFirstActiveFarmerId();
  await setDoc(doc(db, "resources", voucherResourceId), {
    id: voucherResourceId,
    name: voucherResourceName,
    category: "Pataba",
    inventoryGroup: "Para sa Pananim",
    subcategory: "Pataba",
    intendedUse: "Pagpapalago at Pagpapataba",
    stock: 3,
    unit: "sako",
    lastUpdated: new Date().toISOString(),
  });
  await setDoc(doc(db, "vouchers", `QA-VOUCHER-${stamp}`), {
    id: `QA-VOUCHER-${stamp}`,
    code: voucherCode,
    farmerId,
    resourceId: voucherResourceId,
    quantity: 1,
    status: "issued",
    issueDate: new Date().toISOString(),
  });
}

async function cleanupFixtures() {
  await deleteMatchingDocs("farmers", "phone", farmerPhone);
  await deleteMatchingDocs("resources", "name", inventoryName);
  await deleteMatchingDocs("resources", "name", inventoryUpdatedName);
  await deleteMatchingDocs("resources", "name", voucherResourceName);
  await deleteMatchingDocs("marketPrices", "crop", priceCrop);
  await deleteMatchingDocs("marketPrices", "crop", priceCropUpdated);
  await deleteMatchingDocs("vouchers", "code", voucherCode);
  try {
    fs.unlinkSync(tempPng);
  } catch {
    // Best-effort cleanup only.
  }
}

async function login(page) {
  await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: /mag-sign in/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 30000 });
  await page.waitForTimeout(5000);
}

async function waitForCheckedState(page, selector, expectedState = "checked") {
  await page.waitForFunction(
    ({ targetSelector, state }) => {
      const target = document.querySelector(targetSelector);
      return target?.getAttribute("data-state") === state;
    },
    { targetSelector: selector, state: expectedState },
    { timeout: 15000 }
  );
}

async function run() {
  await signInWithEmailAndPassword(auth, email, password);
  await prepareVoucherFixtures();

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const results = [];

  async function step(name, fn) {
    try {
      const detail = await fn();
      results.push({ name, ok: true, detail });
    } catch (error) {
      results.push({
        name,
        ok: false,
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  }

  try {
    await step("login", async () => {
      await login(page);
      return page.url();
    });

    await step("reports print label and popup", async () => {
      await page.goto(`${baseUrl}/dashboard/reports`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(10000);
      const button = page.getByRole("button", { name: /download pdf/i });
      if (!(await button.isVisible())) {
        throw new Error("Download PDF button not visible.");
      }
      const downloadPromise = page.waitForEvent("download", { timeout: 15000 });
      await button.click();
      const download = await downloadPromise;
      if (!download.suggestedFilename().endsWith(".pdf")) {
        throw new Error("Report export did not trigger a PDF download.");
      }
      return download.suggestedFilename();
    });

    await step("account profile workspace and avatar save", async () => {
      await page.goto(`${baseUrl}/dashboard/account`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(4000);

      await page.getByRole("radio", { name: /detalyado/i }).click();
      await page.getByRole("button", { name: /^I-save ang Profile$/ }).click();
      await waitForCheckedState(page, "#workspace-detailed");

      await page.reload({ waitUntil: "domcontentloaded" });
      await waitForCheckedState(page, "#workspace-detailed");
      if ((await page.locator("#workspace-detailed").getAttribute("data-state")) !== "checked") {
        throw new Error("Detailed workspace preference did not persist after reload.");
      }

      await page.getByRole("radio", { name: /simple/i }).click();
      await page.getByRole("button", { name: /^I-save ang Profile$/ }).click();
      await waitForCheckedState(page, "#workspace-simple");

      await page.reload({ waitUntil: "domcontentloaded" });
      await waitForCheckedState(page, "#workspace-simple");
      if ((await page.locator("#workspace-simple").getAttribute("data-state")) !== "checked") {
        throw new Error("Simple workspace preference did not persist after reload.");
      }

      await page.locator('input[type="file"]').setInputFiles(tempPng);
      await page.waitForTimeout(5000);

      const pageText = await page.textContent("body");
      if (pageText?.includes("Hindi na-save ang larawan") || pageText?.includes("Hindi na-save ang profile")) {
        throw new Error("Avatar or profile save surfaced an error.");
      }

      return "workspace toggled and avatar upload completed";
    });

    await step("sms feed queue views", async () => {
      await page.goto(`${baseUrl}/dashboard/sms-feed`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(4000);

      for (const label of ["Kailangang Aksyunan", "Monitoring", "Sarado", "Lahat"]) {
        const button = page.getByRole("button", { name: new RegExp(label, "i") }).first();
        if (!(await button.isVisible())) {
          throw new Error(`Missing SMS feed view button: ${label}`);
        }
      }

      return "queue view buttons visible";
    });

    await step("header workspace switcher removed", async () => {
      await page.goto(`${baseUrl}/dashboard/operations`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(3000);
      if (await page.getByRole("button", { name: /detalyado/i }).count()) {
        throw new Error("Header workspace switcher is still visible.");
      }
      return "header workspace switcher hidden";
    });

    await step("farmer registration", async () => {
      await page.goto(`${baseUrl}/dashboard/farmers/register`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(3000);
      await page.locator('input[name="name"]').fill(farmerName);
      await page.locator('input[placeholder="+63..."]').fill(farmerPhone);
      await page.getByRole("combobox").first().click();
      await page.getByRole("option", { name: "Zone 1" }).click();
      await page.locator('input[placeholder="hal. Palay, Mais"]').fill("Palay");
      await page.getByRole("button", { name: /isumite para sa pag-apruba/i }).click();
      await page.waitForURL(/\/dashboard\/farmers\/approvals/, { timeout: 30000 });
      await page.waitForTimeout(3000);
      const body = await page.textContent("body");
      if (!body?.includes(farmerName)) {
        throw new Error("Pending farmer not visible after registration.");
      }
      return "pending approval row visible";
    });

    await step("farmer approval", async () => {
      const row = page.locator("tr", { hasText: farmerName }).first();
      await row.locator("button").nth(0).click();
      await page.waitForTimeout(4000);
      if ((await page.locator("tr", { hasText: farmerName }).count()) > 0) {
        throw new Error("Farmer row still listed in approvals after approval click.");
      }
      return "pending row cleared";
    });

    await step("farmer delete", async () => {
      await page.goto(`${baseUrl}/dashboard/farmers`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(4000);
      await page.locator('input[type="search"]').first().fill(farmerName);
      await page.waitForTimeout(2500);
      const row = page.locator("tr", { hasText: farmerName }).first();
      await row.locator("button").nth(3).click();
      await page.getByRole("button", { name: "Ituloy" }).click();
      await page.waitForTimeout(4000);
      const body = await page.textContent("body");
      if (body?.includes(farmerName)) {
        throw new Error("Farmer still visible after delete.");
      }
      return "approved farmer deleted";
    });

    await step("inventory add edit delete", async () => {
      await page.goto(`${baseUrl}/dashboard/inventory`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(5000);
      await page.getByRole("button", { name: /magdagdag ng rekurso/i }).click();
      await page.locator("#add-resource-name").fill(inventoryName);
      await page.locator("#add-resource-stock").fill("5");
      await page.locator("#add-resource-unit").fill("sako");
      await page.getByRole("button", { name: /i-save ang rekurso/i }).click();
      await page.waitForTimeout(3000);
      await page.locator('input[type="search"]').first().fill(inventoryName);
      await page.waitForTimeout(2000);
      const row = page.locator("tr", { hasText: inventoryName }).first();
      await row.locator("button").nth(0).click();
      await page.locator("#edit-resource-name").fill(inventoryUpdatedName);
      await page.getByRole("button", { name: /^I-save$/ }).click();
      await page.waitForTimeout(3000);
      await page.locator('input[type="search"]').first().fill(inventoryUpdatedName);
      await page.waitForTimeout(2000);
      const updatedRow = page.locator("tr", { hasText: inventoryUpdatedName }).first();
      await updatedRow.locator("button").nth(1).click();
      await page.getByRole("button", { name: "Ituloy" }).click();
      await page.waitForTimeout(3000);
      if ((await page.locator("tr", { hasText: inventoryUpdatedName }).count()) > 0) {
        throw new Error("Inventory entry still visible after delete.");
      }
      return "resource add/edit/delete passed";
    });

    await step("price watch add edit delete", async () => {
      await page.goto(`${baseUrl}/dashboard/price-watch`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(5000);
      await page.locator('input[placeholder="Crop"]').fill(priceCrop);
      await page.locator('input[placeholder="Presyo"]').fill("24");
      await page.locator('input[placeholder="Unit"]').fill("kilo");
      await page.locator('input[placeholder="Source"]').fill("QA Source");
      await page.getByRole("button", { name: /^Idagdag$/ }).click();
      await page.waitForTimeout(3000);
      const row = page.locator("tr", { hasText: priceCrop }).first();
      await row.locator("button").nth(0).click();
      await page.locator('input[placeholder="Crop"]').fill(priceCropUpdated);
      await page.locator('input[placeholder="Presyo"]').fill("26");
      await page.getByRole("button", { name: /^I-save$/ }).click();
      await page.waitForTimeout(3000);
      const updatedRow = page.locator("tr", { hasText: priceCropUpdated }).first();
      await updatedRow.locator("button").nth(1).click();
      await page.waitForTimeout(2000);
      if ((await page.locator("tr", { hasText: priceCropUpdated }).count()) > 0) {
        throw new Error("Price entry still visible after delete.");
      }
      return "price add/edit/delete passed";
    });

    await step("voucher redeem button", async () => {
      await page.goto(`${baseUrl}/dashboard/vouchers`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(5000);
      await page.locator('input[type="search"]').fill(voucherCode);
      await page.waitForTimeout(2000);
      const row = page.locator("tr", { hasText: voucherCode }).first();
      await row.locator("button").nth(0).click();
      await page.getByRole("button", { name: "Ituloy" }).click();
      await page.waitForTimeout(4000);
      const body = await page.textContent("body");
      if (!body?.includes("Redeemed")) {
        throw new Error("Voucher did not reach redeemed status.");
      }
      return "redeem action completed";
    });
  } finally {
    console.log(JSON.stringify(results, null, 2));
    await browser.close();
    await cleanupFixtures();
    await signOut(auth);
  }
}

run().catch(async (error) => {
  console.error(error);
  await cleanupFixtures();
  try {
    await signOut(auth);
  } catch {
    // Ignore sign-out cleanup errors.
  }
  process.exitCode = 1;
});
