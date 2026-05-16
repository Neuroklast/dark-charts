type StorageValue = unknown

const safeParse = <T>(value: string | null): T | null => {
  if (value === null) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

export const asyncStorage = {
  async get<T = StorageValue>(key: string): Promise<T | null> {
    return safeParse<T>(localStorage.getItem(key))
  },

  async set<T = StorageValue>(key: string, value: T): Promise<void> {
    localStorage.setItem(key, JSON.stringify(value))
  },

  async put<T = StorageValue>(key: string, value: T): Promise<void> {
    await this.set(key, value)
  },

  async delete(key: string): Promise<void> {
    localStorage.removeItem(key)
  },

  async keys(prefix?: string): Promise<string[]> {
    const allKeys: string[] = []
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)
      if (key && (!prefix || key.startsWith(prefix))) {
        allKeys.push(key)
      }
    }
    return allKeys
  },
}
