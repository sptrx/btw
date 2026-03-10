"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTopicContent } from "@/actions/topics";

type Props = { topicId: string; slug: string };

const CONTENT_TYPES = [
  { value: "article", label: "Article" },
  { value: "tutorial", label: "Tutorial" },
  { value: "debate", label: "Debate" },
  { value: "image", label: "Image" },
  { value: "video", label: "Video" },
] as const;

export default function AddContentForm({ topicId, slug }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [mediaUrls, setMediaUrls] = useState<{ url: string; type: string; caption?: string }[]>([]);
  const router = useRouter();

  const addMedia = () => {
    setMediaUrls([...mediaUrls, { url: "", type: "image" }]);
  };

  const updateMedia = (i: number, field: string, value: string) => {
    const next = [...mediaUrls];
    (next[i] as Record<string, string>)[field] = value;
    setMediaUrls(next);
  };

  return (
    <form
      action={async (formData) => {
        setError(null);
        formData.set("media_urls", JSON.stringify(mediaUrls.filter((m) => m.url)));
        const res = await createTopicContent(topicId, formData);
        if (res?.error) {
          setError(res.error);
        } else {
          router.push(`/topics/${slug}`);
        }
      }}
      className="max-w-xl space-y-4"
    >
      <div>
        <label className="block text-sm font-medium mb-1">Content type</label>
        <select
          name="type"
          required
          className="w-full px-4 py-2 border rounded dark:bg-gray-800 dark:border-gray-700"
        >
          {CONTENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1">
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          className="w-full px-4 py-2 border rounded dark:bg-gray-800 dark:border-gray-700"
        />
      </div>

      <div>
        <label htmlFor="body" className="block text-sm font-medium mb-1">
          Body / Description
        </label>
        <textarea
          id="body"
          name="body"
          rows={6}
          className="w-full px-4 py-2 border rounded dark:bg-gray-800 dark:border-gray-700"
          placeholder="Write your content here. For images/videos, add URLs below."
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium">Media URLs (images/videos)</label>
          <button
            type="button"
            onClick={addMedia}
            className="text-sm text-indigo-600 hover:underline"
          >
            + Add
          </button>
        </div>
        {mediaUrls.map((m, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input
              type="url"
              placeholder="https://..."
              value={m.url}
              onChange={(e) => updateMedia(i, "url", e.target.value)}
              className="flex-1 px-4 py-2 border rounded dark:bg-gray-800 dark:border-gray-700"
            />
            <select
              value={m.type}
              onChange={(e) => updateMedia(i, "type", e.target.value)}
              className="px-2 py-2 border rounded dark:bg-gray-800"
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
          </div>
        ))}
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Publish
        </button>
        <button
          type="button"
          onClick={() => router.push(`/topics/${slug}`)}
          className="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
