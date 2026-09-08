const FARMERS = [
  { id: "FARM101", name: "Ernesto Guiang", phone: "+639184726395", sitio: "Zone 1", crop: "palay" },
  { id: "FARM102", name: "Jocelyn de Vera", phone: "+639206842179", sitio: "Zone 2", crop: "palay" },
  { id: "FARM103", name: "Noel Pangilinan", phone: "+639473158264", sitio: "Zone 3", crop: "mais" },
  { id: "FARM104", name: "Marites Gozum", phone: "+639987513942", sitio: "Zone 4", crop: "kamatis" },
  { id: "FARM105", name: "Ronnie Abalos", phone: "+639614285736", sitio: "Zone 5", crop: "palay" },
  { id: "FARM106", name: "Edna Cayabyab", phone: "+639082369841", sitio: "Zone 6", crop: "ampalaya" },
  { id: "FARM107", name: "Nestor Bautista", phone: "+639198671453", sitio: "Zone 7", crop: "palay" },
  { id: "FARM108", name: "Leonora Ferrer", phone: "+639395127684", sitio: "Zone 1", crop: "sibuyas" },
  { id: "FARM109", name: "Danilo Catbagan", phone: "+639175842639", sitio: "Zone 2", crop: "mais" },
  { id: "FARM110", name: "Mylene Apostol", phone: "+639273189475", sitio: "Zone 3", crop: "talong" },
];

const WEATHER_SCENARIOS = [
  {
    intent: "WEATHER_HELP",
    urgency: "high",
    safetyFlag: "High",
    tone: "Nag-aalala",
    message: (farmer) => `Tuluy-tuloy ang ulan mula kagabi at naiipon ang tubig sa ${farmer.crop} dito sa ${farmer.sitio}. Ano po ang unang gagawin?`,
    advice: "Suriin ang ligtas na drainage outlet, ilipat ang farm inputs sa tuyong lugar, at i-report agad kung patuloy na tumataas ang tubig.",
  },
  {
    intent: "WEATHER_HELP",
    urgency: "high",
    safetyFlag: "High",
    tone: "Kritikal",
    message: (farmer) => `Malakas ang hangin at ulan sa ${farmer.sitio}. May mga nakahigang ${farmer.crop} at may sanga sa daanan.`,
    advice: "Unahin ang kaligtasan, huwag lumapit sa naputol na kable o mabigat na sanga, at magpa-assess ng crop damage kapag ligtas na ang lugar.",
  },
  {
    intent: "EMERGENCY",
    urgency: "high",
    safetyFlag: "High",
    tone: "Kritikal",
    message: (farmer) => `Mabilis tumaas ang tubig sa kanal malapit sa taniman namin sa ${farmer.sitio}. Umaabot na sa gilid ng plot.`,
    advice: "Ipaalam agad sa barangay response team, ilayo ang tao at kagamitan sa rumaragasang tubig, at huwag tumawid sa baha.",
  },
  {
    intent: "CROP_UPDATE",
    urgency: "medium",
    safetyFlag: "Medium",
    tone: "Nag-aalala",
    message: (farmer) => `Dalawang araw nang basa ang lupa at naninilaw ang ilang ${farmer.crop}. Hindi ko alam kung kulang sa sustansya o sobra sa tubig.`,
    advice: "Huwag munang magdagdag ng pataba habang basang-basa ang lupa. I-check ang drainage at ipa-validate ang ugat at lawak ng paninilaw.",
  },
  {
    intent: "HARVEST",
    urgency: "medium",
    safetyFlag: "Low",
    tone: "Nag-aalala",
    message: (farmer) => `May aanihin sana kaming ${farmer.crop} pero pabugso-bugso ang ulan. May tuyong lugar po bang puwedeng paglagyan?`,
    advice: "I-coordinate ang covered drying o temporary storage area at gumamit ng malinis na trapal upang hindi mabasa o mahaluan ng dumi ang ani.",
  },
  {
    intent: "WEATHER_HELP",
    urgency: "medium",
    safetyFlag: "Medium",
    tone: "Neutral",
    message: (farmer) => `May thunderstorm warning daw. Ano po ang ihahanda namin para sa ${farmer.crop} at mga gamit sa bukid?`,
    advice: "I-secure ang magagaan na kagamitan, ilipat ang binhi at kemikal sa mataas na lugar, linisin ang kanal, at iwasan ang field work kapag kumikidlat.",
  },
];

