import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/wallet";

  try {
    // Create response first
    const response = NextResponse.redirect(new URL(next, requestUrl.origin));

    // Create Supabase client with the response
    const supabase = createRouteHandlerClient({
      cookies: () => cookies(),
    });

    // If we have a code, exchange it for a session
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        return NextResponse.redirect(new URL("/", requestUrl.origin));
      }
    }

    // Check if we have a session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      return NextResponse.redirect(new URL("/", requestUrl.origin));
    }

    if (!session) {
      return NextResponse.redirect(new URL("/", requestUrl.origin));
    }

    // Set session cookies explicitly
    response.cookies.set("sb-access-token", session.access_token, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    });

    response.cookies.set("sb-refresh-token", session.refresh_token!, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    });

    return response;
  } catch {
    return NextResponse.redirect(new URL("/", requestUrl.origin));
  }
}
