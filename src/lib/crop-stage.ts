import type { Farmer, SmsCropStage, SmsMessage } from "@/lib/types";

export type CropStageLabel =
  | "Pagtatanim"
  | "Paglago"
  | "Pamumulaklak"
  | "Pag-aani"
  | "Hindi pa naitatala";

const SMS_CROP_STAGE_LABELS: Record<SmsCropStage, CropStageLabel> = {
  seedling: "Pagtatanim",
  vegetative: "Paglago",
  flowering: "Pamumulaklak",
  fruiting: "Pag-aani",
  pre_harvest: "Pag-aani",
  harvest_ready: "Pag-aani",
  unknown: "Hindi pa naitatala",
};

const CROP_STAGE_KEYWORDS: Array<{ label: CropStageLabel; keywords: string[] }> = [
  { label: "Pagtatanim", keywords: ["punla", "seedling", "binhi", "tanim", "natanim", "bagong tanim"] },
  { label: "Pamumulaklak", keywords: ["bulaklak", "flower", "pamumulaklak", "namumulaklak"] },
  { label: "Pag-aani", keywords: ["ani", "harvest", "hinog", "pre harvest", "ready anihin", "aani na"] },
  { label: "Paglago", keywords: ["tubo", "lumalaki", "growth", "vegetative", "dahon", "paglago"] },
];

function normalize(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

export function mapSmsCropStageToLabel(cropStage?: SmsCropStage | null): CropStageLabel {
  if (!cropStage) {
    return "Hindi pa naitatala";
  }

  return SMS_CROP_STAGE_LABELS[cropStage] ?? "Hindi pa naitatala";
}

export function inferCropStageLabelFromMessage(
  message: Pick<SmsMessage, "cropStage" | "message">
): CropStageLabel {
  const structuredStage = mapSmsCropStageToLabel(message.cropStage);

  if (structuredStage !== "Hindi pa naitatala") {
    return structuredStage;
  }

  const haystack = normalize(message.message);

  for (const candidate of CROP_STAGE_KEYWORDS) {
    if (candidate.keywords.some((keyword) => haystack.includes(keyword))) {
      return candidate.label;
    }
  }

  return "Hindi pa naitatala";
}

export function getLatestFarmerCropStage(
  farmer: Pick<Farmer, "id">,
  messages: SmsMessage[]
) {
  const latestMessage = [...messages]
    .filter((message) => message.farmerId === farmer.id)
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())[0];

  if (!latestMessage) {
    return "Hindi pa naitatala" as CropStageLabel;
  }

  return inferCropStageLabelFromMessage(latestMessage);
}
