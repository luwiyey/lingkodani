import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { isLiveMode } from "@/lib/config/app-mode";
import { getClientStorage } from "@/lib/firebase/storage-client";
import type { FarmerEvidenceType } from "@/lib/types";

const MAX_DOCUMENT_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const MAX_IMAGE_FILE_SIZE_BYTES = 12 * 1024 * 1024;
const MAX_AUDIO_FILE_SIZE_BYTES = 20 * 1024 * 1024;

function sanitizeSegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function getFileExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName) {
    return fromName;
  }

  const mimeSubtype = file.type.split("/")[1]?.toLowerCase();
  return mimeSubtype || "file";
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Hindi mabasa ang napiling file."));
    };

    reader.onerror = () => {
      reject(new Error("Hindi mabasa ang napiling file."));
    };

    reader.readAsDataURL(file);
  });
}

function validateFile(file: File, type: FarmerEvidenceType) {
  if (type === "field_photo" && !file.type.startsWith("image/")) {
    throw new Error("Larawan lang ang puwedeng i-upload sa field photo evidence.");
  }

  if (type === "audio" && !file.type.startsWith("audio/")) {
    throw new Error("Audio file lang ang puwedeng i-upload sa audio evidence.");
  }

  if (type === "field_photo" && file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
    throw new Error("Masyadong malaki ang larawan. Panatilihin ito sa 12MB o mas mababa.");
  }

  if (type === "audio" && file.size > MAX_AUDIO_FILE_SIZE_BYTES) {
    throw new Error("Masyadong malaki ang audio file. Panatilihin ito sa 20MB o mas mababa.");
  }

  if (type === "document" && file.size > MAX_DOCUMENT_FILE_SIZE_BYTES) {
    throw new Error("Masyadong malaki ang dokumento. Panatilihin ito sa 20MB o mas mababa.");
  }
}

export async function uploadFarmerEvidenceFile(input: {
  file: File;
  farmerId: string;
  type: FarmerEvidenceType;
  title: string;
}) {
  const { file, farmerId, type, title } = input;
  validateFile(file, type);

  if (!isLiveMode) {
    return {
      url: await readFileAsDataUrl(file),
      storagePath: undefined,
    };
  }

  const storage = getClientStorage();
  const safeFarmerId = sanitizeSegment(farmerId) || "farmer";
  const safeTitle = sanitizeSegment(title) || "evidence";
  const extension = getFileExtension(file);
  const folder = type === "field_photo" ? "field-photos" : type === "audio" ? "audio" : "documents";
  const storagePath = `farmer-evidence/${safeFarmerId}/${folder}/${Date.now()}-${safeTitle}.${extension}`;
  const storageRef = ref(storage, storagePath);

  await uploadBytes(storageRef, file, {
    contentType: file.type || "application/octet-stream",
    customMetadata: {
      farmerId,
      evidenceType: type,
      title,
      originalName: file.name,
    },
  });

  return {
    url: await getDownloadURL(storageRef),
    storagePath,
  };
}
