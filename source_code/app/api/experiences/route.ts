import { NextRequest, NextResponse } from 'next/server';
import { getExperiences, createExperience } from '@/lib/dataManager';
import {
  apiErrorResponse,
  enforceAdminMutation,
  readJsonBody,
} from '@/lib/apiSecurity';
import { parseExperienceCreate } from '@/lib/validation';

export async function GET() {
  try {
    const experiences = await getExperiences();
    return NextResponse.json(experiences);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch experiences' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const rejection = await enforceAdminMutation(request);
  if (rejection) return rejection;

  try {
    const body = await readJsonBody(request);
    const experience = parseExperienceCreate(body);
    const newExperience = await createExperience(experience);
    return NextResponse.json(newExperience, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, 'Failed to create experience');
  }
}
