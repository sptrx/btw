# Cloudflare R2 for channel media

Channel content can attach **images** and **videos** uploaded to **Cloudflare R2** (S3-compatible). The browser uploads **directly to R2** using a presigned URL; your app only issues the URL and checks that the user owns the channel.

R2 serves files over **HTTPS** using a **public bucket URL**: either an **[R2 custom domain](https://developers.cloudflare.com/r2/buckets/public-buckets/)**, the **`*.r2.dev` subdomain**, or another public base you configure.

## Environment variables

Add to `.env.local`:

| Variable | Description |
|----------|-------------|
| `R2_ACCOUNT_ID` | Cloudflare account ID (Dashboard → R2 → right sidebar, or URL) |
| `R2_ACCESS_KEY_ID` | R2 API token **Access Key ID** |
| `R2_SECRET_ACCESS_KEY` | R2 API token **Secret Access Key** |
| `R2_BUCKET_NAME` | R2 bucket name |
| `R2_PUBLIC_URL` | **Required.** Public base URL for objects, **no trailing slash**. Example: `https://media.yourdomain.com` or `https://pub-xxxxx.r2.dev` |
| `R2_MAX_IMAGE_MB` | Optional. Max image size in MB (default 25) |
| `R2_MAX_VIDEO_MB` | Optional. Max video size in MB (default 400) |
| `R2_PROXY_MAX_MB` | Optional. Max file size in MB for **server-side** upload via `POST /api/media/upload` (default **8**). Larger files use presigned URLs and require **CORS** on the bucket. |

Create an **API token** under R2 with **Object Read & Write** (and Account scope as required by Cloudflare).

## Public access

1. In the R2 bucket, enable **public access** as needed (custom domain or `r2.dev`).
2. Set **`R2_PUBLIC_URL`** to the exact base visitors use to load files (same origin you configure for the bucket).

The app stores full object URLs in `topic_content.media_urls` as `{ url, type }`.

## CORS (browser uploads)

In **R2 → your bucket → Settings → CORS policy**, allow your app origin to `PUT` (and `GET` if needed), for example:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://your-production-domain.com"
    ],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Replace origins with your real URLs.

## How it works

1. **Small files (≤ `R2_PROXY_MAX_MB`, default 8 MB):** the browser sends the file to **`POST /api/media/upload`** (same origin). The Next.js server uploads to R2 with the AWS SDK — **no CORS** configuration needed on R2 for the browser.
2. **Larger files:** the signed-in **channel author** calls `POST /api/media/presign`; the server returns a **presigned `PUT` URL** and the **public URL** under `R2_PUBLIC_URL`. The browser **PUT**s directly to R2 — you **must** configure **CORS** on the bucket for your app origin.
3. The public URL is stored in `topic_content.media_urls` when creating or editing content.

If you see **“Failed to fetch”** on upload, ensure `/api/*` is not blocked, you are signed in, and for large files add a CORS rule on R2 (see above).
