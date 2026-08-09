"use client";

import type { ReactNode } from "react";

import { AuthProvider } from "@/components/auth/auth-provider";
import { MotionProvider } from "@/components/motion/motion-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <MotionProvider>{children}</MotionProvider>
    </AuthProvider>
  );
}
