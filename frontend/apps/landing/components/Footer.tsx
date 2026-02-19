import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center">
              <img src="/logo-white.svg" alt="AIDA" className="h-6" />
            </Link>
            <p className="mt-3 text-sm text-slate-500 leading-relaxed">
              La imprenta digital más inteligente de Venezuela. Facturación electrónica
              con IA, cumplimiento SENIAT automático.
            </p>
          </div>

          {/* Páginas */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Páginas</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link href="/calculadora" className="hover:text-white transition-colors">Calculadora de Ahorro</Link></li>
              <li><Link href="/productos" className="hover:text-white transition-colors">Productos y SKUs</Link></li>
              <li><Link href="/como-funciona" className="hover:text-white transition-colors">Cómo Funciona</Link></li>
              <li><Link href="/comparativa" className="hover:text-white transition-colors">AIDA vs Otros</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/planes" className="hover:text-white transition-colors">Planes y Precios</Link></li>
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Empresa</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><a href="#contacto" className="hover:text-white transition-colors">Contacto</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API Docs</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Términos de Servicio</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Política de Privacidad</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Cumplimiento SENIAT</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>Providencia 102 — Facturación Digital</li>
              <li>Providencia 121 — Homologación de Sistemas</li>
              <li>Imprenta Autorizada SENIAT</li>
              <li>Datos almacenados en Venezuela</li>
              <li>Retención 10 años SENIAT</li>
            </ul>
            <Link
              href="/portal-seniat"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-aida-cyan/30 bg-aida-cyan/5 text-sm font-semibold text-aida-cyan hover:bg-aida-cyan/10 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Portal Imprenta Digital
            </Link>
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-white mb-2">Contacto</h4>
              <p className="text-sm text-slate-500">info@aida.com.ve</p>
              <p className="text-sm text-slate-500">Caracas, Venezuela</p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-600">
            &copy; {new Date().getFullYear()} ALDA S.A. (AIDA Imprenta Digital). Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4 text-slate-600">
            <span className="text-xs">Hecho con</span>
            <span className="text-aida-cyan text-xs font-semibold">IA</span>
            <span className="text-xs">en Venezuela</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
