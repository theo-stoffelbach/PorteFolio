import ContactSection from "@/components/ContactSection";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-github-gray-light dark:bg-gray-900 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-github-gray-dark dark:text-white mb-12 text-center">
          Contactez-moi
        </h1>

        <ContactSection />

        <div className="mt-12 bg-white dark:bg-gray-800 border border-github-border dark:border-gray-700 rounded-lg p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-github-gray-dark dark:text-white mb-4">
            Autres moyens de contact
          </h2>
          <p className="text-github-gray-dark dark:text-gray-300">
            Pour toute question professionnelle ou opportunité de collaboration,
            n'hésitez pas à me contacter par email.
          </p>
        </div>
      </div>
    </div>
  );
}
