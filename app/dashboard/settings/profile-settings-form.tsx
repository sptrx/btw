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
        <label htmlFor="display_name" className="mb-1 block text-sm font-medium text-foreground">
          Display name
        </label>
        <input
          id="display_name"
          name="display_name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full min-h-11 rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="bio" className="mb-1 block text-sm font-medium text-foreground">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          value={bioText}
          onChange={(e) => setBioText(e.target.value)}
          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background sm:text-sm"
        />
      </div>
      <button
        type="submit"
        className="self-start rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 touch-manipulation"
      >
        Save
      </button>
    </form>
  );
}
