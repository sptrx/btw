"use client";

import { useState } from "react";
import { createTopic } from "@/actions/topics";

export default function CreateTopicForm() {
  const [error, setError] = useState<string | null>(null);

  return (
    <form action={createTopic} className="max-w-lg space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1">
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          placeholder="e.g. Bible Study Basics"
          className="w-full px-4 py-2 border rounded dark:bg-gray-800 dark:border-gray-700"
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="What this channel is about..."
          className="w-full px-4 py-2 border rounded dark:bg-gray-800 dark:border-gray-700"
        />
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button
        type="submit"
        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
      >
        Create topic
      </button>
    </form>
  );
}
