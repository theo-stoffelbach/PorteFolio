import Hero from "@/components/Hero";
import Timeline from "@/components/Timeline";
import ActivityGrid from "@/components/ActivityGrid";
import ExperiencePreview from "@/components/ExperiencePreview";
import ContactSection from "@/components/ContactSection";
import ProjectCard from "@/components/ProjectCard";
import { Project } from "@/lib/types";

async function getFeaturedProjects(): Promise<Project[]> {
  try {
    const res = await fetch(
      `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/api/projects`,
      {
        cache: "no-store",
      }
    );
    const projects: Project[] = await res.json();
    return projects.filter((p) => p.featured).slice(0, 3);
  } catch (error) {
    console.error("Error fetching featured projects:", error);
    return [];
  }
}

export default async function Home() {
  const featuredProjects = await getFeaturedProjects();

  return (
    <div>
      <Hero />
      <Timeline />
      <ActivityGrid />
      {/* Section Projets Phares */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-github-gray-dark dark:text-white mb-8 text-center">
            Projets Phares
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      </section>
      <ExperiencePreview />
      <ContactSection />
    </div>
  );
}
