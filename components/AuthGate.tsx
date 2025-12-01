"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("archifi:user") : null;
      if (!raw) {
        router.replace("/login");
      } else {
        setReady(true);
      }
    } catch {
      router.replace("/login");
    }
  }, [router]);

  if (!ready) return null;
  return <>{children}</>;
}

