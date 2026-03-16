import type { FieldVisitTask } from "@/lib/types";

export interface FieldVisitRepository {
  listFieldVisitTasks(): Promise<FieldVisitTask[]>;
  createFieldVisitTask(task: FieldVisitTask): Promise<FieldVisitTask>;
  updateFieldVisitTask(id: string, updates: Partial<FieldVisitTask>): Promise<FieldVisitTask | null>;
}
