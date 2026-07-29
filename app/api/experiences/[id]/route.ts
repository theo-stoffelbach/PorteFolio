import { NextRequest, NextResponse } from 'next/server';
import { getExperienceById, updateExperience, deleteExperience } from '@/lib/dataManager';
import {
  apiErrorResponse,
  enforceAdminMutation,
  readJsonBody,
} from '@/lib/apiSecurity';
import { parseExperienceUpdate } from '@/lib/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const experience = await getExperienceById(id);
    
    if (!experience) {
      return NextResponse.json(
        { error: 'Experience not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(experience);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch experience' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rejection = await enforceAdminMutation(request);
  if (rejection) return rejection;

  try {
    const { id } = await params;
    const body = await readJsonBody(request);
    const experience = parseExperienceUpdate(body, id);

    const updatedExperience = await updateExperience(id, experience);
    
    if (!updatedExperience) {
      return NextResponse.json(
        { error: 'Experience not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedExperience);
  } catch (error) {
    return apiErrorResponse(error, 'Failed to update experience');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rejection = await enforceAdminMutation(request);
  if (rejection) return rejection;

  try {
    const { id } = await params;
    const deleted = await deleteExperience(id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Experience not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error, 'Failed to delete experience');
  }
}
