import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  generateToken,
  getAdminCredentials,
  getJwtExpiresIn,
  verifyPassword,
} from "@/lib/auth";
import {
  apiErrorResponse,
  isTrustedMutationOrigin,
  readJsonBody,
} from "@/lib/apiSecurity";
import {
  clearLoginAttempts,
  consumeLoginAttempt,
  getLoginClientKey,
  LoginRateLimitResult,
} from "@/lib/loginRateLimit";

const DUMMY_PASSWORD_HASH =
  "$2a$10$qEK8LitKlc2.JM8hph9tCuV9mO9Bc4tp9IuM1pjmO1/RY5AZf7sq6";

function rateLimitHeaders(result: LoginRateLimitResult): HeadersInit {
  return {
    "Cache-Control": "no-store",
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}

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

  const clientKey = getLoginClientKey(request.headers);
  const rateLimit = consumeLoginAttempt(clientKey);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { message: "Trop de tentatives. Réessayez plus tard." },
      {
        status: 429,
        headers: {
          ...rateLimitHeaders(rateLimit),
          "Retry-After": String(rateLimit.retryAfter),
        },
      }
    );
  }

  try {
    const body = await readJsonBody(request, 16 * 1024);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { message: "Email et mot de passe requis" },
        { status: 400, headers: rateLimitHeaders(rateLimit) }
      );
    }

    const { email, password } = body as Record<string, unknown>;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      email.length > 254 ||
      !password ||
      password.length > 256
    ) {
      return NextResponse.json(
        { message: "Email et mot de passe requis" },
        { status: 400, headers: rateLimitHeaders(rateLimit) }
      );
    }

    let adminCredentials;
    try {
      adminCredentials = getAdminCredentials();
    } catch (error) {
      console.error("Erreur configuration admin:", error);
      return NextResponse.json(
        { message: "Erreur de configuration du serveur" },
        {
          status: 500,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    const normalizedEmail = email.trim();
    const isExpectedEmail = normalizedEmail === adminCredentials.email;
    const passwordHash = isExpectedEmail
      ? adminCredentials.passwordHash
      : DUMMY_PASSWORD_HASH;
    const isPasswordValid = await verifyPassword(password, passwordHash);

    if (!isExpectedEmail || !isPasswordValid) {
      return NextResponse.json(
        { message: "Email ou mot de passe incorrect" },
        { status: 401, headers: rateLimitHeaders(rateLimit) }
      );
    }

    const token = await generateToken(normalizedEmail);
    clearLoginAttempts(clientKey);

    const response = NextResponse.json(
      { message: "Connexion réussie" },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
          "X-RateLimit-Limit": String(rateLimit.limit),
          "X-RateLimit-Remaining": String(rateLimit.limit),
        },
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

    response.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      maxAge: getJwtExpiresIn(),
      path: "/",
      priority: "high",
    });

    return response;
  } catch (error) {
    return apiErrorResponse(error, "Erreur lors de la connexion");
  }
}
