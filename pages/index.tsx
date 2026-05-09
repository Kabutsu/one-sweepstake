import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { trpc } from "@/lib/trpc";

import LandingPage from "@/components/pages/LandingPage";
import AuthVerify from "@/components/pages/AuthVerify";
import ProfileSetup from "@/components/pages/ProfileSetup";
import Dashboard from "@/components/pages/dashboard";
import CreateSweepstake from "@/components/pages/create-sweepstake";
import SweepstakeDetailV1 from "@/components/pages/sweepstake-detail/1";
import SweepstakeDetailV2 from "@/components/pages/sweepstake-detail/2";
import SweepstakeDetailV3 from "@/components/pages/sweepstake-detail/3";
import SweepstakeDetailV4 from "@/components/pages/sweepstake-detail/4";
import SweepstakeDetailV5 from "@/components/pages/sweepstake-detail/5";

import Layout from "@/components/ui/Layout";
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
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth/verify" element={<AuthVerify />} />
        <Route
          path="/auth/setup"
          element={
            user && !user.displayName ? <ProfileSetup /> : <Navigate to="/dashboard" replace />
          }
        />
        <Route path="/*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/" replace />} />
          <Route
            path="/sweepstake/create"
            element={user ? <CreateSweepstake /> : <Navigate to="/" replace />}
          />
          <Route
            path="/sweepstake/:id/1"
            element={user ? <SweepstakeDetailV1 /> : <Navigate to="/" replace />}
          />
          <Route
            path="/sweepstake/:id/2"
            element={user ? <SweepstakeDetailV2 /> : <Navigate to="/" replace />}
          />
          <Route
            path="/sweepstake/:id/3"
            element={user ? <SweepstakeDetailV3 /> : <Navigate to="/" replace />}
          />
          <Route
            path="/sweepstake/:id/4"
            element={user ? <SweepstakeDetailV4 /> : <Navigate to="/" replace />}
          />
          <Route
            path="/sweepstake/:id/5"
            element={user ? <SweepstakeDetailV5 /> : <Navigate to="/" replace />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
