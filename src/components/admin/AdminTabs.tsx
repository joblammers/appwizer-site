"use client";

import { useState, type ReactNode } from "react";

interface Props {
  resultsPanel: ReactNode;
  scansPanel: ReactNode;
  casesPanel: ReactNode;
  mcpPanel: ReactNode;
}

type Tab = "results" | "beheer" | "cases" | "mcp";

/**
 * Vier toptabs (Scanresultaten / Beheer / Klantcases / MCP-aanmeldingen) —
 * elk een eigen volledige pagina in plaats van geneste sub-tabs, want zowel
 * klantcases als MCP-aanmeldingen hebben hun eigen filters/acties en horen
 * niet verstopt onder Beheer. Admins wisselen hier hooguit een paar keer per
 * bezoek tussen: standaard kleurovergang (`ease`, ~150ms), geen decoratieve
 * motion nodig voor iets dat zo weinig voorkomt.
 */
export function AdminTabs({ resultsPanel, scansPanel, casesPanel, mcpPanel }: Props) {
  const [tab, setTab] = useState<Tab>("results");

  return (
    <div>
      <div className="flex gap-6 border-b border-border">
        <TabButton active={tab === "results"} onClick={() => setTab("results")}>
          Scanresultaten
        </TabButton>
        <TabButton active={tab === "beheer"} onClick={() => setTab("beheer")}>
          Beheer
        </TabButton>
        <TabButton active={tab === "cases"} onClick={() => setTab("cases")}>
          Klantcases
        </TabButton>
        <TabButton active={tab === "mcp"} onClick={() => setTab("mcp")}>
          MCP-aanmeldingen
        </TabButton>
      </div>

      <div className="mt-6">
        {tab === "results" && resultsPanel}
        {tab === "beheer" && scansPanel}
        {tab === "cases" && casesPanel}
        {tab === "mcp" && mcpPanel}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-selected={active}
      role="tab"
      className={`-mb-px border-b-2 px-1 py-3 text-sm font-semibold transition-colors ${
        active
          ? "border-appwizer-orange text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
