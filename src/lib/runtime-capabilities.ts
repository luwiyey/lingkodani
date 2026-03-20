export type RuntimeCapabilities = {
  mode: "demo" | "live";
  aiConfigured: boolean;
  realSmsEnabled: boolean;
  liveSmsConfigured: boolean;
  firebaseAdminConfigured: boolean;
  storageUploadConfigured: boolean;
  knowledgeAudioUploadConfigured: boolean;
  reasons: {
    ai?: string;
    liveSms?: string;
    storageUpload?: string;
    knowledgeAudio?: string;
  };
};

function readMode(): "demo" | "live" {
  const raw = process.env.NEXT_PUBLIC_APP_MODE ?? process.env.APP_MODE ?? "demo";
  return raw === "live" ? "live" : "demo";
}

function readRealSmsEnabled() {
  return (process.env.NEXT_PUBLIC_ENABLE_REAL_SMS ?? process.env.ENABLE_REAL_SMS ?? "false") === "true";
}

export function getFallbackRuntimeCapabilities(): RuntimeCapabilities {
  const mode = readMode();
  const realSmsEnabled = readRealSmsEnabled();
  const liveSmsConfigured = mode !== "live" || !realSmsEnabled;
  const storageUploadConfigured = mode !== "live";
  const knowledgeAudioUploadConfigured = storageUploadConfigured;

  return {
    mode,
    aiConfigured: false,
    realSmsEnabled,
    liveSmsConfigured,
    firebaseAdminConfigured: false,
    storageUploadConfigured,
    knowledgeAudioUploadConfigured,
    reasons: {
      ai: "Naka-lock muna ang AI feature habang hindi pa confirmed ang Gemini/Genkit service sa server.",
      liveSms: liveSmsConfigured
        ? undefined
        : "Naka-lock muna ang live SMS actions habang hindi pa kumpleto ang SMS provider configuration.",
      storageUpload: storageUploadConfigured
        ? undefined
        : "Naka-lock muna ang file upload habang hindi pa kumpleto ang live Firebase storage setup.",
      knowledgeAudio: knowledgeAudioUploadConfigured
        ? undefined
        : "Naka-lock muna ang audio upload habang hindi pa kumpleto ang live Firebase storage setup.",
    },
  };
}
