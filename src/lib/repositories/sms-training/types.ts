import type { SmsTrainingExample } from "@/lib/types";

export interface SmsTrainingRepository {
  listTrainingExamples(): Promise<SmsTrainingExample[]>;
  createTrainingExample(example: SmsTrainingExample): Promise<SmsTrainingExample>;
  updateTrainingExample(id: string, updates: Partial<SmsTrainingExample>): Promise<SmsTrainingExample | null>;
}
