import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, generateToken, getAdminCredentials } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validation des données
    if (!email || !password) {
      return NextResponse.json(
        { message: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    // Récupérer les credentials admin depuis .env
    let adminCredentials;
    try {
      adminCredentials = getAdminCredentials();
    } catch (error) {
      console.error("Erreur configuration admin:", error);
      return NextResponse.json(
        { message: "Erreur de configuration du serveur" },
        { status: 500 }
      );
    }

    // Vérifier l'email
    if (email !== adminCredentials.email) {
      return NextResponse.json(
        { message: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    // Vérifier le mot de passe avec bcrypt
    const isPasswordValid = await verifyPassword(
      password,
      adminCredentials.passwordHash
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    // Générer un token JWT
    const token = generateToken(email);

    // Créer la réponse avec cookie sécurisé
    const response = NextResponse.json(
      { message: "Connexion réussie" },
      { status: 200 }
    );

    // Définir le cookie avec le token JWT
    response.cookies.set("admin_token", token, {
      httpOnly: true, // Empêche l'accès depuis JavaScript
      secure: process.env.NODE_ENV === "production", // HTTPS uniquement en production
      sameSite: "lax", // Protection CSRF
      maxAge: parseInt(process.env.JWT_EXPIRES_IN || "604800"), // 7 jours par défaut
      path: "/", // Disponible sur tout le site
    });

    return response;
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    return NextResponse.json(
      { message: "Erreur serveur" },
      { status: 500 }
    );
  }
}
