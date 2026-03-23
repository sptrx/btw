"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload } from "lucide-react";

export type MediaItem = { url: string; type: string };

type UploadConfig = {
  uploadEnabled: boolean;
  proxyMaxBytes: number;
};

type Props = {
  channelId: string;
  mediaUrls: MediaItem[];
  onMediaChange: (urls: MediaItem[]) => void;
};

function guessMime(file: File): string {
  if (file.type) return file.type;
  const lower = file.name.toLowerCase();
  if (/\.(jpg|jpeg)$/i.test(lower)) return "image/jpeg";
  if (/\.png$/i.test(lower)) return "image/png";
  if (/\.gif$/i.test(lower)) return "image/gif";
  if (/\.webp$/i.test(lower)) return "image/webp";
  if (/\.mp4$/i.test(lower)) return "video/mp4";
  if (/\.webm$/i.test(lower)) return "video/webm";
  if (/\.mov$/i.test(lower)) return "video/quicktime";
  return "application/octet-stream";
}

const fetchConfig = async (): Promise<UploadConfig | null> => {
  const res = await fetch("/api/media/presign", { credentials: "include" });
  if (!res.ok) return null;
  return (await res.json()) as UploadConfig;
};

export function MediaUploadField({ channelId, mediaUrls, onMediaChange }: Props) {
  const [config, setConfig] = useState<UploadConfig | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig()
      .then((c) => setConfig(c ?? { uploadEnabled: false, proxyMaxBytes: 0 }))
      .catch(() => setConfig({ uploadEnabled: false, proxyMaxBytes: 0 }));
  }, []);

  const runUpload = useCallback(
    async (file: File) => {
      const contentType = guessMime(file);
      if (!contentType.startsWith("image/") && !contentType.startsWith("video/")) {
        throw new Error("Choose an image or video file.");
      }

      const cfg = config ?? (await fetchConfig());
      if (!cfg?.uploadEnabled) {
        throw new Error("Uploads are not configured.");
      }

      const useProxy = file.size <= cfg.proxyMaxBytes;

      if (useProxy) {
        const fd = new FormData();
        fd.set("channelId", channelId);
        fd.set("file", file, file.name);
        const res = await fetch("/api/media/upload", {
          method: "POST",
          body: fd,
          credentials: "include",
        });
        const data = (await res.json()) as { error?: string; publicUrl?: string; mediaType?: string };
        if (!res.ok) throw new Error(data.error || "Upload failed.");
        if (!data.publicUrl) throw new Error("Invalid upload response.");
        onMediaChange([
          ...mediaUrls,
          {
            url: data.publicUrl,
            type: data.mediaType ?? (contentType.startsWith("video/") ? "video" : "image"),
          },
        ]);
        return;
      }

      const presign = await fetch("/api/media/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          channelId,
          filename: file.name,
          contentType,
          contentLength: file.size,
        }),
      });
      const data = (await presign.json()) as {
        error?: string;
        uploadUrl?: string;
        publicUrl?: string;
        mediaType?: string;
      };
      if (!presign.ok) throw new Error(data.error || "Could not start upload.");

      const { uploadUrl, publicUrl, mediaType } = data;
      if (!uploadUrl || !publicUrl) throw new Error("Invalid presign response.");

      const put = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": contentType },
        mode: "cors",
      });
      if (!put.ok) {
        throw new Error(
          `Direct upload failed (${put.status}). Add a CORS rule on your R2 bucket allowing PUT from this site, or keep files under ~${Math.round(cfg.proxyMaxBytes / (1024 * 1024))} MB to use server upload.`
        );
      }

      onMediaChange([
        ...mediaUrls,
        {
          url: publicUrl,
          type: mediaType ?? (contentType.startsWith("video/") ? "video" : "image"),
        },
      ]);
    },
    [channelId, config, mediaUrls, onMediaChange]
  );

  const onFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      if (!config?.uploadEnabled) return;

      setUploadError(null);
      setUploading(true);
      try {
        await runUpload(file);
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : typeof err === "object" && err !== null && "message" in err
              ? String((err as { message: unknown }).message)
              : "Upload failed.";
        if (msg === "Failed to fetch" || msg.includes("Load failed")) {
          setUploadError(
            "Network error (Failed to fetch). If uploads are enabled, try: sign in again, check R2 env vars, or add CORS on the R2 bucket for large files."
          );
        } else {
          setUploadError(msg);
        }
      } finally {
        setUploading(false);
      }
    },
    [config?.uploadEnabled, runUpload]
  );

  if (config && !config.uploadEnabled) {
    return (
      <p className="text-sm text-muted-foreground rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3">
        File uploads use Cloudflare R2. Set{" "}
        <code className="text-xs font-mono">R2_ACCOUNT_ID</code>,{" "}
        <code className="text-xs font-mono">R2_ACCESS_KEY_ID</code>,{" "}
        <code className="text-xs font-mono">R2_SECRET_ACCESS_KEY</code>,{" "}
        <code className="text-xs font-mono">R2_BUCKET_NAME</code>, and{" "}
        <code className="text-xs font-mono">R2_PUBLIC_URL</code>. See{" "}
        <code className="text-xs font-mono">docs/cloudflare-r2.md</code>.
      </p>
    );
  }

  if (!config) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Checking upload settings…
      </div>
    );
  }

  const proxyMb = Math.round(config.proxyMaxBytes / (1024 * 1024));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          id="media-upload-input"
          type="file"
          accept="image/*,video/*"
          className="sr-only"
          disabled={uploading}
          onChange={onFile}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={uploading}
          className="touch-manipulation"
          onClick={() => document.getElementById("media-upload-input")?.click()}
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden />
              Uploading…
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" aria-hidden />
              Upload image or video
            </>
          )}
        </Button>
        <span className="text-xs text-muted-foreground">
          Cloudflare R2 — files ≤ ~{proxyMb} MB use the app server (no R2 CORS); larger files upload directly (R2 CORS required)
        </span>
      </div>
      {uploadError && (
        <p className="text-destructive text-sm" role="alert">
          {uploadError}
        </p>
      )}
    </div>
  );
}
