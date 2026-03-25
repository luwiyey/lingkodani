export function isLiveSmsTestModeEnabled(env: NodeJS.ProcessEnv = process.env) {
  return (env.ENABLE_LIVE_SMS_TEST_MODE ?? env.NEXT_PUBLIC_ENABLE_LIVE_SMS_TEST_MODE ?? "false") === "true";
}
