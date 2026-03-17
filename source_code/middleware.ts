import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Fonction de vérification JWT compatible Edge Runtime
async function verifyTokenEdge(token: string): Promise<boolean> {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error("FATAL: JWT_SECRET non défini");
    return false;
  }
  try {
    const secret = new TextEncoder().encode(jwtSecret);
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  const pathname = request.nextUrl.pathname;

  // Vérifier la validité du token JWT (avec jose pour Edge Runtime)
  const isValidToken = token ? await verifyTokenEdge(token) : false;

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
          { status: 401 }
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
