import { isDemoMode } from "@/lib/config/app-mode";
import { liveSmsProvider } from "@/lib/providers/sms/live-sms-provider";
import { mockSmsProvider } from "@/lib/providers/sms/mock-sms-provider";

export const smsProvider = isDemoMode ? mockSmsProvider : liveSmsProvider;
