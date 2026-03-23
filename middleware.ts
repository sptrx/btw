import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAnonKey, getSupabasePublicUrl } from "@/utils/supabase/public-env";

export async function middleware(request: NextRequest) {
  // API routes handle auth themselves; skipping avoids redirect-to-login HTML breaking fetch/json
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    getSupabasePublicUrl(),
    getSupabaseAnonKey(),
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthPage =
    request.nextUrl.pathname.startsWith("/auth/login") ||
    request.nextUrl.pathname.startsWith("/auth/signup") ||
    request.nextUrl.pathname.startsWith("/auth/forgot-password") ||
    request.nextUrl.pathname.startsWith("/auth/reset-password");
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
  const isPublic =
    path === "/" ||
    isPublicChannel ||
    isTopicsList ||
    isTopicChannel ||
    isContentView;

  if (isAuthCallback) return response;

  if (!user && !isAuthPage && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL("/channel", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