const FARM_SCENARIOS = [
  {
    intent: "PEST_DISEASE",
    urgency: "medium",
    safetyFlag: "Medium",
    tone: "Nag-aalala",
    message: (farmer) => `Pagkatapos ng ulan dumami ang kuhol at insekto sa ${farmer.crop} namin sa ${farmer.sitio}.`,
    advice: "I-record ang lawak ng damage, gawin muna ang ligtas na manual control, at ipa-validate bago gumamit ng pesticide.",
  },
  {
    intent: "PEST_DISEASE",
    urgency: "high",
    safetyFlag: "High",
    tone: "Nag-aalala",
    message: (farmer) => `May bagong batik at pagkabulok sa dahon ng ${farmer.crop} matapos ang sunod-sunod na ulan. Kumakalat sa katabing hanay.`,
    advice: "Ihiwalay ang malubhang apektadong bahagi, iwasang magtrabaho habang basa ang dahon, at ipa-field validate ang posibleng fungal o bacterial issue.",
  },
  {
    intent: "REQUEST",
    urgency: "medium",
    safetyFlag: "Low",
    tone: "Neutral",
    message: (farmer) => `Pwede po bang makahiram ng sprayer o trap para sa ${farmer.crop}? Nahirapan kami pagkatapos ng ulan.`,
    advice: "I-check ang availability sa inventory at i-validate ang gagamiting intervention bago maglabas ng kagamitan o voucher.",
  },
  {
    intent: "PRICE_CHECK",
    urgency: "low",
    safetyFlag: "Low",
    tone: "Neutral",
    message: (farmer) => `Magkano po bentahan ng ${farmer.crop} ngayon? Baka maantala ang biyahe dahil sa sama ng panahon.`,
    advice: "Gamitin ang pinakahuling verified market price at kumpirmahin ang bukas na buying station bago bumiyahe.",
  },
  {
    intent: "CROP_UPDATE",
    urgency: "medium",
    safetyFlag: "Medium",
    tone: "Nag-aalala",
    message: (farmer) => `May bahagi ng ${farmer.crop} na mahina ang tubo pagkatapos ng baha. Kailangan po ba agad mag-replant?`,
    advice: "Hintaying bumaba ang tubig, i-check ang buhay na halaman at ugat, at sukatin muna ang damaged area bago magpasya sa replanting.",
  },
  {
    intent: "PEST_DISEASE",
    urgency: "high",
    safetyFlag: "High",
    tone: "Kritikal",
    message: (farmer) => `May daga at uod na lumipat sa tuyong bahagi ng ${farmer.crop}. Mas marami sila ngayong maulan.`,
    advice: "I-validate ang pest pressure, alisin ang ligtas na taguan, at gumamit muna ng traps o threshold-based control bago chemical intervention.",
  },
];

