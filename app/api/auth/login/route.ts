import { NextRequest, NextResponse } from "next/server";

// Credentials par défaut - À modifier en production !
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@portfolio.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Vérification des credentials
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Créer une réponse avec cookie de session
      const response = NextResponse.json(
        { message: "Connexion réussie" },
        { status: 200 }
      );

      // Créer un token simple (en production, utiliser JWT)
      const token = Buffer.from(`${email}:${Date.now()}`).toString("base64");

      // Définir le cookie
      response.cookies.set("admin_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 jours
      });

      return response;
    }

    return NextResponse.json(
      { message: "Email ou mot de passe incorrect" },
      { status: 401 }
    );
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    return NextResponse.json(
      { message: "Erreur serveur" },
      { status: 500 }
    );
  }
}
