/** @jest-environment node */

import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { isPrivacyExcludedPhone } from "@/lib/sms-privacy";

describe("live presentation timeline", () => {
  const source = readFileSync(
    resolve(process.cwd(), "scripts/seed-live-presentation-data.mjs"),
    "utf8"
  );
  const messagesSection = source.slice(
    source.indexOf("const smsMessages = ["),
    source.indexOf("const outboundMessages = [")
  );
  const seasonalModuleUrl = pathToFileURL(
    resolve(process.cwd(), "scripts/presentation-typhoon-data.mjs")
  ).href;
  const seasonalData = JSON.parse(execFileSync(
    process.execPath,
    [
      "--input-type=module",
      "--eval",
      `import { typhoonSeasonSmsMessages } from ${JSON.stringify(seasonalModuleUrl)}; process.stdout.write(JSON.stringify(typhoonSeasonSmsMessages));`,
    ],
    { encoding: "utf8" }
  )) as Array<{ timestamp: string; phone: string }>;

  it("covers every month from February through September 8, 2026", () => {
    const baseTimestamps = [...messagesSection.matchAll(/timestamp:\s*"([^"]+)"/g)]
      .map((match) => match[1]);
    const timestamps = [...baseTimestamps, ...seasonalData.map((message) => message.timestamp)];
    const months = new Set(timestamps.map((timestamp) => timestamp.slice(0, 7)));

    expect(baseTimestamps).toHaveLength(48);
    expect(seasonalData).toHaveLength(78);
    expect(timestamps).toHaveLength(126);
    expect([...months]).toEqual([
      "2026-02",
      "2026-03",
      "2026-04",
      "2026-05",
      "2026-06",
      "2026-07",
      "2026-08",
      "2026-09",
    ]);
    expect(timestamps.sort().at(-1)?.startsWith("2026-09-08T")).toBe(true);
  });

  it("contains at least two farmer reports on every day from August 1 through September 8", () => {
    const dailyCounts = seasonalData.reduce<Record<string, number>>((counts, message) => {
      const day = message.timestamp.slice(0, 10);
      counts[day] = (counts[day] ?? 0) + 1;
      return counts;
    }, {});

    expect(Object.keys(dailyCounts)).toHaveLength(39);
    expect(Object.values(dailyCounts).every((count) => count >= 2)).toBe(true);
  });

  it("does not use the protected personal sender in presentation records", () => {
    const phones = [
      ...[...messagesSection.matchAll(/phone:\s*"([^"]+)"/g)].map((match) => match[1]),
      ...seasonalData.map((message) => message.phone),
    ];

    expect(phones.length).toBeGreaterThan(0);
    expect(phones.some((phone) => isPrivacyExcludedPhone(phone))).toBe(false);
  });
});
