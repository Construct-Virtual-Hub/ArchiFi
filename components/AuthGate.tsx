"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("archifi:user") : null;
      console.log("AuthGate check - localStorage user:", raw);
      if (!raw) {
        console.log("No user found, redirecting to login");
        router.push("/login");
      } else {
        console.log("User found, setting ready");
        setReady(true);
      }
    } catch (err) {
      console.error("AuthGate error:", err);
      router.push("/login");
    }
  }, [router]);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="text-sm text-neutral-500">Loading...</div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="text-sm text-neutral-500">Redirecting to login...</div>
      </div>
    );
  }

  return <>{children}</>;
}

