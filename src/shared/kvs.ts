export interface KvsHandle {
  get(key: string): Promise<string | undefined>
}
