import type {
  Resource,
  ResourceCategory,
  ResourceInventoryGroup,
  ResourceInventoryUse,
} from "@/lib/types";

export const RESOURCE_GROUP_OPTIONS: ResourceInventoryGroup[] = [
  "Para sa Pananim",
  "Proteksyon ng Pananim",
  "Kagamitan at Makinarya",
  "Patubig at Tubig",
  "Serbisyo at Gawaing-Tao",
  "Pag-aani at Imbakan",
  "Pangkalahatang Suporta",
];

export const RESOURCE_USE_OPTIONS: ResourceInventoryUse[] = [
  "Pagtatanim",
  "Pagpapalago at Pagpapataba",
  "Pagkontrol ng Peste at Sakit",
  "Pagdidilig at Patubig",
  "Pag-aani at Pagproseso",
  "Serbisyo sa Bukid",
  "Pangkalahatang Suporta",
];

export const RESOURCE_CATEGORY_OPTIONS: ResourceCategory[] = [
  "Pataba",
  "Binhi",
  "Kagamitan",
  "Paggawa",
];

export const RESOURCE_SUBCATEGORY_OPTIONS: Record<ResourceInventoryGroup, string[]> = {
  "Para sa Pananim": [
    "Pataba",
    "Binhi",
    "Soil conditioner",
    "Punla at seedlings",
    "Input package",
  ],
  "Proteksyon ng Pananim": [
    "Pestisidyo",
    "Organic spray",
    "Rodent control",
    "Protective gear",
    "Monitoring kit",
  ],
  "Kagamitan at Makinarya": [
    "Hand tools",
    "Makinarya sa bukid",
    "Spraying equipment",
    "Transport equipment",
    "Power tools",
  ],
  "Patubig at Tubig": [
    "Water pump",
    "Hose at fittings",
    "Irrigation support",
    "Water storage",
  ],
  "Serbisyo at Gawaing-Tao": [
    "Labor pool",
    "Field service",
    "Repair service",
    "Transport service",
    "Technical assistance",
  ],
  "Pag-aani at Imbakan": [
    "Harvest tools",
    "Drying support",
    "Storage supplies",
    "Post-harvest kit",
  ],
  "Pangkalahatang Suporta": [
    "General support",
    "Emergency stock",
    "Office/admin supply",
  ],
};

type InferredResourceMetadata = Pick<Resource, "inventoryGroup" | "subcategory" | "intendedUse">;

function includesAny(value: string, fragments: string[]) {
  return fragments.some((fragment) => value.includes(fragment));
}

