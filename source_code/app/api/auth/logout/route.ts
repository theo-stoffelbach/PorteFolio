import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const response = NextResponse.json(
    { message: "Déconnexion réussie" },
    { status: 200 }
  );

  // Supprimer le cookie
  response.cookies.set("admin_token", "", {
    httpOnly: true,
    maxAge: 0,
  });

  return response;
}
