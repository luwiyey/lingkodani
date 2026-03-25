import { resolveInviteEmailConfig, sendProvisioningInviteEmail } from "@/lib/server/invite-email";

describe("invite email configuration", () => {
  it("reports manual fallback when resend env is missing", async () => {
    const originalApiKey = process.env.RESEND_API_KEY;
    const originalFrom = process.env.INVITE_EMAIL_FROM;
    try {
      process.env.RESEND_API_KEY = "";
      process.env.INVITE_EMAIL_FROM = "";

      const env = process.env as NodeJS.ProcessEnv;

      const config = resolveInviteEmailConfig(env);

      expect(config.configured).toBe(false);
      expect(config.provider).toBe("none");

      const result = await sendProvisioningInviteEmail({
        email: "staff@example.com",
        name: "Barangay Staff",
        setupLink: "https://lingkod-ani.com/reset-password/verify?email=staff@example.com",
      });

      expect(result.sent).toBe(false);
      expect(result.provider).toBe("none");
    } finally {
      process.env.RESEND_API_KEY = originalApiKey;
      process.env.INVITE_EMAIL_FROM = originalFrom;
    }
  });

  it("detects resend invite email readiness when env is complete", () => {
    const env = {
      NODE_ENV: "test",
      RESEND_API_KEY: "re_test_key",
      INVITE_EMAIL_FROM: "Lingkod-Ani <noreply@example.com>",
    } as unknown as NodeJS.ProcessEnv;

    const config = resolveInviteEmailConfig(env);

    expect(config).toEqual({
      configured: true,
      provider: "resend",
      from: "Lingkod-Ani <noreply@example.com>",
    });
  });
});
