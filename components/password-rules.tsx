import { PASSWORD_MATCH_RULE, PASSWORD_RULES } from "@/lib/password-policy";

type Props = {
  id: string;
  /** Confirm-password forms also need the two entries to match. */
  includeMatch?: boolean;
};

export function PasswordRules({ id, includeMatch = false }: Props) {
  const rules = includeMatch ? [...PASSWORD_RULES, PASSWORD_MATCH_RULE] : [...PASSWORD_RULES];

  return (
    <div id={id}>
      <p className="text-xs font-medium text-foreground">Password rules</p>
      <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs leading-relaxed text-muted-foreground">
        {rules.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ul>
    </div>
  );
}
