/// <reference types="vite/client" />
declare const GITHUB_RUNTIME_PERMANENT_NAME: string
declare const BASE_KV_SERVICE_URL: string

interface SparkKV {
  get<T = string>(key: string): Promise<T | null>;
  set<T = unknown>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  keys(prefix?: string): Promise<string[]>;
}

interface SparkRuntime {
  kv: SparkKV;
}

declare const spark: SparkRuntime;

interface Window {
  spark: SparkRuntime;
}