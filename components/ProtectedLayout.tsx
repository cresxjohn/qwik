"use client";
import useAuth from "@/hooks/useAuth";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useAuth(); // Protect all children pages
  return <>{children}</>;
}
