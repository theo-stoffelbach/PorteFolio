"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import AdminNavbar from "@/components/AdminNavbar";

export default function NavbarSelector() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <AdminNavbar />;
  }

  return <Navbar />;
}
