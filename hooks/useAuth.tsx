"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function useAuth() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      console.log("useAuth - Session exists:", session ? "Yes" : "No");

      if (!session) {
        console.log("useAuth - Redirecting to home");
        router.replace("/");
      }
    };
    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log(
        "useAuth - Auth state changed:",
        _event,
        session ? "Session exists" : "No session"
      );
      if (!session) {
        console.log("useAuth - Redirecting to home after state change");
        router.replace("/");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);
}
