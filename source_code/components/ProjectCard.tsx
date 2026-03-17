import Image from "next/image";
import Link from "next/link";
import { Project } from "@/lib/types";

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-github-border dark:border-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <Link href={`/projets/${project.id}`} className="block">
        <div className="relative w-full h-48 bg-github-gray-light dark:bg-gray-700 flex items-center justify-center">
          {project.imageUrl ? (
            <Image
              src={project.imageUrl}
              alt={project.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-github-gray dark:text-gray-400">
              <svg
                className="w-12 h-12 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-sm">Pas d'image</span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-6">
        <Link href={`/projets/${project.id}`}>
          <h3 className="text-xl font-semibold text-github-gray-dark dark:text-white mb-2 hover:text-github-blue dark:hover:text-blue-400 transition-colors">
            {project.title}
          </h3>
        </Link>

        <div className="flex flex-wrap gap-2 mb-3">
          {project.technologies.map((tech) => (
            <span
              key={tech}
              className="px-2 py-1 text-xs font-medium bg-github-gray-light dark:bg-gray-700 text-github-gray-dark dark:text-gray-300 rounded-md"
            >
              {tech}
            </span>
          ))}
        </div>

        <p className="text-github-gray-dark dark:text-gray-300 mb-4 text-sm leading-relaxed">
          {project.description}
        </p>

        <Link
          href={`/projets/${project.id}`}
          className="inline-flex items-center text-sm text-github-blue dark:text-blue-400 hover:underline"
        >
          Voir le projet →
        </Link>
      </div>
    </div>
  );
}
