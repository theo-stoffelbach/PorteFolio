import { NextRequest, NextResponse } from 'next/server';
import { getProjects, createProject } from '@/lib/dataManager';
import {
  apiErrorResponse,
  enforceAdminMutation,
  readJsonBody,
} from '@/lib/apiSecurity';
import { parseProjectCreate } from '@/lib/validation';

export async function GET() {
  try {
    const projects = await getProjects();
    return NextResponse.json(projects);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const rejection = await enforceAdminMutation(request);
  if (rejection) return rejection;

  try {
    const body = await readJsonBody(request);
    const project = parseProjectCreate(body);
    const newProject = await createProject(project);
    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, 'Failed to create project');
  }
}
