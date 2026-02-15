"use client";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import MonitoringDashboard from "@/components/MonitoringDashboard";
import IntegrationWizard from "@/components/IntegrationWizard";
import ConnectionList from "@/components/ConnectionList";
import WebhookManager from "@/components/WebhookManager";
import ErrorManager from "@/components/ErrorManager";
import TemplateGallery from "@/components/TemplateGallery";
import ProjectList from "@/components/ProjectList";
import LoginForm from "@/components/LoginForm";

type Section = "dashboard" | "wizard" | "connections" | "webhooks" | "errors" | "templates" | "projects";

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [section, setSection] = useState<Section>("dashboard");

  if (!token) {
    return <LoginForm onLogin={setToken} />;
  }

  const renderSection = () => {
    switch (section) {
      case "dashboard": return <MonitoringDashboard token={token} />;
      case "wizard": return <IntegrationWizard token={token} />;
      case "connections": return <ConnectionList token={token} />;
      case "webhooks": return <WebhookManager token={token} />;
      case "errors": return <ErrorManager token={token} />;
      case "templates": return <TemplateGallery token={token} />;
      case "projects": return <ProjectList token={token} />;
      default: return <MonitoringDashboard token={token} />;
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar active={section} onNavigate={(s) => setSection(s as Section)} />
      <main className="flex-1 p-6 overflow-auto">
        {renderSection()}
      </main>
    </div>
  );
}
