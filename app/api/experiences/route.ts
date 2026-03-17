import { NextRequest, NextResponse } from 'next/server';
import { getExperiences, createExperience } from '@/lib/dataManager';
import { Experience } from '@/lib/types';

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
  try {
    const body = await request.json();
    const experience: Experience = body;
    
    const newExperience = await createExperience(experience);
    return NextResponse.json(newExperience, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create experience' },
      { status: 500 }
    );
  }
}

