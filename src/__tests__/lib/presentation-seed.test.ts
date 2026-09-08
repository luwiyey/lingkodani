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
  const generatedData = JSON.parse(execFileSync(
    process.execPath,
    [
      "--input-type=module",
      "--eval",
      `import { regularSeasonSmsMessages, typhoonSeasonSmsMessages } from ${JSON.stringify(seasonalModuleUrl)}; process.stdout.write(JSON.stringify({ regularSeasonSmsMessages, typhoonSeasonSmsMessages }));`,
    ],
    { encoding: "utf8" }
  )) as {
    regularSeasonSmsMessages: Array<{ timestamp: string; phone: string }>;
    typhoonSeasonSmsMessages: Array<{ timestamp: string; phone: string }>;
  };
  const regularSeasonData = generatedData.regularSeasonSmsMessages;
  const typhoonSeasonData = generatedData.typhoonSeasonSmsMessages;

  it("covers every month from February through September 8, 2026", () => {
    const baseTimestamps = [...messagesSection.matchAll(/timestamp:\s*"([^"]+)"/g)]
      .map((match) => match[1]);
    const timestamps = [
      ...baseTimestamps,
      ...regularSeasonData.map((message) => message.timestamp),
      ...typhoonSeasonData.map((message) => message.timestamp),
    ];
    const months = new Set(timestamps.map((timestamp) => timestamp.slice(0, 7)));

    expect(baseTimestamps).toHaveLength(48);
    expect(regularSeasonData).toHaveLength(117);
    expect(typhoonSeasonData).toHaveLength(195);
    expect(timestamps).toHaveLength(360);
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

  it("contains five farmer reports on every day from August 1 through September 8", () => {
    const dailyCounts = typhoonSeasonData.reduce<Record<string, number>>((counts, message) => {
      const day = message.timestamp.slice(0, 10);
      counts[day] = (counts[day] ?? 0) + 1;
      return counts;
    }, {});

    expect(Object.keys(dailyCounts)).toHaveLength(39);
    expect(Object.values(dailyCounts).every((count) => count === 5)).toBe(true);
  });

  it("keeps steady regular-season activity from February through July", () => {
    const monthlyCounts = regularSeasonData.reduce<Record<string, number>>((counts, message) => {
      const month = message.timestamp.slice(0, 7);
      counts[month] = (counts[month] ?? 0) + 1;
      return counts;
    }, {});

    expect(Object.keys(monthlyCounts)).toEqual([
      "2026-02",
      "2026-03",
      "2026-04",
      "2026-05",
      "2026-06",
      "2026-07",
    ]);
    expect(Object.values(monthlyCounts).every((count) => count >= 18)).toBe(true);
  });

  it("does not use the protected personal sender in presentation records", () => {
    const phones = [
      ...[...messagesSection.matchAll(/phone:\s*"([^"]+)"/g)].map((match) => match[1]),
      ...regularSeasonData.map((message) => message.phone),
      ...typhoonSeasonData.map((message) => message.phone),
    ];

    expect(phones.length).toBeGreaterThan(0);
    expect(phones.some((phone) => isPrivacyExcludedPhone(phone))).toBe(false);
  });
});
