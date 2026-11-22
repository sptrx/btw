"use client";

import { useState } from "react";
import { Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  title: string;
  quote: string;
  channelName: string;
  path: string;
  label?: string;
};

const CARD_SIZE = 1080;

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    } else {
      line = next;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    const last = lines[maxLines - 1];
    lines[maxLines - 1] = last.replace(/\s+\S*$/, "") + "…";
  }
  return lines;
}

function drawCard(title: string, quote: string, channelName: string): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_SIZE;
  canvas.height = CARD_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.fillStyle = "#1c1812";
  ctx.fillRect(0, 0, CARD_SIZE, CARD_SIZE);

  ctx.fillStyle = "#e4c27a";
  ctx.fillRect(80, 88, 120, 6);

  ctx.fillStyle = "#e4c27a";
  ctx.font = "600 28px Georgia, 'Times New Roman', serif";
  ctx.fillText("BELIEVE THE WORKS", 80, 150);

  ctx.fillStyle = "#f7f1e6";
  ctx.font = "italic 54px Georgia, 'Times New Roman', serif";
  const body = quote.trim() || title.trim();
  const lines = wrapLines(ctx, `“${body}”`, 900, 10);
  let y = 280;
  for (const line of lines) {
    ctx.fillText(line, 80, y);
    y += 72;
  }

  ctx.fillStyle = "#e4c27a";
  ctx.font = "500 32px Georgia, 'Times New Roman', serif";
  const credit = channelName.trim() || "A channel on Believe The Works";
  ctx.fillText(credit, 80, 960);
  return canvas;
}

function shareUrl(path: string): string {
  try {
    const u = new URL(path, window.location.origin);
    return `${u.origin}${u.pathname}`;
  } catch {
    return path;
  }
}

export function ShareTestimonyButton({
  title,
  quote,
  channelName,
  path,
  label = "Share this testimony",
}: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const canvasBlob = async () => {
    const canvas = drawCard(title, quote, channelName);
    const url = canvas.toDataURL("image/png");
    setPreview(url);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    return blob;
  };

  const openPreview = async () => {
    setStatus(null);
    await canvasBlob();
  };

  const onShare = async () => {
    setStatus(null);
    const blob = await canvasBlob();
    const url = shareUrl(path);
    const text = quote.trim()
      ? `${quote.trim().slice(0, 180)} — ${channelName}`
      : title;
    if (!blob) {
      setStatus("Could not build the card.");
      return;
    }
    const file = new File([blob], "testimony.png", { type: "image/png" });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title, text, url });
        setStatus("Shared.");
        return;
      }
      if (navigator.share) {
        await navigator.share({ title, text, url });
        setStatus("Link shared. Download the card if you want the image.");
        return;
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "testimony.png";
    a.click();
    URL.revokeObjectURL(a.href);
    setStatus("Card downloaded. Share the image in your message.");
  };

  const onDownload = async () => {
    const blob = await canvasBlob();
    if (!blob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "testimony.png";
    a.click();
    URL.revokeObjectURL(a.href);
    setStatus("Card downloaded.");
  };

  return (
    <div className="mt-4">
      <Button type="button" variant="outline" className="rounded-full" onClick={preview ? onShare : openPreview}>
        <Share2 className="size-4" aria-hidden />
        {label}
      </Button>
      {preview ? (
        <div className="mt-3 max-w-sm space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt={`Share card for ${title}`}
            className="w-full rounded-xl border border-border"
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" className="rounded-full" onClick={onShare}>
              <Share2 className="size-4" aria-hidden />
              Share image
            </Button>
            <Button type="button" variant="outline" className="rounded-full" onClick={onDownload}>
              <Download className="size-4" aria-hidden />
              Download
            </Button>
          </div>
          {status ? (
            <p className="text-sm text-muted-foreground" role="status">
              {status}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              A quote card with the channel name, ready to send in a message.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
