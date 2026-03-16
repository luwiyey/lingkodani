import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { isLiveMode } from "@/lib/config/app-mode";
import { getClientStorage } from "@/lib/firebase/storage-client";

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

  if (file.type === "audio/mpeg") {
    return "mp3";
  }

  if (file.type === "audio/wav" || file.type === "audio/x-wav") {
    return "wav";
  }

  if (file.type === "audio/mp4" || file.type === "audio/aac") {
    return "m4a";
  }

  return "audio";
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Hindi mabasa ang audio file."));
    };

    reader.onerror = () => {
      reject(new Error("Hindi mabasa ang audio file."));
    };

    reader.readAsDataURL(file);
  });
}

export async function uploadKnowledgeAudioFile(file: File, articleTitle: string) {
  if (!file.type.startsWith("audio/")) {
    throw new Error("Audio files lamang ang puwedeng i-upload sa knowledge audio entries.");
  }

  if (file.size > MAX_AUDIO_FILE_SIZE_BYTES) {
    throw new Error("Masyadong malaki ang audio file. Panatilihin ito sa 20MB o mas mababa.");
  }

  if (!isLiveMode) {
    return readFileAsDataUrl(file);
  }

  const storage = getClientStorage();
  const safeTitle = sanitizeSegment(articleTitle) || "knowledge-audio";
  const extension = getFileExtension(file);
  const storagePath = `knowledge-base/audio/${Date.now()}-${safeTitle}.${extension}`;
  const storageRef = ref(storage, storagePath);

  await uploadBytes(storageRef, file, {
    contentType: file.type,
    customMetadata: {
      articleTitle,
      originalName: file.name,
    },
  });

  return getDownloadURL(storageRef);
}
