"use client";

import { useState } from "react";
import { requestJoinTopic } from "@/actions/topics";

type Props = {
  topicId: string;
  membership: { id: string; status: string } | null;
};

export default function JoinTopicButton({ topicId, membership }: Props) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (!membership) {
    return (
      <form
        action={async () => {
          setLoading(true);
          setMsg(null);
          const res = await requestJoinTopic(topicId);
          setLoading(false);
          if (res?.error) setMsg(res.error);
          else if (res?.success) setMsg("Request sent! Waiting for author approval.");
        }}
      >
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Requesting..." : "Request to join"}
        </button>
        {msg && <span className="ml-2 text-sm">{msg}</span>}
      </form>
    );
  }

  if (membership.status === "pending") {
    return (
      <span className="px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded">
        Request pending
      </span>
    );
  }

  if (membership.status === "approved") {
    return (
      <span className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded">
        Member
      </span>
    );
  }

  return (
    <span className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded text-gray-600">
      Request rejected
    </span>
  );
}
