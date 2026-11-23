"use client";

import { useActionState, useState } from "react";
import { updateProfile } from "@/actions";
import { ProfileAvatarField } from "@/components/profile-avatar-field";
import { ProfilePrivacyToggle } from "@/components/profile-privacy-toggle";

type Props = {
  displayName: string;
  username: string;
  bio: string;
  ministryName: string;
  websiteUrl: string;
  avatarUrl: string;
  profilePrivate: boolean;
};

const inputClassName =
  "w-full min-h-11 rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background sm:text-sm";

export default function ProfileSettingsForm({
  displayName,
  username,
  bio,
  ministryName,
  websiteUrl,
  avatarUrl,
  profilePrivate,
}: Props) {
  const [name, setName] = useState(displayName);
  const [bioText, setBioText] = useState(bio);
  const [ministryText, setMinistryText] = useState(ministryName);
  const [websiteText, setWebsiteText] = useState(websiteUrl);

  const [state, formAction, pending] = useActionState(updateProfile, null);

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-5">
      <ProfileAvatarField displayName={name} initialAvatarUrl={avatarUrl} />

      <div>
        <label htmlFor="username" className="mb-1 block text-sm font-medium text-foreground">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          defaultValue={username}
          autoComplete="username"
          className={inputClassName}
          pattern="[a-zA-Z0-9]([a-zA-Z0-9_-]*[a-zA-Z0-9])?"
          minLength={3}
          maxLength={30}
          required
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Your public profile URL: believetheworks.org/u/your-username
        </p>
      </div>

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
          className={inputClassName}
        />
      </div>

      <div>
        <label htmlFor="bio" className="mb-1 block text-sm font-medium text-foreground">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          value={bioText}
          onChange={(e) => setBioText(e.target.value)}
          placeholder="A short introduction about you and your faith journey"
          className={inputClassName}
        />
      </div>

      <div>
        <label htmlFor="ministry_name" className="mb-1 block text-sm font-medium text-foreground">
          Ministry or church <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <input
          id="ministry_name"
          name="ministry_name"
          type="text"
          value={ministryText}
          onChange={(e) => setMinistryText(e.target.value)}
          placeholder="e.g. Grace Community Church"
          className={inputClassName}
        />
      </div>

      <div>
        <label htmlFor="website_url" className="mb-1 block text-sm font-medium text-foreground">
          Website or social link <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <input
          id="website_url"
          name="website_url"
          type="text"
          value={websiteText}
          onChange={(e) => setWebsiteText(e.target.value)}
          placeholder="https://instagram.com/you or yoursite.com"
          className={inputClassName}
        />
      </div>

      <ProfilePrivacyToggle defaultChecked={profilePrivate} />

      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 touch-manipulation"
      >
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
