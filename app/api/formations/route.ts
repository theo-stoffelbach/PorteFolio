import { NextRequest, NextResponse } from 'next/server';
import { getFormations, createFormation } from '@/lib/dataManager';
import {
  apiErrorResponse,
  enforceAdminMutation,
  readJsonBody,
} from '@/lib/apiSecurity';
import { parseFormationCreate } from '@/lib/validation';

export async function GET() {
  try {
    const formations = await getFormations();
    return NextResponse.json(formations);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch formations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const rejection = await enforceAdminMutation(request);
  if (rejection) return rejection;

  try {
    const body = await readJsonBody(request);
    const formation = parseFormationCreate(body);
    const newFormation = await createFormation(formation);
    return NextResponse.json(newFormation, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, 'Failed to create formation');
  }
}
