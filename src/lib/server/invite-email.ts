type InviteEmailProvider = "resend" | "none";

type InviteEmailConfig =
  | {
      configured: true;
      provider: "resend";
      from: string;
    }
  | {
      configured: false;
      provider: "none";
      reason: string;
    };

type SendProvisioningInviteInput = {
  email: string;
  name: string;
  setupLink: string;
};

export type SendProvisioningInviteResult = {
  configured: boolean;
  sent: boolean;
  provider: InviteEmailProvider;
  messageId?: string;
  error?: string;
};

function isPresent(value: string | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

export function resolveInviteEmailConfig(
  env: NodeJS.ProcessEnv = process.env
): InviteEmailConfig {
  const resendApiKey = env.RESEND_API_KEY?.trim();
  const from = (env.INVITE_EMAIL_FROM ?? env.RESEND_FROM_EMAIL)?.trim();

  if (isPresent(resendApiKey) && isPresent(from)) {
    return {
      configured: true,
      provider: "resend",
      from: from!,
    };
  }

  return {
    configured: false,
    provider: "none",
    reason:
      "Mag-set ng RESEND_API_KEY at INVITE_EMAIL_FROM para awtomatikong ma-email ang secure setup link sa bagong staff accounts.",
  };
}

function buildInviteEmailText(input: SendProvisioningInviteInput) {
  return [
    `Magandang araw po, ${input.name}.`,
    "",
    "Na-set up na po ang inyong Lingkod-Ani staff account.",
    "Paki-click po ang secure setup link sa ibaba upang makapagtakda ng inyong password at makapasok sa dashboard:",
    input.setupLink,
    "",
    "Kung hindi po kayo ang inaasahang tatanggap ng email na ito, huwag po itong gamitin at ipaalam agad sa inyong barangay administrator o developer.",
    "",
    "Maraming salamat po,",
    "Lingkod-Ani",
  ].join("\n");
}

function buildInviteEmailHtml(input: SendProvisioningInviteInput) {
  const escapedName = input.name
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
  const escapedLink = input.setupLink
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;");

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
      <p>Magandang araw po, <strong>${escapedName}</strong>.</p>
      <p>Na-set up na po ang inyong <strong>Lingkod-Ani</strong> staff account.</p>
      <p>Paki-click po ang secure setup link sa ibaba upang makapagtakda ng inyong password at makapasok sa dashboard:</p>
      <p style="margin: 24px 0;">
        <a
          href="${escapedLink}"
          style="display: inline-block; padding: 12px 20px; border-radius: 10px; background: #166534; color: #ffffff; text-decoration: none; font-weight: 600;"
        >
          Itakda ang Password
        </a>
      </p>
      <p style="word-break: break-all; color: #4b5563;">Kung hindi gumana ang button, buksan po ang link na ito: ${escapedLink}</p>
      <p>Kung hindi po kayo ang inaasahang tatanggap ng email na ito, huwag po itong gamitin at ipaalam agad sa inyong barangay administrator o developer.</p>
      <p>Maraming salamat po,<br />Lingkod-Ani</p>
    </div>
  `.trim();
}

export async function sendProvisioningInviteEmail(
  input: SendProvisioningInviteInput
): Promise<SendProvisioningInviteResult> {
  const config = resolveInviteEmailConfig(process.env);

  if (!config.configured) {
    return {
      configured: false,
      sent: false,
      provider: config.provider,
      error: config.reason,
    };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY?.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: config.from,
        to: [input.email],
        subject: "Lingkod-Ani Account Setup",
        text: buildInviteEmailText(input),
        html: buildInviteEmailHtml(input),
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
      error?: { message?: string };
    };

    if (!response.ok) {
      return {
        configured: true,
        sent: false,
        provider: config.provider,
        error:
          payload.error?.message ??
          payload.message ??
          "Hindi naipadala ang invite email sa provider.",
      };
    }

    return {
      configured: true,
      sent: true,
      provider: config.provider,
      messageId: payload.id,
    };
  } catch (error) {
    return {
      configured: true,
      sent: false,
      provider: config.provider,
      error:
        error instanceof Error
          ? error.message
          : "Hindi naipadala ang invite email sa provider.",
    };
  }
}
