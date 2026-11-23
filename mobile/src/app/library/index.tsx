import { Redirect } from 'expo-router';

import { LoadingState } from '@/components/ui';
import { useAuth } from '@/lib/auth';

/** Opens the signed-in user's library, or sign-in. */
export default function MyLibraryRedirect() {
  const { ready, session, me } = useAuth();
  if (!ready) return <LoadingState />;
  if (!session) return <Redirect href="/sign-in" />;
  const key = me?.profile?.username || session.user.id;
  return <Redirect href={`/library/${key}` as never} />;
}
