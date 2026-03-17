import { NextResponse } from 'next/server';
import { getProjects, getExperiences, getFormations } from '@/lib/dataManager';

export async function GET() {
  try {
    const [projects, experiences, formations] = await Promise.all([
      getProjects(),
      getExperiences(),
      getFormations()
    ]);

    // Calcul des technologies uniques
    const allTechnologies = new Set<string>();
    projects.forEach(p => p.technologies.forEach(t => allTechnologies.add(t)));
    experiences.forEach(e => e.technologies.forEach(t => allTechnologies.add(t)));

    // Calcul des compétences de formation
    const allSkills = new Set<string>();
    formations.forEach(f => f.skills.forEach(s => allSkills.add(s)));

    // Projets featured
    const featuredProjects = projects.filter(p => p.featured);

    // Semaines totales travaillées
    const totalWeeks = projects.reduce((acc, p) => acc + (p.weeks?.length || 0), 0);

    // Phases totales
    const totalPhases = projects.reduce((acc, p) => acc + (p.phases?.length || 0), 0);

    // Projets par année
    const projectsByYear: Record<number, number> = {};
    projects.forEach(p => {
      projectsByYear[p.year] = (projectsByYear[p.year] || 0) + 1;
    });

    // Technologies les plus utilisées
    const techCount: Record<string, number> = {};
    projects.forEach(p => {
      p.technologies.forEach(t => {
        techCount[t] = (techCount[t] || 0) + 1;
      });
    });
    const topTechnologies = Object.entries(techCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const stats = {
      projects: {
        total: projects.length,
        featured: featuredProjects.length,
        totalWeeks,
        totalPhases,
        byYear: projectsByYear,
        avgWeeksPerProject: projects.length > 0 ? Math.round(totalWeeks / projects.length * 10) / 10 : 0
      },
      experiences: {
        total: experiences.length,
        currentPosition: experiences.find(e => e.duration.includes('Présent'))?.position || null
      },
      formations: {
        total: formations.length,
        totalSkills: allSkills.size
      },
      technologies: {
        total: allTechnologies.size,
        top: topTechnologies
      }
    };

    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
