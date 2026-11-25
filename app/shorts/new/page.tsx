import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions";
import { ShortUploadForm } from "@/components/shorts/short-upload-form";
import { isStreamConfigured } from "@/lib/stream";
import { privatePageMetadata } from "@/lib/seo";

export const metadata = privatePageMetadata("Share a short");

export default async function NewShortPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?next=/shorts/new");
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-6">
      <h1 className="btw-page-title mb-4">Share a short</h1>
      {isStreamConfigured() ? (
        <ShortUploadForm />
      ) : (
        <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Video uploads aren&apos;t available yet. Please check back soon.
        </p>
      )}
    </div>
  );
}
