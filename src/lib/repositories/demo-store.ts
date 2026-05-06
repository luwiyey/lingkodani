type DemoStoreRegistry = typeof globalThis & {
  __lingkodAniDemoCollections?: Record<string, unknown[]>;
  __lingkodAniDemoSingletons?: Record<string, unknown>;
};

export const DEMO_COLLECTION_STORAGE_KEYS = [
  "farmers",
  "smsMessages",
  "resources",
  "marketPrices",
  "knowledgeArticles",
  "logbook",
  "auditLogs",
  "alertHistory",
  "assistanceRecords",
  "fieldVisitTasks",
  "smsTrainingExamples",
  "systemSettings",
  "users",
  "vouchers",
  "outboundMessages",
] as const;

type DemoCollectionStoreOptions<T> = {
  storageKey: string;
  initialData: T[];
  getId?: (item: T) => string;
};

type DemoSingletonStoreOptions<T> = {
  storageKey: string;
  initialData: T;
};

function getRegistry() {
  const registry = globalThis as DemoStoreRegistry;

  if (!registry.__lingkodAniDemoCollections) {
    registry.__lingkodAniDemoCollections = {};
  }

  if (!registry.__lingkodAniDemoSingletons) {
    registry.__lingkodAniDemoSingletons = {};
  }

  return registry;
}

function cloneDemoData<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

function getBrowserStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function emitDemoSessionChange() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event("demo-session-change"));
}

function readCollectionFromStorage<T>(storageKey: string) {
  const storage = getBrowserStorage();

  if (!storage) {
    return null;
  }

  try {
    const raw = storage.getItem(storageKey);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as T[];
  } catch {
    return null;
  }
}

function writeCollectionToStorage<T>(storageKey: string, items: T[]) {
  const storage = getBrowserStorage();

  if (!storage) {
    return;
  }

  storage.setItem(storageKey, JSON.stringify(items));
}

function readSingletonFromStorage<T>(storageKey: string) {
  const storage = getBrowserStorage();

  if (!storage) {
    return null;
  }

  try {
    const raw = storage.getItem(storageKey);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeSingletonToStorage<T>(storageKey: string, value: T) {
  const storage = getBrowserStorage();

  if (!storage) {
    return;
  }

  storage.setItem(storageKey, JSON.stringify(value));
}

export function clearDemoStoreCaches(storageKeys?: string[]) {
  const registry = getRegistry();

  if (!storageKeys || storageKeys.length === 0) {
    registry.__lingkodAniDemoCollections = {};
    registry.__lingkodAniDemoSingletons = {};
    emitDemoSessionChange();
    return;
  }

  for (const storageKey of storageKeys) {
    delete registry.__lingkodAniDemoCollections?.[storageKey];
    delete registry.__lingkodAniDemoSingletons?.[storageKey];
  }

  emitDemoSessionChange();
}

export function clearDemoStoreData(
  storageKeys: readonly string[] = DEMO_COLLECTION_STORAGE_KEYS
) {
  const storage = getBrowserStorage();

  if (storage) {
    for (const storageKey of storageKeys) {
      storage.removeItem(storageKey);
    }
  }

  clearDemoStoreCaches([...storageKeys]);
}

export function createDemoCollectionStore<T>(
  options: DemoCollectionStoreOptions<T>
) {
  const { storageKey, initialData, getId } = options;
  const resolveId = (item: T) => {
    if (getId) {
      return getId(item);
    }

    return (item as { id: string }).id;
  };

  function getItems() {
    const registry = getRegistry();
    const storedItems = readCollectionFromStorage<T>(storageKey);

    if (storedItems) {
      registry.__lingkodAniDemoCollections![storageKey] = cloneDemoData(storedItems);
      return cloneDemoData(storedItems);
    }

    const cachedItems = registry.__lingkodAniDemoCollections?.[storageKey];

    if (cachedItems) {
      return cloneDemoData(cachedItems as T[]);
    }

    const seededItems = cloneDemoData(initialData);
    registry.__lingkodAniDemoCollections![storageKey] = cloneDemoData(seededItems);
    writeCollectionToStorage(storageKey, seededItems);
    return seededItems;
  }

  function persist(items: T[]) {
    const nextItems = cloneDemoData(items);
    const registry = getRegistry();
    registry.__lingkodAniDemoCollections![storageKey] = cloneDemoData(nextItems);
    writeCollectionToStorage(storageKey, nextItems);
    emitDemoSessionChange();
    return cloneDemoData(nextItems);
  }

  return {
    list() {
      return getItems();
    },
    prepend(item: T) {
      persist([item, ...getItems()]);
      return cloneDemoData(item);
    },
    append(item: T) {
      persist([...getItems(), item]);
      return cloneDemoData(item);
    },
    updateById(id: string, updates: Partial<T>) {
      const items = getItems();
      const index = items.findIndex((item) => resolveId(item) === id);

      if (index === -1) {
        return null;
      }

      const nextItem = {
        ...items[index],
        ...updates,
      };

      items[index] = nextItem;
      persist(items);
      return cloneDemoData(nextItem);
    },
    replaceAll(items: T[]) {
      return persist(items);
    },
    deleteById(id: string) {
      const items = getItems();
      const nextItems = items.filter((item) => resolveId(item) !== id);
      persist(nextItems);
    },
    find(predicate: (item: T) => boolean) {
      const found = getItems().find(predicate);
      return found ? cloneDemoData(found) : null;
    },
  };
}

export function createDemoSingletonStore<T>(
  options: DemoSingletonStoreOptions<T>
) {
  const { storageKey, initialData } = options;

  function getValue() {
    const registry = getRegistry();
    const storedValue = readSingletonFromStorage<T>(storageKey);

    if (storedValue) {
      registry.__lingkodAniDemoSingletons![storageKey] = cloneDemoData(storedValue);
      return cloneDemoData(storedValue);
    }

    const cachedValue = registry.__lingkodAniDemoSingletons?.[storageKey];

    if (cachedValue) {
      return cloneDemoData(cachedValue as T);
    }

    const seededValue = cloneDemoData(initialData);
    registry.__lingkodAniDemoSingletons![storageKey] = cloneDemoData(seededValue);
    writeSingletonToStorage(storageKey, seededValue);
    return seededValue;
  }

  function persist(value: T) {
    const nextValue = cloneDemoData(value);
    const registry = getRegistry();
    registry.__lingkodAniDemoSingletons![storageKey] = cloneDemoData(nextValue);
    writeSingletonToStorage(storageKey, nextValue);
    emitDemoSessionChange();
    return cloneDemoData(nextValue);
  }

  return {
    get() {
      return getValue();
    },
    set(value: T) {
      return persist(value);
    },
  };
}
