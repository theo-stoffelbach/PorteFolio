import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, verifyToken } from "@/lib/jwt";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const pathname = request.nextUrl.pathname;

  // Vérifier la validité du token JWT (avec jose pour Edge Runtime)
  const isValidToken = token ? (await verifyToken(token)) !== null : false;

  // Protection de la route /admin
  if (pathname.startsWith("/admin")) {
    if (!isValidToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Protection des routes API mutantes (POST, PUT, DELETE)
  if (pathname.startsWith("/api/")) {
    const isApiRoute =
      pathname.startsWith("/api/projects") ||
      pathname.startsWith("/api/experiences") ||
      pathname.startsWith("/api/formations");

    const isMutatingMethod = ["POST", "PUT", "DELETE", "PATCH"].includes(
      request.method
    );

    // Exclure les routes d'authentification de la protection
    const isAuthRoute = pathname.startsWith("/api/auth");

    if (isApiRoute && isMutatingMethod && !isAuthRoute) {
      if (!isValidToken) {
        return NextResponse.json(
          { message: "Non autorisé - Authentification requise" },
          {
            status: 401,
            headers: { "Cache-Control": "no-store" },
          }
        );
      }
    }
  }

  // Rediriger vers /admin si déjà connecté et essaie d'accéder à /login
  if (pathname === "/login" && isValidToken) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/login",
    "/api/projects/:path*",
    "/api/experiences/:path*",
    "/api/formations/:path*",
  ],
};
