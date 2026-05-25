export type ReportReason = "off_mission" | "political" | "harassment" | "spam" | "other";

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: "off_mission", label: "Off mission (not testimony or faith-focused)" },
  { value: "political", label: "Political or partisan" },
  { value: "harassment", label: "Harassment or unkind" },
  { value: "spam", label: "Spam or promotion" },
  { value: "other", label: "Other concern" },
];
