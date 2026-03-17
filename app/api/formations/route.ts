import { NextRequest, NextResponse } from 'next/server';
import { getFormations, createFormation } from '@/lib/dataManager';
import { Formation } from '@/lib/types';

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
  try {
    const body = await request.json();
    const formation: Formation = body;
    
    const newFormation = await createFormation(formation);
    return NextResponse.json(newFormation, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create formation' },
      { status: 500 }
    );
  }
}

