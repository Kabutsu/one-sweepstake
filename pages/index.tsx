import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import LandingPage from "@/components/pages/LandingPage";
import AuthVerify from "@/components/pages/AuthVerify";
import ProfileSetup from "@/components/pages/ProfileSetup";
import Dashboard from "@/components/pages/Dashboard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { data: user, isLoading } = trpc.auth.me.useQuery(undefined, {
    retry: false,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />}
        />
        <Route path="/auth/verify" element={<AuthVerify />} />
        <Route
          path="/auth/setup"
          element={
            user && !user.displayName ? (
              <ProfileSetup />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="/dashboard"
          element={user ? <Dashboard /> : <Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
