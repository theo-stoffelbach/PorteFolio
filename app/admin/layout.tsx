import AdminNavbar from '@/components/AdminNavbar';

// L'admin garde son interface claire (Tailwind) : elle couvre le bureau
// aubergine du site public et monte sa propre barre de navigation.
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-github-gray-light text-github-gray-dark">
      <AdminNavbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {children}
      </div>
    </div>
  );
}