export function inferResourceMetadata(resource: Pick<Resource, "name" | "category" | "inventoryGroup" | "subcategory" | "intendedUse">): InferredResourceMetadata {
  if (resource.inventoryGroup && resource.subcategory && resource.intendedUse) {
    return {
      inventoryGroup: resource.inventoryGroup,
      subcategory: resource.subcategory,
      intendedUse: resource.intendedUse,
    };
  }

  const normalizedName = resource.name.trim().toLowerCase();

  let inventoryGroup: ResourceInventoryGroup | undefined = resource.inventoryGroup;
  let subcategory = resource.subcategory?.trim();
  let intendedUse: ResourceInventoryUse | undefined = resource.intendedUse;

  if (!inventoryGroup) {
    if (resource.category === "Paggawa") {
      inventoryGroup = "Serbisyo at Gawaing-Tao";
    } else if (resource.category === "Binhi" || resource.category === "Pataba") {
      inventoryGroup = includesAny(normalizedName, ["pesticide", "pamatay", "neem", "spray", "trap", "lason"])
        ? "Proteksyon ng Pananim"
        : "Para sa Pananim";
    } else if (resource.category === "Kagamitan") {
      if (includesAny(normalizedName, ["hose", "pump", "irrigation", "water", "tubig"])) {
        inventoryGroup = "Patubig at Tubig";
      } else if (includesAny(normalizedName, ["harvest", "dryer", "thresher", "storage", "sako"])) {
        inventoryGroup = "Pag-aani at Imbakan";
      } else {
        inventoryGroup = "Kagamitan at Makinarya";
      }
    } else {
      inventoryGroup = "Pangkalahatang Suporta";
    }
  }

  if (!subcategory) {
    if (inventoryGroup === "Para sa Pananim") {
      if (resource.category === "Binhi" || includesAny(normalizedName, ["binhi", "seed", "punla"])) {
        subcategory = includesAny(normalizedName, ["punla", "seedling"]) ? "Punla at seedlings" : "Binhi";
      } else {
        subcategory = includesAny(normalizedName, ["soil", "compost"]) ? "Soil conditioner" : "Pataba";
      }
    } else if (inventoryGroup === "Proteksyon ng Pananim") {
      if (includesAny(normalizedName, ["neem", "organic"])) {
        subcategory = "Organic spray";
      } else if (includesAny(normalizedName, ["daga", "rat", "rodent"])) {
        subcategory = "Rodent control";
      } else if (includesAny(normalizedName, ["gloves", "mask", "ppe", "gear"])) {
        subcategory = "Protective gear";
      } else {
        subcategory = "Pestisidyo";
      }
    } else if (inventoryGroup === "Kagamitan at Makinarya") {
      if (includesAny(normalizedName, ["tractor", "kuliglig"])) {
        subcategory = "Makinarya sa bukid";
      } else if (includesAny(normalizedName, ["sprayer"])) {
        subcategory = "Spraying equipment";
      } else if (includesAny(normalizedName, ["truck", "trailer", "cart"])) {
        subcategory = "Transport equipment";
      } else {
        subcategory = "Hand tools";
      }
    } else if (inventoryGroup === "Patubig at Tubig") {
      if (includesAny(normalizedName, ["pump"])) {
        subcategory = "Water pump";
      } else if (includesAny(normalizedName, ["hose", "fitting"])) {
        subcategory = "Hose at fittings";
      } else if (includesAny(normalizedName, ["tank", "storage"])) {
        subcategory = "Water storage";
      } else {
        subcategory = "Irrigation support";
      }
    } else if (inventoryGroup === "Serbisyo at Gawaing-Tao") {
      if (includesAny(normalizedName, ["repair", "ayos"])) {
        subcategory = "Repair service";
      } else if (includesAny(normalizedName, ["transport", "hatid"])) {
        subcategory = "Transport service";
      } else if (includesAny(normalizedName, ["technical", "advice", "training"])) {
        subcategory = "Technical assistance";
      } else if (includesAny(normalizedName, ["manggagawa", "labor"])) {
        subcategory = "Labor pool";
      } else {
        subcategory = "Field service";
      }
    } else if (inventoryGroup === "Pag-aani at Imbakan") {
      if (includesAny(normalizedName, ["storage", "sako", "container"])) {
        subcategory = "Storage supplies";
      } else if (includesAny(normalizedName, ["dryer", "drying"])) {
        subcategory = "Drying support";
      } else {
        subcategory = "Harvest tools";
      }
    } else {
      subcategory = "General support";
    }
  }

  if (!intendedUse) {
    if (inventoryGroup === "Para sa Pananim") {
      intendedUse = resource.category === "Binhi" ? "Pagtatanim" : "Pagpapalago at Pagpapataba";
    } else if (inventoryGroup === "Proteksyon ng Pananim") {
      intendedUse = "Pagkontrol ng Peste at Sakit";
    } else if (inventoryGroup === "Patubig at Tubig") {
      intendedUse = "Pagdidilig at Patubig";
    } else if (inventoryGroup === "Pag-aani at Imbakan") {
      intendedUse = "Pag-aani at Pagproseso";
    } else if (inventoryGroup === "Serbisyo at Gawaing-Tao") {
      intendedUse = "Serbisyo sa Bukid";
    } else {
      intendedUse = "Pangkalahatang Suporta";
    }
  }

  return {
    inventoryGroup,
    subcategory,
    intendedUse,
  };
}

export function enrichResource(resource: Resource): Resource {
  return {
    ...resource,
    ...inferResourceMetadata(resource),
  };
}
