import { NextRequest, NextResponse } from 'next/server';
import { getProjects } from '@/lib/dataManager';
import { ActivityYear, ActivityWeek } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ year: string }> }
) {
  try {
    const { year } = await params;
    const yearNum = parseInt(year);
    
    const projects = await getProjects();
    const yearProjects = projects.filter(p => p.year === yearNum);
    
    // Créer un tableau de 52 semaines
    const weeks: ActivityWeek[] = Array.from({ length: 52 }, (_, i) => ({
      week: i + 1,
      projects: [],
    }));
    
    // Remplir les semaines avec les projets
    yearProjects.forEach(project => {
      project.weeks.forEach(weekNum => {
        if (weekNum >= 1 && weekNum <= 52) {
          weeks[weekNum - 1].projects.push(project.id);
        }
      });
    });
    
    const activityYear: ActivityYear = {
      year: yearNum,
      weeks,
    };
    
    return NextResponse.json(activityYear);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    );
  }
}

