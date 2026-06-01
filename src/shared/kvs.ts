/**
 * Minimal interface for a CloudFront KeyValueStore handle.
 * Compatible with the handle returned by `CloudFront.createKeyValueStore(event)`
 * in the CF Function runtime.
 */
export type KvsHandle = {
  get(key: string): Promise<string | undefined>
}
