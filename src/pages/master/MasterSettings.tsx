import { motion } from "framer-motion";
import { ChevronRight, Globe, Bell, Shield, Palette, Database, Key } from "lucide-react";

const sections = [
  { icon: Globe, label: "Domínio e URLs", desc: "Configurar domínio peddi.app" },
  { icon: Key, label: "API Keys", desc: "Chaves de integração" },
  { icon: Database, label: "Banco de dados", desc: "Status e backups" },
  { icon: Bell, label: "Notificações", desc: "Alertas do sistema" },
  { icon: Palette, label: "White label", desc: "Personalização por restaurante" },
  { icon: Shield, label: "Segurança", desc: "2FA, logs de acesso" },
];

export default function MasterSettings() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Configurações</h1>
      <div className="bg-admin-card border border-admin-card-border rounded-xl overflow-hidden">
        {sections.map((s, i) => (
          <motion.button key={s.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
            className={`w-full flex items-center gap-3 p-4 hover:bg-secondary transition-colors text-left ${i < sections.length - 1 ? "border-b border-border" : ""}`}>
            <s.icon size={18} className="text-primary shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">{s.label}</p>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </div>
            <ChevronRight size={16} className="text-muted-foreground" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
