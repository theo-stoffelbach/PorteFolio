import { NextRequest, NextResponse } from 'next/server';
import { getFormationById, updateFormation, deleteFormation } from '@/lib/dataManager';
import {
  apiErrorResponse,
  enforceAdminMutation,
  readJsonBody,
} from '@/lib/apiSecurity';
import { parseFormationUpdate } from '@/lib/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formation = await getFormationById(id);
    
    if (!formation) {
      return NextResponse.json(
        { error: 'Formation not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(formation);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch formation' },
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
    const formation = parseFormationUpdate(body, id);

    const updatedFormation = await updateFormation(id, formation);
    
    if (!updatedFormation) {
      return NextResponse.json(
        { error: 'Formation not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedFormation);
  } catch (error) {
    return apiErrorResponse(error, 'Failed to update formation');
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
    const deleted = await deleteFormation(id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Formation not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error, 'Failed to delete formation');
  }
}
