"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import MonitoringDashboard from "@/components/MonitoringDashboard";
import IntegrationWizard from "@/components/IntegrationWizard";
import ConnectionList from "@/components/ConnectionList";
import WebhookManager from "@/components/WebhookManager";
import ErrorManager from "@/components/ErrorManager";
import TemplateGallery from "@/components/TemplateGallery";
import ProjectList from "@/components/ProjectList";
import AIChat from "@/components/AIChat";
import AgentChat from "@/components/AgentChat";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import ReportsPanel from "@/components/ReportsPanel";
import SeniatReference from "@/components/SeniatReference";
import SeniatValidator from "@/components/SeniatValidator";
import LoginForm from "@/components/LoginForm";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1";

type Section = "dashboard" | "wizard" | "connections" | "webhooks" | "errors" | "templates" | "projects" | "ai-chat" | "agent-chat" | "analytics" | "reports" | "seniat-reference" | "seniat-validator";

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [section, setSection] = useState<Section>("dashboard");

  useEffect(() => {
    const stored = localStorage.getItem("access_token");
    if (!stored) { setChecking(false); return; }

    fetch(`${API_URL}/users/me/profile`, {
      headers: { Authorization: `Bearer ${stored}` },
    })
      .then(r => {
        if (!r.ok) throw new Error("Invalid token");
        setToken(stored);
      })
      .catch((err) => {
        console.error("Gestion token validation failed:", err);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      })
      .finally(() => setChecking(false));
  }, []);

  const handleLogin = (newToken: string) => {
    localStorage.setItem("access_token", newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setToken(null);
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0f1a]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-aida-accent border-t-transparent" />
      </div>
    );
  }

  if (!token) {
    return <LoginForm onLogin={handleLogin} />;
  }

  const renderSection = () => {
    switch (section) {
      case "ai-chat": return <AIChat token={token} />;
      case "agent-chat": return <AgentChat token={token} />;
      case "analytics": return <AnalyticsDashboard token={token} />;
      case "reports": return <ReportsPanel token={token} />;
      case "dashboard": return <MonitoringDashboard token={token} />;
      case "wizard": return <IntegrationWizard token={token} />;
      case "connections": return <ConnectionList token={token} />;
      case "webhooks": return <WebhookManager token={token} />;
      case "errors": return <ErrorManager token={token} />;
      case "templates": return <TemplateGallery token={token} />;
      case "projects": return <ProjectList token={token} />;
      case "seniat-reference": return <SeniatReference token={token} />;
      case "seniat-validator": return <SeniatValidator token={token} />;
      default: return <AIChat token={token} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar active={section} onNavigate={(s) => setSection(s as Section)} />
      <main className="flex-1 p-6 overflow-auto">
        {renderSection()}
      </main>
    </div>
  );
}
