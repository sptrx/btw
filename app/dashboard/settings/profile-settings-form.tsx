"use client";

import { useState } from "react";
import { updateProfile } from "@/actions";

type Props = {
  displayName: string;
  bio: string;
};

export default function ProfileSettingsForm({ displayName, bio }: Props) {
  const [name, setName] = useState(displayName);
  const [bioText, setBioText] = useState(bio);

  return (
    <form action={updateProfile} className="flex flex-col gap-4 max-w-md">
      <div>
        <label htmlFor="display_name" className="block text-sm font-medium mb-1">
          Display name
        </label>
        <input
          id="display_name"
          name="display_name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2 border rounded dark:bg-gray-800 dark:border-gray-700"
        />
      </div>
      <div>
        <label htmlFor="bio" className="block text-sm font-medium mb-1">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          value={bioText}
          onChange={(e) => setBioText(e.target.value)}
          className="w-full px-4 py-2 border rounded dark:bg-gray-800 dark:border-gray-700"
        />
      </div>
      <button
        type="submit"
        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
      >
        Save
      </button>
    </form>
  );
}
