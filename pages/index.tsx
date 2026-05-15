import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { trpc } from "@/lib/trpc";

import LandingPage from "@/components/pages/LandingPage";
import ProfileSetup from "@/components/pages/ProfileSetup";
import Dashboard from "@/components/pages/dashboard";
import CreateSweepstake from "@/components/pages/create-sweepstake";
import JoinSweepstake from "@/components/pages/join-sweepstake";
import SweepstakeDetail from "@/components/pages/sweepstake-detail";

import Layout from "@/components/ui/Layout";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { data: user, isLoading } = trpc.auth.me.useQuery(undefined, {
    retry: false,
  });

  useEffect(() => {
    setMounted(true);
    document.title = "OneSweepstake - World Cup 2026";
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
          element={
            user ? (
              user.profileCustomized ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/auth/setup" replace />
              )
            ) : (
              <LandingPage />
            )
          }
        />
        <Route
          path="/auth/setup"
          element={
            user && !user.profileCustomized ? (
              <ProfileSetup />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route path="/*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/sweepstake/create" element={<CreateSweepstake />} />
          <Route path="/sweepstake/join" element={<JoinSweepstake />} />
          <Route path="/sweepstake/:id" element={<SweepstakeDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
