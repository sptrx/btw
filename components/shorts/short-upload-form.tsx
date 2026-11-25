"use client";

import Link from "next/link";
import { useState } from "react";
import { finishShortUpload, startShortUpload } from "@/actions/shorts";
import { Button } from "@/components/ui/button";
import { SHORT_CAPTION_MAX, SHORT_MAX_BYTES, SHORT_MAX_SECONDS } from "@/lib/stream-limits";

function readDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      URL.revokeObjectURL(v.src);
      resolve(v.duration);
    };
    v.onerror = () => reject(new Error("unreadable"));
    v.src = URL.createObjectURL(file);
  });
}

function postWithProgress(url: string, file: File, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("upload")));
    xhr.onerror = () => reject(new Error("upload"));
    const body = new FormData();
    body.append("file", file);
    xhr.send(body);
  });
}

export function ShortUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pct, setPct] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  async function pick(f: File | null) {
    setError(null);
    setFile(null);
    if (!f) return;
    if (!f.type.startsWith("video/")) return setError("Choose a video file.");
    if (f.size > SHORT_MAX_BYTES) return setError("That video is over 100 MB. Trim it and try again.");
    try {
      const d = await readDuration(f);
      if (d > SHORT_MAX_SECONDS + 0.5) return setError(`Shorts can be up to ${SHORT_MAX_SECONDS} seconds.`);
    } catch {
      /* some formats can't be read in the browser; Cloudflare checks the length again */
    }
    setFile(f);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setError(null);
    setPct(0);
    const start = await startShortUpload(caption);
    if ("error" in start) {
      setPct(null);
      return setError(start.error);
    }
    try {
      await postWithProgress(start.uploadURL, file, setPct);
    } catch {
      setPct(null);
      return setError("The upload didn't finish. Check your connection and try again.");
    }
    await finishShortUpload(start.id);
    setPct(null);
    setDone(true);
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm">
        <p className="font-medium">Thanks, your short was received.</p>
        <p className="mt-1 text-muted-foreground">
          It goes live after a quick review. You can check its status anytime.
        </p>
        <Link href="/shorts/mine" className="mt-3 inline-block font-medium text-primary hover:underline">
          View my shorts
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <div>
        <label htmlFor="short-file" className="mb-1 block text-sm font-medium">
          Video
        </label>
        <input
          id="short-file"
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          onChange={(e) => void pick(e.target.files?.[0] ?? null)}
          disabled={pct !== null}
          className="block w-full text-sm"
        />
        <p className="mt-1 text-xs text-muted-foreground">Up to 90 seconds and 100 MB. Vertical video works best.</p>
      </div>
      <div>
        <label htmlFor="short-caption" className="mb-1 block text-sm font-medium">
          Caption (optional)
        </label>
        <textarea
          id="short-caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={SHORT_CAPTION_MAX}
          rows={3}
          className="w-full rounded-lg border border-input bg-background p-2 text-sm"
          placeholder="What did God do?"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Share testimony and encouragement. Every short is reviewed before it appears.
      </p>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {pct !== null ? (
        <div aria-live="polite" className="text-sm text-muted-foreground">
          Uploading… {pct}%
        </div>
      ) : null}
      <Button type="submit" disabled={!file || pct !== null}>
        Share short
      </Button>
    </form>
  );
}
