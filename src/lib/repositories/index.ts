import { isDemoRuntimeActive } from "@/lib/runtime-mode";
import { demoAuditRepository } from "@/lib/repositories/audit/demo-audit-repository";
import { liveAuditRepository } from "@/lib/repositories/audit/live-audit-repository";
import { demoAlertHistoryRepository } from "@/lib/repositories/alert-history/demo-alert-history-repository";
import { liveAlertHistoryRepository } from "@/lib/repositories/alert-history/live-alert-history-repository";
import { demoAssistanceRepository } from "@/lib/repositories/assistance/demo-assistance-repository";
import { liveAssistanceRepository } from "@/lib/repositories/assistance/live-assistance-repository";
import { demoFarmerRepository } from "@/lib/repositories/farmers/demo-farmer-repository";
import { liveFarmerRepository } from "@/lib/repositories/farmers/live-farmer-repository";
import { demoFieldVisitRepository } from "@/lib/repositories/field-visits/demo-field-visit-repository";
import { liveFieldVisitRepository } from "@/lib/repositories/field-visits/live-field-visit-repository";
import { demoKnowledgeRepository } from "@/lib/repositories/knowledge/demo-knowledge-repository";
import { liveKnowledgeRepository } from "@/lib/repositories/knowledge/live-knowledge-repository";
import { demoLogbookRepository } from "@/lib/repositories/logbook/demo-logbook-repository";
import { liveLogbookRepository } from "@/lib/repositories/logbook/live-logbook-repository";
import { demoMarketPriceRepository } from "@/lib/repositories/market-prices/demo-market-price-repository";
import { liveMarketPriceRepository } from "@/lib/repositories/market-prices/live-market-price-repository";
import { demoOutboundRepository } from "@/lib/repositories/outbound/demo-outbound-repository";
import { liveOutboundRepository } from "@/lib/repositories/outbound/live-outbound-repository";
import { demoResourceRepository } from "@/lib/repositories/resources/demo-resource-repository";
import { liveResourceRepository } from "@/lib/repositories/resources/live-resource-repository";
import { demoSmsRepository } from "@/lib/repositories/sms/demo-sms-repository";
import { liveSmsRepository } from "@/lib/repositories/sms/live-sms-repository";
import { demoSmsTrainingRepository } from "@/lib/repositories/sms-training/demo-sms-training-repository";
import { liveSmsTrainingRepository } from "@/lib/repositories/sms-training/live-sms-training-repository";
import { demoSystemSettingsRepository } from "@/lib/repositories/system-settings/demo-system-settings-repository";
import { liveSystemSettingsRepository } from "@/lib/repositories/system-settings/live-system-settings-repository";
import { demoUserRepository } from "@/lib/repositories/users/demo-user-repository";
import { liveUserRepository } from "@/lib/repositories/users/live-user-repository";
import { demoVoucherRepository } from "@/lib/repositories/vouchers/demo-voucher-repository";
import { liveVoucherRepository } from "@/lib/repositories/vouchers/live-voucher-repository";

function resolveRuntimeRepository<T extends object>(demoRepository: T, liveRepository: T) {
  return isDemoRuntimeActive() ? demoRepository : liveRepository;
}

function createRuntimeRepositoryProxy<T extends object>(demoRepository: T, liveRepository: T): T {
  return new Proxy({} as T, {
    get(_target, property) {
      const repository = resolveRuntimeRepository(demoRepository, liveRepository) as Record<PropertyKey, unknown>;
      const value = repository[property];
      return typeof value === "function" ? value.bind(repository) : value;
    },
  });
}

export const smsRepository = createRuntimeRepositoryProxy(demoSmsRepository, liveSmsRepository);
export const smsTrainingRepository = createRuntimeRepositoryProxy(demoSmsTrainingRepository, liveSmsTrainingRepository);
export const farmerRepository = createRuntimeRepositoryProxy(demoFarmerRepository, liveFarmerRepository);
export const auditRepository = createRuntimeRepositoryProxy(demoAuditRepository, liveAuditRepository);
export const alertHistoryRepository = createRuntimeRepositoryProxy(demoAlertHistoryRepository, liveAlertHistoryRepository);
export const assistanceRepository = createRuntimeRepositoryProxy(demoAssistanceRepository, liveAssistanceRepository);
export const fieldVisitRepository = createRuntimeRepositoryProxy(demoFieldVisitRepository, liveFieldVisitRepository);
export const knowledgeRepository = createRuntimeRepositoryProxy(demoKnowledgeRepository, liveKnowledgeRepository);
export const logbookRepository = createRuntimeRepositoryProxy(demoLogbookRepository, liveLogbookRepository);
export const marketPriceRepository = createRuntimeRepositoryProxy(demoMarketPriceRepository, liveMarketPriceRepository);
export const outboundMessageRepository = createRuntimeRepositoryProxy(demoOutboundRepository, liveOutboundRepository);
export const resourceRepository = createRuntimeRepositoryProxy(demoResourceRepository, liveResourceRepository);
export const voucherRepository = createRuntimeRepositoryProxy(demoVoucherRepository, liveVoucherRepository);
export const systemSettingsRepository = createRuntimeRepositoryProxy(demoSystemSettingsRepository, liveSystemSettingsRepository);
export const userRepository = createRuntimeRepositoryProxy(demoUserRepository, liveUserRepository);
