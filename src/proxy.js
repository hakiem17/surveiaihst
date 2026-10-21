import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Proxy (pengganti middleware di Next.js 16): menyegarkan sesi Supabase dan
 * melindungi /dashboard agar hanya bisa diakses setelah login.
 */
export async function proxy(request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const { pathname } = request.nextUrl;

  if (!url || !key) {
    if (pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/login?e=config", request.url));
    }
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthenticated = Boolean(user);

  if (pathname.startsWith("/dashboard") && !isAuthenticated) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }
  if (pathname === "/login" && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/api/export"],
};