const REGULAR_SCENARIOS = [
  {
    intent: "CROP_UPDATE",
    urgency: "low",
    safetyFlag: "Low",
    tone: "Neutral",
    message: (farmer) => `Kailan po pinakamainam mag-abono sa ${farmer.crop}? Nasa vegetative stage na ang tanim sa ${farmer.sitio}.`,
    advice: "I-check muna ang crop stage, lagay ng lupa, at huling application. Ipa-validate ang tamang timing at dami bago magdagdag ng pataba.",
  },
  {
    intent: "REQUEST",
    urgency: "medium",
    safetyFlag: "Low",
    tone: "Neutral",
    message: (farmer) => `May available po bang binhi o punla para sa susunod na taniman ng ${farmer.crop}?`,
    advice: "I-check ang barangay inventory at eligibility record, saka ibigay ang release schedule kung may available na binhi o punla.",
  },
  {
    intent: "PEST_DISEASE",
    urgency: "medium",
    safetyFlag: "Medium",
    tone: "Nag-aalala",
    message: (farmer) => `May maliliit na butas at kulubot na dahon sa ${farmer.crop}. Kaunti pa pero dumarami sa isang bahagi.`,
    advice: "Kunan ng malinaw na larawan, bilangin ang apektadong halaman, at ipa-validate ang peste bago gumamit ng anumang pesticide.",
  },
  {
    intent: "PRICE_CHECK",
    urgency: "low",
    safetyFlag: "Low",
    tone: "Neutral",
    message: (farmer) => `Magkano po ang huling verified na presyo ng ${farmer.crop} sa bagsakan?`,
    advice: "Ibigay ang pinakahuling verified Price Watch entry at ipaalala na kumpirmahin ang presyo at buying schedule bago bumiyahe.",
  },
  {
    intent: "HARVEST",
    urgency: "medium",
    safetyFlag: "Low",
    tone: "Neutral",
    message: (farmer) => `Malapit na po anihin ang ${farmer.crop}. Maaari bang magpa-schedule ng drying o storage support?`,
    advice: "I-record ang tinatayang harvest date at volume, saka i-coordinate ang available drying, hauling, o temporary storage support.",
  },
  {
    intent: "REQUEST",
    urgency: "medium",
    safetyFlag: "Low",
    tone: "Neutral",
    message: (farmer) => `Pwede po bang makahiram ng sprayer o hand tools para sa ${farmer.crop} dito sa ${farmer.sitio}?`,
    advice: "I-check ang inventory, kondisyon ng kagamitan, at schedule ng release bago gumawa ng assistance o voucher record.",
  },
  {
    intent: "CROP_UPDATE",
    urgency: "medium",
    safetyFlag: "Medium",
    tone: "Nag-aalala",
    message: (farmer) => `Hindi pantay ang tubo ng ${farmer.crop}; mahina ang nasa mababang bahagi ng lupa.`,
    advice: "Suriin ang drainage, moisture, at lawak ng mahinang tubo. Iwasang magdagdag agad ng input nang walang field validation.",
  },
  {
    intent: "PEST_DISEASE",
    urgency: "high",
    safetyFlag: "High",
    tone: "Kritikal",
    message: (farmer) => `May daga at kuhol na sumisira sa ${farmer.crop} tuwing gabi. Malaki na ang apektadong bahagi.`,
    advice: "Ipa-validate ang lawak ng damage at gumamit muna ng ligtas na traps o manual collection bago chemical control.",
  },
  {
    intent: "WEATHER_HELP",
    urgency: "medium",
    safetyFlag: "Medium",
    tone: "Nag-aalala",
    message: (farmer) => `Masyadong mainit at mabilis matuyo ang lupa ng ${farmer.crop}. Anong oras po ligtas magdilig?`,
    advice: "Mas mainam ang maagang umaga o hapon. I-check ang soil moisture at iwasan ang sobrang pagdidilig o field work sa matinding init.",
  },
  {
    intent: "CROP_UPDATE",
    urgency: "low",
    safetyFlag: "Low",
    tone: "Positibo",
    message: (farmer) => `Maayos na po ulit ang ${farmer.crop} pagkatapos ng huling payo. Kaunti na lang ang nakikitang sintomas.`,
    advice: "I-record ang improvement, ipagpatuloy ang monitoring, at mag-follow up kung bumalik o lumawak ang sintomas.",
  },
  {
    intent: "REQUEST",
    urgency: "medium",
    safetyFlag: "Low",
    tone: "Neutral",
    message: (farmer) => `Maaari po bang magpa-ocular visit para sa ${farmer.crop}? Hindi namin matukoy ang sanhi ng problema.`,
    advice: "Gumawa ng field visit request na may location, crop stage, sintomas, at available schedule ng magsasaka.",
  },
  {
    intent: "PEST_DISEASE",
    urgency: "medium",
    safetyFlag: "Medium",
    tone: "Nag-aalala",
    message: (farmer) => `May puti at parang pulbos sa ilang dahon ng ${farmer.crop}. Ano po kaya ito?`,
    advice: "Iwasang magbigay agad ng diagnosis. Kumuha ng larawan, tingnan ang panahon at lawak ng sintomas, at ipa-review sa AEW.",
  },
  {
    intent: "REQUEST",
    urgency: "low",
    safetyFlag: "Low",
    tone: "Neutral",
    message: (farmer) => `Paano po mag-update ng lawak ng taniman at bagong crop sa farmer record ko sa ${farmer.sitio}?`,
    advice: "Ipa-confirm ang farmer identity at bagong farm details, pagkatapos ay ipa-review sa barangay bago baguhin ang profile.",
  },
  {
    intent: "CROP_UPDATE",
    urgency: "medium",
    safetyFlag: "Medium",
    tone: "Nag-aalala",
    message: (farmer) => `Naninilaw ang ${farmer.crop} kahit regular ang dilig. Wala naman pong nakikitang insekto.`,
    advice: "I-check ang drainage, ugat, soil condition, at fertilization history bago magrekomenda ng correction.",
  },
  {
    intent: "PRICE_CHECK",
    urgency: "low",
    safetyFlag: "Low",
    tone: "Neutral",
    message: (farmer) => `Bukas po ba ang buying station para sa ${farmer.crop} at may biyahe ba mula ${farmer.sitio}?`,
    advice: "Kumpirmahin ang buying station schedule, transport condition, at pinakahuling presyo bago bumiyahe ang magsasaka.",
  },
  {
    intent: "HARVEST",
    urgency: "medium",
    safetyFlag: "Low",
    tone: "Nag-aalala",
    message: (farmer) => `May ilang bahagi ng ${farmer.crop} na hinog na pero hindi pa pantay ang buong plot. Ano po ang practical na gawin?`,
    advice: "Ipa-assess ang maturity at maaaring unahin ang selective harvest kung ligtas at makatutulong itong bawasan ang posibleng pagkawala.",
  },
];

