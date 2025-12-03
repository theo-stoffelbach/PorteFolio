"use client";

import { useState, useEffect } from "react";
import { Project } from "@/lib/types";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import ProjectEditForm from "@/components/admin/ProjectEditForm";

export default function AdminProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data);
      } else {
        console.error("Projet non trouvé");
        setProject(null);
      }
    } catch (error) {
      console.error("Erreur lors du chargement du projet:", error);
      setProject(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updatedProject: Project) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProject),
      });

      if (res.ok) {
        setProject(updatedProject);
        showToast("Modifications enregistrées !", "success");
      } else {
        showToast("Erreur lors de la sauvegarde", "error");
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      showToast("Erreur lors de la sauvegarde", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-github-gray dark:text-gray-400">
          Chargement...
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-github-gray dark:text-gray-400 text-lg mb-6">
          Projet non trouvé
        </p>
        <Link
          href="/admin/projects"
          className="px-6 py-2 bg-github-blue text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
        >
          Retour aux projets
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 ${
            toast.type === "success"
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {toast.type === "success" ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/projects"
          className="text-github-blue dark:text-blue-400 hover:underline mb-4 inline-block"
        >
          ← Retour aux projets
        </Link>
        <h1 className="text-4xl font-bold text-github-gray-dark dark:text-white">
          {project.title}
        </h1>
      </div>

      {/* Form d'édition */}
      <ProjectEditForm project={project} onSave={handleSave} saving={saving} />
    </div>
  );
}
