"use client";

import {useState} from "react";
import MultiTimer from "@/components/MultiTimer";
import AuthForm from "@/components/AuthForm";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function Home() {
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  const toggleAuthMode = () => {
    setAuthMode((prev) => (prev === "login" ? "signup" : "login"));
  };

  return (
    <ProtectedRoute
      fallback={
        <div className="flex items-center justify-center min-h-[80vh]">
          <AuthForm mode={authMode} onToggleMode={toggleAuthMode} />
        </div>
      }
    >
      <MultiTimer />
    </ProtectedRoute>
  );
}
