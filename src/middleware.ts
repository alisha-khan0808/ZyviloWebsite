import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// First line of defence for /admin. Full role checks happen in each page/action and in RLS.
export async function middleware(req: NextRequest) {
  const isLogin = req.nextUrl.pathname === "/admin/login";
  const res = NextResponse.next({ request: req });
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "no-store");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let signedIn: boolean;

  if (supabaseUrl && anon && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const supabase = createServerClient(supabaseUrl, anon, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list: { name: string; value: string; options: CookieOptions }[]) => {
          list.forEach(({ name, value }) => req.cookies.set(name, value));
          list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    });
    const { data } = await supabase.auth.getUser(); // refreshes the session cookie when needed
    signedIn = !!data.user;
  } else {
    signedIn = !!req.cookies.get("zy_session")?.value; // signature verified server-side
  }

  if (!signedIn && !isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return res;
}

export const config = { matcher: ["/admin/:path*"] };
