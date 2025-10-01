"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import TimeInsights from "@/components/TimeInsights";

export default function InsightsPage() {
  return (
    <ProtectedRoute>
      <TimeInsights />
    </ProtectedRoute>
  );
}
