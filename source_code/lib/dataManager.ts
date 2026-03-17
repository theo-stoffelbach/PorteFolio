import { promises as fs } from 'fs';
import path from 'path';
import { Project, Experience, Formation } from './types';

const dataDir = path.join(process.cwd(), 'data');

async function readJsonFile<T>(filename: string): Promise<T[]> {
  try {
    const filePath = path.join(dataDir, filename);
    const fileContents = await fs.readFile(filePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return [];
  }
}

async function writeJsonFile<T>(filename: string, data: T[]): Promise<void> {
  try {
    const filePath = path.join(dataDir, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
    throw error;
  }
}

export async function getProjects(): Promise<Project[]> {
  return readJsonFile<Project>('projects.json');
}

export async function getProjectById(id: string): Promise<Project | null> {
  const projects = await getProjects();
  return projects.find(p => p.id === id) || null;
}

export async function createProject(project: Project): Promise<Project> {
  const projects = await getProjects();
  projects.push(project);
  await writeJsonFile('projects.json', projects);
  return project;
}

export async function updateProject(id: string, updatedProject: Partial<Project>): Promise<Project | null> {
  const projects = await getProjects();
  const index = projects.findIndex(p => p.id === id);
  if (index === -1) return null;
  
  projects[index] = { ...projects[index], ...updatedProject };
  await writeJsonFile('projects.json', projects);
  return projects[index];
}

export async function deleteProject(id: string): Promise<boolean> {
  const projects = await getProjects();
  const filtered = projects.filter(p => p.id !== id);
  if (filtered.length === projects.length) return false;
  
  await writeJsonFile('projects.json', filtered);
  return true;
}

export async function getExperiences(): Promise<Experience[]> {
  return readJsonFile<Experience>('experiences.json');
}

export async function getExperienceById(id: string): Promise<Experience | null> {
  const experiences = await getExperiences();
  return experiences.find(e => e.id === id) || null;
}

export async function createExperience(experience: Experience): Promise<Experience> {
  const experiences = await getExperiences();
  experiences.push(experience);
  await writeJsonFile('experiences.json', experiences);
  return experience;
}

export async function updateExperience(id: string, updatedExperience: Partial<Experience>): Promise<Experience | null> {
  const experiences = await getExperiences();
  const index = experiences.findIndex(e => e.id === id);
  if (index === -1) return null;
  
  experiences[index] = { ...experiences[index], ...updatedExperience };
  await writeJsonFile('experiences.json', experiences);
  return experiences[index];
}

export async function deleteExperience(id: string): Promise<boolean> {
  const experiences = await getExperiences();
  const filtered = experiences.filter(e => e.id !== id);
  if (filtered.length === experiences.length) return false;
  
  await writeJsonFile('experiences.json', filtered);
  return true;
}

export async function getFormations(): Promise<Formation[]> {
  return readJsonFile<Formation>('formations.json');
}

export async function getFormationById(id: string): Promise<Formation | null> {
  const formations = await getFormations();
  return formations.find(f => f.id === id) || null;
}

export async function createFormation(formation: Formation): Promise<Formation> {
  const formations = await getFormations();
  formations.push(formation);
  await writeJsonFile('formations.json', formations);
  return formation;
}

export async function updateFormation(id: string, updatedFormation: Partial<Formation>): Promise<Formation | null> {
  const formations = await getFormations();
  const index = formations.findIndex(f => f.id === id);
  if (index === -1) return null;
  
  formations[index] = { ...formations[index], ...updatedFormation };
  await writeJsonFile('formations.json', formations);
  return formations[index];
}

export async function deleteFormation(id: string): Promise<boolean> {
  const formations = await getFormations();
  const filtered = formations.filter(f => f.id !== id);
  if (filtered.length === formations.length) return false;
  
  await writeJsonFile('formations.json', filtered);
  return true;
}

