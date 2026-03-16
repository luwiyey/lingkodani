const { existsSync, readFileSync } = require("node:fs");

const firebaseAdminCredentialHelpText =
  "Firebase Admin credentials are missing. Set FIREBASE_ADMIN_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY, or FIREBASE_SERVICE_ACCOUNT_JSON, or FIREBASE_ADMIN_CREDENTIALS_PATH, or GOOGLE_APPLICATION_CREDENTIALS.";

function normalizeServiceAccount(value) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const projectId =
    typeof value.projectId === "string"
      ? value.projectId
      : typeof value.project_id === "string"
        ? value.project_id
        : null;
  const clientEmail =
    typeof value.clientEmail === "string"
      ? value.clientEmail
      : typeof value.client_email === "string"
        ? value.client_email
        : null;
  const privateKey =
    typeof value.privateKey === "string"
      ? value.privateKey
      : typeof value.private_key === "string"
        ? value.private_key
        : null;

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return {
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, "\n"),
  };
}

function parseServiceAccountJson(rawJson) {
  if (!rawJson) {
    return null;
  }

  try {
    return normalizeServiceAccount(JSON.parse(rawJson));
  } catch (error) {
    console.warn("Failed to parse Firebase service account JSON from environment.", error);
    return null;
  }
}

function readServiceAccountFile(credentialsPath) {
  if (!credentialsPath || !existsSync(credentialsPath)) {
    return null;
  }

  try {
    const rawFile = readFileSync(credentialsPath, "utf8");
    return normalizeServiceAccount(JSON.parse(rawFile));
  } catch (error) {
    console.warn(`Failed to read Firebase service account file at ${credentialsPath}.`, error);
    return null;
  }
}

function resolveFirebaseAdminCredentials(env = process.env) {
  const projectId = env.FIREBASE_ADMIN_PROJECT_ID ?? env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? null;
  const clientEmail = env.FIREBASE_CLIENT_EMAIL ?? null;
  const privateKey = env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n") ?? null;

  if (projectId && clientEmail && privateKey) {
    return {
      kind: "cert",
      source: "env",
      projectId,
      serviceAccount: {
        projectId,
        clientEmail,
        privateKey,
      },
    };
  }

  const inlineJsonServiceAccount = parseServiceAccountJson(env.FIREBASE_SERVICE_ACCOUNT_JSON);

  if (inlineJsonServiceAccount) {
    return {
      kind: "cert",
      source: "FIREBASE_SERVICE_ACCOUNT_JSON",
      projectId: inlineJsonServiceAccount.projectId,
      serviceAccount: inlineJsonServiceAccount,
    };
  }

  const adminCredentialsPath = env.FIREBASE_ADMIN_CREDENTIALS_PATH ?? null;
  const googleApplicationCredentialsPath = env.GOOGLE_APPLICATION_CREDENTIALS ?? null;
  const serviceAccountFromFile =
    readServiceAccountFile(adminCredentialsPath) ??
    readServiceAccountFile(googleApplicationCredentialsPath);

  if (serviceAccountFromFile) {
    return {
      kind: "cert",
      source: adminCredentialsPath
        ? "FIREBASE_ADMIN_CREDENTIALS_PATH"
        : "GOOGLE_APPLICATION_CREDENTIALS",
      projectId: serviceAccountFromFile.projectId,
      serviceAccount: serviceAccountFromFile,
    };
  }

  if (env.FIREBASE_USE_APPLICATION_DEFAULT === "true") {
    return {
      kind: "applicationDefault",
      source: "FIREBASE_USE_APPLICATION_DEFAULT",
      projectId,
    };
  }

  return null;
}

module.exports = {
  firebaseAdminCredentialHelpText,
  resolveFirebaseAdminCredentials,
};
