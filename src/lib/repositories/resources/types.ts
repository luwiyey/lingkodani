import type { Resource } from "@/lib/types";

export interface ResourceRepository {
  listResources(): Promise<Resource[]>;
  createResource(resource: Resource): Promise<Resource>;
  updateResource(id: string, updates: Partial<Resource>): Promise<Resource | null>;
  deleteResource(id: string): Promise<void>;
}
