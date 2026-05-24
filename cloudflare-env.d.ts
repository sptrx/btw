/** Generated/extended for Wrangler bindings — run `npm run cf:typegen` to refresh. */
interface CloudflareEnv {
  ASSETS: Fetcher;
  WORKER_SELF_REFERENCE: Fetcher;
  /** Must match `bucket_name` in wrangler.jsonc and `R2_BUCKET_NAME` env var. */
  R2_MEDIA_BUCKET: R2Bucket;
}