function addMinutes(timestamp, minutes) {
  return new Date(new Date(timestamp).getTime() + minutes * 60_000).toISOString();
}

function addDays(timestamp, days) {
  return new Date(new Date(timestamp).getTime() + days * 86_400_000).toISOString();
}

function listSeasonDays() {
  return [
    ...Array.from({ length: 31 }, (_, index) => `2026-08-${String(index + 1).padStart(2, "0")}`),
    ...Array.from({ length: 8 }, (_, index) => `2026-09-${String(index + 1).padStart(2, "0")}`),
  ];
}

function listRegularSeasonDays() {
  const days = [];
  const current = new Date("2026-02-01T00:00:00Z");
  const last = new Date("2026-07-31T00:00:00Z");

  while (current <= last) {
    days.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return days;
}

function buildFlowFields(index, timestamp, urgency) {
  const flow = index % 5;

  if (flow === 0) {
    return {
      status: "pending_approval",
      caseStatus: "open",
      caseOutcomeStatus: "needs_follow_up",
      followUpDueAt: addDays(timestamp, 1),
    };
  }

  if (flow === 1) {
    return {
      status: "approved",
      caseStatus: "assigned",
      assignedTo: urgency === "high" ? "AEW" : "Brgy. Admin",
      assignedToUserId: urgency === "high" ? "aew" : "brgy-admin",
      assignedAt: addMinutes(timestamp, 6),
      respondedAt: addMinutes(timestamp, 14),
      caseOutcomeStatus: "needs_follow_up",
      followUpDueAt: addDays(timestamp, 2),
    };
  }

  if (flow === 2 || flow === 4) {
    return {
      status: "replied",
      caseStatus: "closed",
      assignedTo: urgency === "high" ? "AEW" : "Secretary",
      assignedAt: addMinutes(timestamp, 5),
      respondedAt: addMinutes(timestamp, 13),
      closedAt: addDays(timestamp, 2),
      caseOutcomeStatus: "resolved",
      caseOutcomeSummary: "Na-review ang concern, naibigay ang nararapat na payo, at kinumpirma sa follow-up na kontrolado na ang sitwasyon.",
      caseOutcomeUpdatedAt: addDays(timestamp, 2),
      caseOutcomeUpdatedBy: urgency === "high" ? "AEW" : "Secretary",
      resolutionConfirmationStatus: "confirmed_by_farmer",
      resolutionConfirmationRequestedAt: addDays(timestamp, 1),
      resolutionConfirmedAt: addDays(timestamp, 2),
    };
  }

  return {
    status: "approved",
    caseStatus: urgency === "high" ? "escalated" : "monitoring",
    assignedTo: "AEW",
    assignedToUserId: "aew",
    assignedAt: addMinutes(timestamp, 4),
    respondedAt: addMinutes(timestamp, 11),
    ...(urgency === "high" ? { escalatedAt: addMinutes(timestamp, 4) } : {}),
    caseOutcomeStatus: "monitoring",
    followUpDueAt: addDays(timestamp, 2),
  };
}

export const regularSeasonSmsMessages = listRegularSeasonDays().flatMap((date, dayIndex) => {
  const slots = [];

  if (dayIndex % 2 === 0) {
    slots.push(0);
  }

  if (dayIndex % 7 === 0) {
    slots.push(1);
  }

  return slots.map((slot) => {
    const index = dayIndex * 2 + slot;
    const farmer = FARMERS[(dayIndex * 3 + slot * 4) % FARMERS.length];
    const scenario = REGULAR_SCENARIOS[(dayIndex + slot * 5) % REGULAR_SCENARIOS.length];
    const hour = 1 + ((dayIndex + slot * 4) % 10);
    const minute = (11 + index * 9) % 60;
    const timestamp = `${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00Z`;
    const compactDate = date.replaceAll("-", "");

    return {
      id: `SMSREG${compactDate}${slot === 0 ? "A" : "B"}`,
      farmerId: farmer.id,
      farmerName: farmer.name,
      phone: farmer.phone,
      message: scenario.message(farmer),
      timestamp,
      parsedIntent: scenario.intent,
      urgency: scenario.urgency,
      aiAdvice: scenario.advice,
      aiConfidence: Number((0.82 + (index % 15) / 100).toFixed(2)),
      safetyFlag: scenario.safetyFlag,
      tone: scenario.tone,
      analysisSource: index % 6 === 0 ? "ai_fallback" : "ai",
      detectedLanguage: index % 5 === 0 ? "Taglish" : "Filipino",
      caseId: `CASE-REGULAR-${compactDate}-${slot + 1}`,
      cropStage: ["seedling", "vegetative", "flowering", "fruiting", "pre_harvest"][index % 5],
      sentiment: scenario.urgency === "high" ? "concerned" : "neutral",
      sourceProvider: "generic",
      ...buildFlowFields(index, timestamp, scenario.urgency),
    };
  });
});

export const typhoonSeasonSmsMessages = listSeasonDays().flatMap((date, dayIndex) => (
  [0, 1, 2, 3, 4].map((slot) => {
    const index = dayIndex * 5 + slot;
    const farmer = FARMERS[(dayIndex * 3 + slot * 2) % FARMERS.length];
    const scenarios = slot % 2 === 0 ? WEATHER_SCENARIOS : FARM_SCENARIOS;
    const scenario = scenarios[(dayIndex + slot) % scenarios.length];
    const hour = [0, 3, 5, 8, 11][slot] + (dayIndex % 2);
    const minute = (17 + index * 7) % 60;
    const timestamp = `${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00Z`;
    const compactDate = date.replaceAll("-", "");
    const suffix = ["B", "C", "D", "E", "F"][slot];

    return {
      id: `SMS${compactDate}${suffix}`,
      farmerId: farmer.id,
      farmerName: farmer.name,
      phone: farmer.phone,
      message: scenario.message(farmer),
      timestamp,
      parsedIntent: scenario.intent,
      urgency: scenario.urgency,
      aiAdvice: scenario.advice,
      aiConfidence: Number((0.84 + (index % 12) / 100).toFixed(2)),
      safetyFlag: scenario.safetyFlag,
      tone: scenario.tone,
      analysisSource: index % 4 === 0 ? "ai_fallback" : "ai",
      detectedLanguage: index % 7 === 0 ? "Taglish" : "Filipino",
      caseId: `CASE-TYPHOON-${compactDate}-${slot + 1}`,
      cropStage: ["seedling", "vegetative", "flowering", "fruiting", "pre_harvest"][index % 5],
      sentiment: scenario.urgency === "high" ? "concerned" : "neutral",
      sourceProvider: "generic",
      ...buildFlowFields(index, timestamp, scenario.urgency),
    };
  })
));

export const regularSeasonOutboundMessages = regularSeasonSmsMessages
  .filter((message) => message.respondedAt)
  .map((message) => ({
    id: `OUT${message.id.slice(3)}`,
    smsMessageId: message.id,
    recipientPhone: message.phone,
    audience: "farmer",
    purpose: "manual_reply",
    body: message.aiAdvice,
    status: "delivered",
    provider: "smsgate",
    createdAt: addMinutes(message.timestamp, 8),
    sentAt: addMinutes(message.timestamp, 10),
    lastStatusAt: message.respondedAt,
    deliveryReceivedAt: message.respondedAt,
    attempts: 1,
  }));

export const typhoonSeasonOutboundMessages = typhoonSeasonSmsMessages
  .filter((message) => message.respondedAt)
  .map((message) => ({
    id: `OUT${message.id.slice(3)}`,
    smsMessageId: message.id,
    recipientPhone: message.phone,
    audience: "farmer",
    purpose: "manual_reply",
    body: message.aiAdvice,
    status: "delivered",
    provider: "smsgate",
    createdAt: addMinutes(message.timestamp, 8),
    sentAt: addMinutes(message.timestamp, 10),
    lastStatusAt: message.respondedAt,
    deliveryReceivedAt: message.respondedAt,
    attempts: 1,
  }));

export const typhoonSeasonAuditLogs = typhoonSeasonSmsMessages.map((message, index) => ({
  id: `AUD-TYPHOON-${String(index + 1).padStart(3, "0")}`,
  timestamp: message.respondedAt ?? addMinutes(message.timestamp, 3),
  user: message.assignedTo ?? "Lingkod-Ani Intake",
  action: message.caseStatus === "open" ? "QUEUE_SMS_CASE" : message.caseStatus === "closed" ? "CLOSE_SMS_CASE" : "UPDATE_SMS_CASE",
  details: `${message.farmerName}: ${message.parsedIntent} concern recorded as ${message.caseStatus}.`,
  category: "operations",
  severity: message.urgency === "high" ? "warning" : "info",
}));

export const regularSeasonAuditLogs = regularSeasonSmsMessages.map((message, index) => ({
  id: `AUD-REGULAR-${String(index + 1).padStart(3, "0")}`,
  timestamp: message.respondedAt ?? addMinutes(message.timestamp, 3),
  user: message.assignedTo ?? "Lingkod-Ani Intake",
  action: message.caseStatus === "open" ? "QUEUE_SMS_CASE" : message.caseStatus === "closed" ? "CLOSE_SMS_CASE" : "UPDATE_SMS_CASE",
  details: `${message.farmerName}: ${message.parsedIntent} concern recorded as ${message.caseStatus}.`,
  category: "operations",
  severity: message.urgency === "high" ? "warning" : "info",
}));

export const typhoonSeasonLogbookEntries = typhoonSeasonSmsMessages.map((message, index) => ({
  id: `LOG-TYPHOON-${String(index + 1).padStart(3, "0")}`,
  farmerId: message.farmerId,
  timestamp: message.timestamp,
  type: message.parsedIntent === "WEATHER_HELP" || message.parsedIntent === "EMERGENCY" ? "Insidente" : "SMS",
  title: message.parsedIntent === "WEATHER_HELP" || message.parsedIntent === "EMERGENCY" ? "Ulat sa panahon" : "Ulat mula sa magsasaka",
  description: message.message,
}));

export const regularSeasonLogbookEntries = regularSeasonSmsMessages.map((message, index) => ({
  id: `LOG-REGULAR-${String(index + 1).padStart(3, "0")}`,
  farmerId: message.farmerId,
  timestamp: message.timestamp,
  type: message.parsedIntent === "WEATHER_HELP" || message.parsedIntent === "EMERGENCY" ? "Insidente" : "SMS",
  title: message.parsedIntent === "WEATHER_HELP" || message.parsedIntent === "EMERGENCY" ? "Ulat sa panahon" : "Regular na ulat mula sa magsasaka",
  description: message.message,
}));
