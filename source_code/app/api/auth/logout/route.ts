import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/auth";
import { isTrustedMutationOrigin } from "@/lib/apiSecurity";

export async function POST(request: NextRequest) {
  if (!isTrustedMutationOrigin(request)) {
    return NextResponse.json(
      { message: "Origine de la requête refusée" },
      {
        status: 403,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }

  const response = NextResponse.json(
    { message: "Déconnexion réussie" },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    }
  );

  const forwardedProto = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const isSecure =
    process.env.NODE_ENV === "production" ||
    forwardedProto === "https" ||
    request.nextUrl.protocol === "https:";

  response.cookies.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
    priority: "high",
  });

  return response;
}
