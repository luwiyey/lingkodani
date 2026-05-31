import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { isLiveMode } from "@/lib/config/app-mode";
import { getClientStorage } from "@/lib/firebase/storage-client";
import { hasActiveDemoPreview } from "@/lib/runtime-mode";

const MAX_AVATAR_FILE_SIZE_BYTES = 8 * 1024 * 1024;
const MAX_INLINE_AVATAR_DATA_URL_LENGTH = 900_000;
const INLINE_AVATAR_MAX_DIMENSION = 256;
const INLINE_AVATAR_QUALITIES = [0.82, 0.72, 0.62, 0.52, 0.42];
const STORAGE_UPLOAD_TIMEOUT_MS = 8_000;

function sanitizeSegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);

    promise.then(
      (value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timeoutId);
        reject(error);
      }
    );
  });
}

function loadImageFromFile(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Hindi mabasa ang napiling larawan."));
    };

    image.src = objectUrl;
  });
}

async function buildInlineAvatarDataUrl(file: File) {
  const image = await loadImageFromFile(file);
  const longestEdge = Math.max(image.width, image.height, 1);
  const scale = Math.min(1, INLINE_AVATAR_MAX_DIMENSION / longestEdge);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Hindi maihanda ang napiling larawan para sa profile.");
  }

  context.drawImage(image, 0, 0, width, height);

  for (const quality of INLINE_AVATAR_QUALITIES) {
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    if (dataUrl.length <= MAX_INLINE_AVATAR_DATA_URL_LENGTH) {
      return dataUrl;
    }
  }

  throw new Error("Masyadong malaki ang larawan para sa inline profile fallback. Gumamit ng mas maliit na image file.");
}

function validateAvatarFile(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Larawan lamang ang puwedeng gamitin bilang avatar.");
  }

  if (file.size > MAX_AVATAR_FILE_SIZE_BYTES) {
    throw new Error("Masyadong malaki ang avatar file. Panatilihin ito sa 8MB o mas mababa.");
  }
}

async function uploadAvatarFile(file: File, pathPrefix: string) {
  validateAvatarFile(file);

  if (!isLiveMode || hasActiveDemoPreview()) {
    return {
      url: await buildInlineAvatarDataUrl(file),
      storagePath: undefined,
    };
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "png";
  const storagePath = `${pathPrefix}/${Date.now()}-${sanitizeSegment(file.name)}.${extension}`;
  try {
    const storageRef = ref(getClientStorage(), storagePath);

    await withTimeout(
      uploadBytes(storageRef, file, {
        contentType: file.type || "image/png",
        customMetadata: {
          originalName: file.name,
        },
      }),
      STORAGE_UPLOAD_TIMEOUT_MS,
      "Timed out while waiting for Firebase Storage."
    );

    return {
      url: await withTimeout(
        getDownloadURL(storageRef),
        STORAGE_UPLOAD_TIMEOUT_MS,
        "Timed out while waiting for Firebase Storage download URL."
      ),
      storagePath,
    };
  } catch (error) {
    console.warn("Falling back to inline avatar storage because Firebase Storage is unavailable.", error);
    return {
      url: await buildInlineAvatarDataUrl(file),
      storagePath: undefined,
    };
  }
}

export function uploadUserAvatarFile(file: File, userIdentifier: string) {
  const safeIdentifier = sanitizeSegment(userIdentifier) || "user";
  return uploadAvatarFile(file, `profile-avatars/users/${safeIdentifier}`);
}

export function uploadFarmerAvatarFile(file: File, farmerId: string) {
  const safeIdentifier = sanitizeSegment(farmerId) || "farmer";
  return uploadAvatarFile(file, `profile-avatars/farmers/${safeIdentifier}`);
}
