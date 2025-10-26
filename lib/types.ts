export interface ProjectPhase {
  week: number;
  phase: string;
  description?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  imageUrl: string;
  projectUrl?: string;
  color: string;
  weeks: number[];
  phases?: ProjectPhase[];
  year: number;
  featured?: boolean;
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  duration: string;
  technologies: string[];
  description: string;
}

export interface Formation {
  id: string;
  school: string;
  period: string;
  description: string;
  skills: string[];
}

export interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  type: 'formation' | 'experience' | 'project';
  description: string;
  side: 'left' | 'right';
}

export interface ActivityWeek {
  week: number;
  projects: string[];
}

export interface ActivityYear {
  year: number;
  weeks: ActivityWeek[];
}

