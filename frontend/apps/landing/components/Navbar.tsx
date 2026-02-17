"use client";

import { useState } from "react";

const links = [
  { href: "#caracteristicas", label: "Características" },
  { href: "#calculadora", label: "Calculadora" },
  { href: "#productos", label: "Productos" },
  { href: "#como-funciona", label: "Cómo Funciona" },
  { href: "#comparativa", label: "AIDA vs Otros" },
  { href: "#planes", label: "Planes" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-aida-dark/80 backdrop-blur-lg border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-aida-accent to-aida-cyan flex items-center justify-center">
              <span className="text-white font-black text-sm">AI</span>
            </div>
            <span className="text-xl font-bold tracking-tight">
              <span className="text-white">AID</span>
              <span className="text-aida-cyan">A</span>
            </span>
          </a>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-6">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="https://aida-validacion-qa.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-aida-cyan/30 bg-aida-cyan/5 text-sm font-semibold text-aida-cyan hover:bg-aida-cyan/10 transition-all"
              title="Portal de Imprenta Digital - Verificación SENIAT"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Imprenta Digital
            </a>
            <a
              href="#contacto"
              className="text-sm text-slate-300 hover:text-white transition-colors"
            >
              Iniciar Sesión
            </a>
            <a
              href="#contacto"
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-aida-accent to-aida-cyan text-sm font-semibold text-white hover:shadow-lg hover:shadow-aida-accent/25 transition-all"
            >
              Solicitar Demo
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden text-slate-400 hover:text-white"
            aria-label="Menú"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden bg-aida-dark/95 backdrop-blur-lg border-t border-white/5 px-4 py-4 space-y-3">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block text-sm text-slate-300 hover:text-white py-2"
            >
              {l.label}
            </a>
          ))}
          <a
            href="https://aida-validacion-qa.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-2 w-full px-5 py-2.5 rounded-lg border border-aida-cyan/30 bg-aida-cyan/5 text-sm font-semibold text-aida-cyan"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Imprenta Digital
          </a>
          <a
            href="#contacto"
            onClick={() => setOpen(false)}
            className="block w-full text-center px-5 py-2.5 rounded-lg bg-gradient-to-r from-aida-accent to-aida-cyan text-sm font-semibold text-white mt-3"
          >
            Solicitar Demo
          </a>
        </div>
      )}
    </nav>
  );
}
