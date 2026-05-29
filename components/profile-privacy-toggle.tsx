"use client";

type Props = {
  defaultChecked: boolean;
};

export function ProfilePrivacyToggle({ defaultChecked }: Props) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/80 bg-muted/20 px-4 py-3">
      <input
        type="checkbox"
        name="profile_private"
        defaultChecked={defaultChecked}
        className="mt-1 size-4 rounded border-input"
      />
      <span className="text-sm">
        <span className="font-medium text-foreground">Private profile</span>
        <span className="mt-0.5 block text-muted-foreground">
          Limit who can see your posts and activity (enforcement coming soon). Follower and
          following counts stay public.
        </span>
      </span>
    </label>
  );
}
