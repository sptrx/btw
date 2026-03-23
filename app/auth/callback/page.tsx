import { Suspense } from "react";
import { AuthCallbackClient } from "./auth-callback-client";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto mt-20 p-8 text-center">
          <p className="text-muted-foreground">Completing sign in...</p>
        </div>
      }
    >
      <AuthCallbackClient />
    </Suspense>
  );
}
