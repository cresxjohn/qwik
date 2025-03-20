"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function useAuth() {
  const router = useRouter();

  useEffect(() => {
    const isAuthed = sessionStorage.getItem("isauthed") === "yes";

    if (!isAuthed) {
      router.replace("/"); // Redirect if not authenticated
    }
  }, [router]);
}
