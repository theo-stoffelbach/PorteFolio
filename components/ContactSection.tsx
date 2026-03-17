"use client";

import { useState } from "react";

export default function ContactSection() {
  const [copied, setCopied] = useState(false);
  const email = "theo.stoffelbach@hotmail.com";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-16 bg-github-gray-light dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-github-gray-dark dark:text-white mb-8">
          Contact
        </h2>

        <div className="bg-white dark:bg-gray-800 border border-github-border dark:border-gray-700 rounded-lg p-8 shadow-sm">
          <p className="text-github-gray-dark dark:text-gray-300 mb-6">
            Vous avez un projet ou une opportunité à discuter ?
          </p>

          <div className="flex items-center justify-center gap-4">
            <span className="text-lg text-github-gray-dark dark:text-white font-medium">
              {email}
            </span>
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 bg-github-blue dark:bg-blue-600 text-white rounded-md hover:bg-opacity-90 transition-colors text-sm font-medium"
            >
              {copied ? "✓ Copié" : "Copier"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
