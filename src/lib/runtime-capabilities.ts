export type RuntimeCapabilities = {
  mode: "demo" | "live";
  aiConfigured: boolean;
  realSmsEnabled: boolean;
  liveSmsConfigured: boolean;
  liveSmsTestModeEnabled: boolean;
  inviteEmailConfigured: boolean;
  mobilePushConfigured: boolean;
  firebaseAdminConfigured: boolean;
  storageUploadConfigured: boolean;
  knowledgeAudioUploadConfigured: boolean;
  superadminProvisioningEnabled: boolean;
  appVersion?: string;
  buildCommit?: string;
  automationMode?: string;
  knownBuildWarnings: string[];
  reasons: {
    ai?: string;
    liveSms?: string;
    liveSmsTestMode?: string;
    inviteEmail?: string;
    mobilePush?: string;
    storageUpload?: string;
    knowledgeAudio?: string;
    superadminProvisioning?: string;
  };
};

function readMode(): "demo" | "live" {
  const raw = process.env.NEXT_PUBLIC_APP_MODE ?? process.env.APP_MODE ?? "demo";
  return raw === "live" ? "live" : "demo";
}

function readRealSmsEnabled() {
  return (process.env.NEXT_PUBLIC_ENABLE_REAL_SMS ?? process.env.ENABLE_REAL_SMS ?? "false") === "true";
}

function readSuperadminProvisioningEnabled() {
  return (process.env.ALLOW_DEVELOPER_ACCOUNT_PROVISIONING ?? "false") === "true";
}

export function getFallbackRuntimeCapabilities(): RuntimeCapabilities {
  const mode = readMode();
  const realSmsEnabled = readRealSmsEnabled();
  const superadminProvisioningEnabled = readSuperadminProvisioningEnabled();
  const liveSmsConfigured = mode !== "live" || !realSmsEnabled;
  const storageUploadConfigured = mode !== "live";
  const knowledgeAudioUploadConfigured = storageUploadConfigured;

  return {
    mode,
    aiConfigured: false,
    realSmsEnabled,
    liveSmsConfigured,
    liveSmsTestModeEnabled: false,
    inviteEmailConfigured: false,
    mobilePushConfigured: false,
    firebaseAdminConfigured: false,
    storageUploadConfigured,
    knowledgeAudioUploadConfigured,
    superadminProvisioningEnabled,
    appVersion: "0.1.0",
    buildCommit: "local",
    automationMode: mode === "live" ? "manual or scheduled background checks" : "demo/manual",
    knownBuildWarnings: [
      "Maaaring lumabas pa rin ang non-blocking Genkit/OpenTelemetry build warning. Kung successful ang build at gumagana ang AI routes, puwedeng magpatuloy ang deployment.",
    ],
    reasons: {
      ai: "Naka-lock muna ang AI feature habang hindi pa confirmed ang Gemini/Genkit credentials sa server. Kahit configured na ito, kailangan pa ring bantayan ang runtime fallback at latency.",
      liveSms: liveSmsConfigured
        ? undefined
        : "Naka-lock muna ang live SMS actions habang hindi pa kumpleto ang SMS provider configuration.",
      liveSmsTestMode:
        "Ang live SMS preview/testing route ay naka-lock by default at dapat lang buksan sa controlled superadmin smoke tests.",
      inviteEmail:
        "Naka-manual link fallback pa ang bagong staff provisioning habang wala pang configured invite email delivery provider.",
      mobilePush:
        "Kailangan muna ang Firebase Admin credentials at Android Firebase app ID bago maging live ang mobile push notifications.",
      storageUpload: storageUploadConfigured
        ? undefined
        : "Naka-lock muna ang file upload habang hindi pa kumpleto ang live Firebase storage setup.",
      knowledgeAudio: knowledgeAudioUploadConfigured
        ? undefined
        : "Naka-lock muna ang audio upload habang hindi pa kumpleto ang live Firebase storage setup.",
      superadminProvisioning: superadminProvisioningEnabled
        ? "Puwedeng gumawa ng live superadmin accounts mula sa secure provisioning flow ng dashboard."
        : "Naka-lock muna ang live superadmin provisioning sa dashboard. Ang privileged superadmin accounts ay kailangang i-set up direkta sa secure Firebase/Auth at user-profile admin flow.",
    },
  };
}
