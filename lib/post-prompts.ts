import type { SharingType } from "@/lib/sharing-types";

/**
 * Short starting points shown on the new-post form so people who don't think
 * of themselves as writers can share a few honest sentences. Picking one only
 * fills an empty title/body; the author edits freely afterwards.
 */
export type PostPrompt = {
  id: string;
  /** Chip label and suggested title */
  title: string;
  /** Gentle scaffold dropped into an empty body */
  body: string;
};

export const POST_PROMPTS: Partial<Record<SharingType, PostPrompt[]>> = {
  testimony: [
    {
      id: "answered-prayer",
      title: "A prayer that was answered",
      body: "What I was praying for:\n\nHow God answered:\n\nWhat I want you to know:\n",
    },
    {
      id: "hard-season-verse",
      title: "A verse that got me through a hard season",
      body: "The season I was in:\n\nThe verse:\n\nHow it helped me:\n",
    },
    {
      id: "to-the-doubting",
      title: "What I'd tell someone who's doubting",
      body: "Where I've doubted too:\n\nWhat helped:\n\nWhat I'd say to you:\n",
    },
    {
      id: "how-i-came-to-faith",
      title: "How I came to faith",
      body: "Life before:\n\nWhat changed:\n\nLife now:\n",
    },
  ],
  revelation: [
    {
      id: "passage-this-week",
      title: "A passage that spoke to me this week",
      body: "The passage:\n\nWhat stood out:\n\nHow it applies to my life:\n",
    },
  ],
  prophecy: [
    {
      id: "word-for-the-weary",
      title: "A word for someone who is weary",
      body: "Who this is for:\n\nThe word:\n\nThe Scripture it rests on:\n",
    },
  ],
  praise_report: [
    {
      id: "god-showed-up",
      title: "God showed up when…",
      body: "The situation:\n\nWhat happened:\n\nGlory to God for:\n",
    },
  ],
  question: [
    {
      id: "wrestling",
      title: "A question I'm wrestling with",
      body: "My question:\n\nWhy it matters to me:\n\nWhat I've already tried or read:\n",
    },
  ],
  discussion: [
    {
      id: "prayer-routine",
      title: "How do you make time for prayer in a busy week?",
      body: "What has worked for me:\n\nWhere I struggle:\n\nI'd love to hear from you:\n",
    },
    {
      id: "encourage-someone",
      title: "What's one way you've encouraged someone lately?",
      body: "",
    },
  ],
  devotional: [
    {
      id: "short-reflection",
      title: "A short reflection on a verse",
      body: "The verse:\n\nWhat it says:\n\nHow I'm applying it today:\n",
    },
    {
      id: "sermon-thought",
      title: "A sermon thought I am still living",
      body: "The verse or message:\n\nThe thought:\n\nHow I am living it this week:\n",
    },
  ],
};
