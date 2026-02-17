"use client";

import { useState, useEffect } from "react";
import { api } from "../lib/api";

export default function QuickStartSection() {
  const [data, setData] = useState<any>(null);
  const [lang, setLang] = useState<"curl" | "python" | "javascript">("curl");

  useEffect(() => {
    api("/developers/quickstart").then(r => r.json()).then(setData).catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Quick Start</h2>
        <p className="mt-1 text-gray-400">Integre AIDA en su sistema en minutos</p>
      </div>

      {data?.steps && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {data.steps.map((s: any) => (
            <div key={s.step} className="rounded-xl border border-white/10 bg-white/5 p-5">
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-aida-accent text-sm font-bold">{s.step}</div>
              <h3 className="font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-gray-400">{s.description}</p>
            </div>
          ))}
        </div>
      )}

      {data?.code_examples && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Ejemplo de integracion</h3>
            <div className="flex gap-1 rounded-lg bg-white/5 p-1">
              {(["curl", "python", "javascript"] as const).map((l) => (
                <button key={l} onClick={() => setLang(l)}
                  className={`rounded px-3 py-1 text-xs font-medium transition ${lang === l ? "bg-aida-accent text-white" : "text-gray-400 hover:text-white"}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <pre className="overflow-x-auto rounded-lg bg-black/50 p-4 text-sm text-green-400">
            <code>{data.code_examples[lang]}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
