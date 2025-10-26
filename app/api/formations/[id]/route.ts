import { NextRequest, NextResponse } from 'next/server';
import { getFormationById, updateFormation, deleteFormation } from '@/lib/dataManager';

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
  try {
    const { id } = await params;
    const body = await request.json();
    
    const updatedFormation = await updateFormation(id, body);
    
    if (!updatedFormation) {
      return NextResponse.json(
        { error: 'Formation not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedFormation);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update formation' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    return NextResponse.json(
      { error: 'Failed to delete formation' },
      { status: 500 }
    );
  }
}

