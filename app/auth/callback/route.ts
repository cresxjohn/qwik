import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/wallet";

  try {
    const cookieStore = await cookies();

    // Create response first
    const response = NextResponse.redirect(new URL(next, requestUrl.origin));

    // Create Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async getAll() {
            return cookieStore.getAll();
          },
          async setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
                response.cookies.set(name, value, options);
              });
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
        cookieEncoding: "base64url",
      }
    );

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

    return response;
  } catch {
    return NextResponse.redirect(new URL("/", requestUrl.origin));
  }
}
