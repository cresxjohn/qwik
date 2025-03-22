import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  try {
    // Skip middleware for auth callback route
    if (request.nextUrl.pathname.startsWith("/auth/callback")) {
      return NextResponse.next();
    }

    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req: request, res });

    // Get the session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // If user is not signed in and the current path is /wallet
    if (!session && request.nextUrl.pathname.startsWith("/wallet")) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // If user is signed in and the current path is /
    if (session && request.nextUrl.pathname === "/") {
      return NextResponse.redirect(new URL("/wallet", request.url));
    }

    return res;
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/", "/wallet/:path*", "/auth/callback"],
};
