"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";

type Props = {
  displayName: string;
  initialAvatarUrl: string;
};

export function ProfileAvatarField({ displayName, initialAvatarUrl }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [urlInput, setUrlInput] = useState(initialAvatarUrl);
  const [uploading, setUploading] = useState(false);
  const [uploadEnabled, setUploadEnabled] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile/avatar", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { uploadEnabled?: boolean } | null) => {
        setUploadEnabled(Boolean(data?.uploadEnabled));
      })
      .catch(() => setUploadEnabled(false));
  }, []);

  const syncUrl = (next: string) => {
    setAvatarUrl(next);
    setUrlInput(next);
  };

  const onFileChange = async (file: File | null) => {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file, file.name);
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const data = (await res.json()) as { error?: string; publicUrl?: string };
      if (!res.ok) throw new Error(data.error || "Upload failed.");
      if (!data.publicUrl) throw new Error("Invalid upload response.");
      syncUrl(data.publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4">
        <UserAvatar name={displayName || "Member"} avatarUrl={avatarUrl || null} size="xl" />
        <div className="flex flex-wrap gap-2">
          {uploadEnabled !== false ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading || uploadEnabled === null}
              className="touch-manipulation"
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
              ) : (
                <Upload className="mr-2 size-4" aria-hidden />
              )}
              {uploading ? "Uploading…" : uploadEnabled === null ? "Checking…" : "Upload photo"}
            </Button>
          ) : null}
          {avatarUrl ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="touch-manipulation text-muted-foreground"
              onClick={() => syncUrl("")}
            >
              <X className="mr-2 size-4" aria-hidden />
              Remove
            </Button>
          ) : null}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => void onFileChange(e.target.files?.[0] ?? null)}
        />
      </div>

      <div>
        <label htmlFor="avatar_url" className="mb-1 block text-sm font-medium text-foreground">
          Image URL <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <input
          id="avatar_url"
          name="avatar_url"
          type="url"
          value={urlInput}
          onChange={(e) => {
            setUrlInput(e.target.value);
            setAvatarUrl(e.target.value);
            setError(null);
          }}
          placeholder="https://…"
          className="w-full min-h-11 rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background sm:text-sm"
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          {uploadEnabled === false
            ? "File upload is not enabled on this server — paste an image URL below, or add R2_* variables to your Cloudflare Worker (see docs/cloudflare-deploy.md)."
            : "Upload a photo or paste a link to an image. Leave empty for initials."}
        </p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
