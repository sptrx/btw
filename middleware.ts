import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
    request.nextUrl.pathname.startsWith("/auth/signup");
  const isAuthCallback = request.nextUrl.pathname === "/auth/callback";
  const path = request.nextUrl.pathname;
  const isChannelList = path === "/channel";
  const isChannelRoute = path.startsWith("/channel/");
  const isChannelNew = path === "/channel/new";
  const isChannelCreateOrEdit =
    path.includes("/pages/new") || path.includes("/content/new");
  const isPublicChannel =
    isChannelList ||
    (isChannelRoute && !isChannelNew && !isChannelCreateOrEdit);
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
    return NextResponse.redirect(new URL("/feed", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
