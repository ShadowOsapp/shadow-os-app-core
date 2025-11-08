/**
 * Storage Abstraction Layer
 *
 * Provides a unified interface for persistent storage
 * Can be implemented with different backends (memory, file, database, etc.)
 */

export interface StorageAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
}

/**
 * In-memory storage adapter (default)
 */
export class MemoryStorage implements StorageAdapter {
  private data: Map<string, any> = new Map();

  async get<T>(key: string): Promise<T | null> {
    const value = this.data.get(key);
    return value !== undefined ? (value as T) : null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.data.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.data.delete(key);
  }

  async has(key: string): Promise<boolean> {
    return this.data.has(key);
  }

  async clear(): Promise<void> {
    this.data.clear();
  }

  async keys(): Promise<string[]> {
    return Array.from(this.data.keys());
  }
}

/**
 * Storage manager with adapter pattern
 */
export class Storage {
  private adapter: StorageAdapter;

  constructor(adapter?: StorageAdapter) {
    this.adapter = adapter || new MemoryStorage();
  }

  /**
   * Set storage adapter
   */
  setAdapter(adapter: StorageAdapter): void {
    this.adapter = adapter;
  }

  /**
   * Get value from storage
   */
  async get<T>(key: string): Promise<T | null> {
    return this.adapter.get<T>(key);
  }

  /**
   * Set value in storage
   */
  async set<T>(key: string, value: T): Promise<void> {
    return this.adapter.set(key, value);
  }

  /**
   * Delete value from storage
   */
  async delete(key: string): Promise<void> {
    return this.adapter.delete(key);
  }

  /**
   * Check if key exists
   */
  async has(key: string): Promise<boolean> {
    return this.adapter.has(key);
  }

  /**
   * Clear all storage
   */
  async clear(): Promise<void> {
    return this.adapter.clear();
  }

  /**
   * Get all keys
   */
  async keys(): Promise<string[]> {
    return this.adapter.keys();
  }

  /**
   * Get multiple values
   */
  async getMany<T>(keys: string[]): Promise<Map<string, T | null>> {
    const result = new Map<string, T | null>();
    for (const key of keys) {
      result.set(key, await this.get<T>(key));
    }
    return result;
  }

  /**
   * Set multiple values
   */
  async setMany<T>(entries: Array<[string, T]>): Promise<void> {
    for (const [key, value] of entries) {
      await this.set(key, value);
    }
  }

  /**
   * Delete multiple keys
   */
  async deleteMany(keys: string[]): Promise<void> {
    for (const key of keys) {
      await this.delete(key);
    }
  }
}

/**
 * Create a namespaced storage
 */
export function createNamespacedStorage(
  storage: Storage,
  namespace: string
): Storage {
  const prefix = `${namespace}:`;

  return {
    async get<T>(key: string): Promise<T | null> {
      return storage.get<T>(`${prefix}${key}`);
    },
    async set<T>(key: string, value: T): Promise<void> {
      return storage.set(`${prefix}${key}`, value);
    },
    async delete(key: string): Promise<void> {
      return storage.delete(`${prefix}${key}`);
    },
    async has(key: string): Promise<boolean> {
      return storage.has(`${prefix}${key}`);
    },
    async clear(): Promise<void> {
      const keys = await storage.keys();
      const namespaceKeys = keys.filter((k) => k.startsWith(prefix));
      await storage.deleteMany(namespaceKeys);
    },
    async keys(): Promise<string[]> {
      const keys = await storage.keys();
      return keys
        .filter((k) => k.startsWith(prefix))
        .map((k) => k.slice(prefix.length));
    },
    setAdapter() {
      throw new Error("Cannot set adapter on namespaced storage");
    },
    async getMany<T>(keys: string[]): Promise<Map<string, T | null>> {
      const result = new Map<string, T | null>();
      for (const key of keys) {
        result.set(key, await this.get<T>(key));
      }
      return result;
    },
    async setMany<T>(entries: Array<[string, T]>): Promise<void> {
      for (const [key, value] of entries) {
        await this.set(key, value);
      }
    },
    async deleteMany(keys: string[]): Promise<void> {
      for (const key of keys) {
        await this.delete(key);
      }
    },
  } as Storage;
}

