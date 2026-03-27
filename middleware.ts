import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAnonKeyServer, getSupabaseUrlServer } from "@/utils/supabase/public-env";

export async function middleware(request: NextRequest) {
  // API routes handle auth themselves; skipping avoids redirect-to-login HTML breaking fetch/json
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  let user: User | null = null;
  try {
    const supabase = createServerClient(
      getSupabaseUrlServer(),
      getSupabaseAnonKeyServer(),
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.warn("[middleware] getUser:", error.message);
    }
    user = data.user ?? null;
  } catch (e) {
    // Missing env, network, or Edge runtime issues — treat as signed out (avoid 500 on every route)
    console.error("[middleware] auth:", e);
  }

  const isAuthPage =
    request.nextUrl.pathname.startsWith("/auth/login") ||
    request.nextUrl.pathname.startsWith("/auth/signup") ||
    request.nextUrl.pathname.startsWith("/auth/forgot-password") ||
    request.nextUrl.pathname.startsWith("/auth/reset-password") ||
    request.nextUrl.pathname.startsWith("/auth/confirmed");
  const isAuthCallback = request.nextUrl.pathname === "/auth/callback";
  const path = request.nextUrl.pathname;
  const isChannelList = path === "/channel";
  const isChannelRoute = path.startsWith("/channel/");
  const isChannelNew = path === "/channel/new";
  const isChannelCreateOrEdit =
    path.includes("/pages/new") || path.includes("/content/new");
  const isChannelContentEdit = /^\/channel\/[^/]+\/content\/[^/]+\/edit$/.test(path);
  const isPublicChannel =
    isChannelList ||
    (isChannelRoute &&
      !isChannelNew &&
      !isChannelCreateOrEdit &&
      !isChannelContentEdit);
  const isTopicsList = path === "/topics";
  const isTopicChannel =
    /^\/topics\/[^/]+$/.test(path) &&
    path !== "/topics/new" &&
    !path.endsWith("/content/new");
  const isContentView = path.startsWith("/topics/content/");
  const isLegalPage = path.startsWith("/legal/");
  const isPublic =
    path === "/" ||
    isPublicChannel ||
    isTopicsList ||
    isTopicChannel ||
    isContentView ||
    isLegalPage;

  if (isAuthCallback) return response;

  if (!user && !isAuthPage && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Logged-in users shouldn't use login/signup/forgot-password, but /auth/reset-password and
  // /auth/confirmed must stay reachable (recovery flow; email confirmation success message).
  if (
    user &&
    isAuthPage &&
    !request.nextUrl.pathname.startsWith("/auth/reset-password") &&
    !request.nextUrl.pathname.startsWith("/auth/confirmed")
  ) {
    return NextResponse.redirect(new URL("/channel/browse", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
