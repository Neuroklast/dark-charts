type StorageValue = unknown

const safeParse = <T>(value: string | null): T | null => {
  if (value === null) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

function getLocalStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  return window.localStorage
}

export const asyncStorage = {
  async get<T = StorageValue>(key: string): Promise<T | null> {
    const storage = getLocalStorage()
    if (!storage) return null
    return safeParse<T>(storage.getItem(key))
  },

  async set<T = StorageValue>(key: string, value: T): Promise<void> {
    const storage = getLocalStorage()
    if (!storage) return
    storage.setItem(key, JSON.stringify(value))
  },

  async put<T = StorageValue>(key: string, value: T): Promise<void> {
    await this.set(key, value)
  },

  async delete(key: string): Promise<void> {
    getLocalStorage()?.removeItem(key)
  },

  async keys(prefix?: string): Promise<string[]> {
    const storage = getLocalStorage()
    if (!storage) return []
    const allKeys: string[] = []
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i)
      if (key && (!prefix || key.startsWith(prefix))) {
        allKeys.push(key)
      }
    }
    return allKeys
  },
}
