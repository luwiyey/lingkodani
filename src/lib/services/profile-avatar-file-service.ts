import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { isLiveMode } from "@/lib/config/app-mode";
import { getClientStorage } from "@/lib/firebase/storage-client";

const MAX_AVATAR_FILE_SIZE_BYTES = 8 * 1024 * 1024;

function sanitizeSegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Hindi mabasa ang napiling larawan."));
    };

    reader.onerror = () => {
      reject(new Error("Hindi mabasa ang napiling larawan."));
    };

    reader.readAsDataURL(file);
  });
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

  if (!isLiveMode) {
    return {
      url: await readFileAsDataUrl(file),
      storagePath: undefined,
    };
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "png";
  const storagePath = `${pathPrefix}/${Date.now()}-${sanitizeSegment(file.name)}.${extension}`;
  const storageRef = ref(getClientStorage(), storagePath);

  await uploadBytes(storageRef, file, {
    contentType: file.type || "image/png",
    customMetadata: {
      originalName: file.name,
    },
  });

  return {
    url: await getDownloadURL(storageRef),
    storagePath,
  };
}

export function uploadUserAvatarFile(file: File, userIdentifier: string) {
  const safeIdentifier = sanitizeSegment(userIdentifier) || "user";
  return uploadAvatarFile(file, `profile-avatars/users/${safeIdentifier}`);
}

export function uploadFarmerAvatarFile(file: File, farmerId: string) {
  const safeIdentifier = sanitizeSegment(farmerId) || "farmer";
  return uploadAvatarFile(file, `profile-avatars/farmers/${safeIdentifier}`);
}
