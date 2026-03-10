"use client";

import { approveMember, rejectMember } from "@/actions/topics";

type Props = { topicId: string; memberId: string };

export default function ApproveRejectButtons({ topicId, memberId }: Props) {
  return (
    <div className="flex gap-2">
      <form action={approveMember.bind(null, topicId, memberId)}>
        <button
          type="submit"
          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
        >
          Approve
        </button>
      </form>
      <form action={rejectMember.bind(null, topicId, memberId)}>
        <button
          type="submit"
          className="px-3 py-1 border text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Reject
        </button>
      </form>
    </div>
  );
}
