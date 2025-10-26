import { Experience } from "@/lib/types";

async function getExperiences(): Promise<Experience[]> {
  try {
    const res = await fetch(
      `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/api/experiences`,
      {
        cache: "no-store",
      }
    );
    return await res.json();
  } catch (error) {
    console.error("Error fetching experiences:", error);
    return [];
  }
}

export default async function ExperiencesPage() {
  const experiences = await getExperiences();

  return (
    <div className="min-h-screen bg-github-gray-light dark:bg-gray-900 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-github-gray-dark dark:text-white mb-12 text-center">
          Expériences Professionnelles
        </h1>

        <div className="space-y-8">
          {experiences.map((exp, index) => (
            <div
              key={exp.id}
              className="bg-white dark:bg-gray-800 border border-github-border dark:border-gray-700 rounded-lg p-8 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-github-blue dark:bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {index + 1}
                </div>

                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
                    <div>
                      <h2 className="text-2xl font-semibold text-github-gray-dark dark:text-white">
                        {exp.position}
                      </h2>
                      <p className="text-lg text-github-gray dark:text-gray-300">
                        {exp.company}
                      </p>
                    </div>
                    <div className="text-sm text-github-gray dark:text-gray-300 font-medium">
                      {exp.duration}
                    </div>
                  </div>

                  <p className="text-github-gray-dark dark:text-gray-300 mb-4 leading-relaxed">
                    {exp.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {exp.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1 text-sm bg-github-gray-light dark:bg-gray-700 text-github-gray-dark dark:text-gray-200 rounded-md font-medium"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
