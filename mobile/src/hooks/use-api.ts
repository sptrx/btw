import { useCallback, useEffect, useState } from 'react';

import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

const message = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong.');

type Result<T> = { key: string; data: T | null; error: string | null };

/**
 * Loads `action` on mount and whenever `args` or the signed-in user change. Previous
 * data stays visible while new data loads; `reload()` refetches in place (for
 * pull-to-refresh) and keeps the old data if it fails.
 */
export function useApi<T>(action: string, args: Record<string, unknown> = {}) {
  const { session } = useAuth();
  const argsJson = JSON.stringify(args);
  const requestKey = `${action}|${argsJson}|${session?.user.id ?? ''}`;

  const [result, setResult] = useState<Result<T> | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInto = useCallback(
    (key: string) =>
      api<T>(action, JSON.parse(argsJson)).then(
        (data): Result<T> => ({ key, data, error: null }),
        (e): Result<T> => ({ key, data: null, error: message(e) })
      ),
    [action, argsJson]
  );

  useEffect(() => {
    let cancelled = false;
    fetchInto(requestKey).then((next) => {
      if (!cancelled) setResult(next);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchInto, requestKey]);

  const reload = useCallback(async () => {
    setRefreshing(true);
    const next = await fetchInto(requestKey);
    setResult((prev) => ({ ...next, data: next.data ?? prev?.data ?? null }));
    setRefreshing(false);
  }, [fetchInto, requestKey]);

  const current = result?.key === requestKey;
  return {
    data: result?.data ?? null,
    error: current ? result.error : null,
    loading: !current,
    refreshing,
    reload,
  };
}
