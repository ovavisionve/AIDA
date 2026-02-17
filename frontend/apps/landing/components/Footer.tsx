export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <a href="#" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-aida-accent to-aida-cyan flex items-center justify-center">
                <span className="text-white font-black text-xs">AI</span>
              </div>
              <span className="text-lg font-bold">
                <span className="text-white">AID</span>
                <span className="text-aida-cyan">A</span>
              </span>
            </a>
            <p className="mt-3 text-sm text-slate-500 leading-relaxed">
              La imprenta digital más inteligente de Venezuela. Facturación electrónica
              con IA, cumplimiento SENIAT automático.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Producto</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><a href="#caracteristicas" className="hover:text-white transition-colors">Características</a></li>
              <li><a href="#integraciones" className="hover:text-white transition-colors">Integraciones</a></li>
              <li><a href="#planes" className="hover:text-white transition-colors">Planes y Precios</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API Docs</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Empresa</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><a href="#" className="hover:text-white transition-colors">Sobre Nosotros</a></li>
              <li><a href="#contacto" className="hover:text-white transition-colors">Contacto</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Términos de Servicio</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Política de Privacidad</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Cumplimiento</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>Providencia SNAT/2024/000121</li>
              <li>Imprenta Autorizada SENIAT</li>
              <li>Datos almacenados en Venezuela</li>
              <li>Retención 10 años SENIAT</li>
            </ul>
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-white mb-2">Contacto</h4>
              <p className="text-sm text-slate-500">info@aida.com.ve</p>
              <p className="text-sm text-slate-500">Caracas, Venezuela</p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-600">
            &copy; {new Date().getFullYear()} AIDA Imprenta Digital C.A. Todos los derechos reservados.
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
