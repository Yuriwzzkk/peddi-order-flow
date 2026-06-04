import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, ArrowLeft, Loader2, ShieldCheck, Clock, QrCode, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { createPixPayment, checkPaymentStatus } from "@/services/payments";
import { supabase } from "@/lib/supabase";
import peddiLogo from "@/assets/peddi-logo.png";

type Step = "form" | "pix" | "success";

export default function Checkout() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialPlan = (params.get("plan") || "pro") as "starter" | "pro";

  const [step, setStep] = useState<Step>("form");
  const [plan, setPlan] = useState<"starter" | "pro">(initialPlan);
  const [submitting, setSubmitting] = useState(false);
  const [pixCode, setPixCode] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [copied, setCopied] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    customer_cpf: "",
    restaurant_name: "",
  });

  const amount = plan === "starter" ? 97 : 197;

  // Poll for status
  useEffect(() => {
    if (step !== "pix" || !identifier) return;
    const interval = setInterval(async () => {
      const payment = await checkPaymentStatus(identifier);
      if (payment?.status === "paid") {
        setStep("success");
        clearInterval(interval);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [step, identifier]);

  const formatPhone = (v: string) => {
    v = v.replace(/\D/g, "").substring(0, 11);
    if (v.length <= 10) return v.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim();
    return v.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim();
  };

  const formatCpf = (v: string) => {
    v = v.replace(/\D/g, "").substring(0, 11);
    return v.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_, a, b, c, d) => {
      let s = `${a}.${b}.${c}`;
      if (d) s += `-${d}`;
      return s;
    });
  };

  const submit = async () => {
    if (!form.customer_name || !form.customer_email || !form.customer_phone || !form.customer_cpf || !form.restaurant_name) {
      toast.error("Preencha todos os campos");
      return;
    }
    if (!acceptedTerms) {
      toast.error("Você precisa aceitar os termos de uso");
      return;
    }
    setSubmitting(true);
    try {
      const result = await createPixPayment({
        ...form,
        customer_phone: form.customer_phone.replace(/\D/g, ""),
        customer_cpf: form.customer_cpf.replace(/\D/g, ""),
        plan,
        terms_accepted_at: new Date().toISOString(),
        terms_version: "v1.0",
      });
      setPixCode(result.pix_code);
      setIdentifier(result.identifier);
      setStep("pix");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao gerar PIX");
    } finally {
      setSubmitting(false);
    }
  };

  const copyPix = async () => {
    await navigator.clipboard.writeText(pixCode);
    setCopied(true);
    toast.success("Código PIX copiado!");
    setTimeout(() => setCopied(false), 3000);
  };

  // Teste DEV: simula o webhook SyncPay confirmando o pagamento
  const simulatePayment = async () => {
    if (!identifier) return;
    try {
      const { data, error } = await supabase.functions.invoke("syncpay-webhook", {
        body: {
          data: {
            identifier,
            status: "PAID",
          },
        },
      });
      if (error) throw error;
      toast.success("Webhook simulado! Pagamento será confirmado em instantes...");
      // Espera um pouco e checa status
      setTimeout(async () => {
        const payment = await checkPaymentStatus(identifier);
        if (payment?.status === "paid") {
          setStep("success");
        } else {
          toast.info("Ainda processando... clique de novo em alguns segundos");
        }
      }, 3000);
    } catch (e: any) {
      toast.error("Erro: " + (e?.message || "desconhecido"));
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0F0F0F" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-8 pt-4 pb-2 border-b border-zinc-800/50">
        <div className="flex items-center gap-3">
          {step !== "form" && step !== "success" && (
            <button onClick={() => setStep("form")} className="p-2 rounded-lg hover:bg-white/5 text-zinc-400">
              <ArrowLeft size={20} />
            </button>
          )}
          <img src={peddiLogo} alt="FoodWaker" className="h-7" style={{ filter: "brightness(0) saturate(100%) invert(45%) sepia(96%) saturate(1500%) hue-rotate(346deg) brightness(101%) contrast(101%)" }} />
        </div>
        <div className="flex items-center gap-1 text-xs text-zinc-500">
          <ShieldCheck size={14} /> Pagamento seguro
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <AnimatePresence mode="wait">
          {step === "form" && (
            <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md space-y-6">
              <div className="text-center">
                <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Finalize sua assinatura</h1>
                <p className="text-sm text-zinc-400 mt-2">Pagamento único via PIX · Sem mensalidades surpresas</p>
              </div>

              {/* Plano escolhido */}
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setPlan("starter")} className={`p-4 rounded-xl text-left transition-all ${plan === "starter" ? "border-2 border-primary bg-primary/5" : "border border-zinc-800 bg-zinc-900/50"}`}>
                  <p className="text-xs text-zinc-500">Starter</p>
                  <p className="text-2xl font-bold text-foreground">R$ 97</p>
                  <p className="text-[10px] text-zinc-500">/mês</p>
                </button>
                <button onClick={() => setPlan("pro")} className={`relative p-4 rounded-xl text-left transition-all ${plan === "pro" ? "border-2 border-primary bg-primary/5" : "border border-zinc-800 bg-zinc-900/50"}`}>
                  <span className="absolute -top-2 right-3 text-[9px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">POPULAR</span>
                  <p className="text-xs text-zinc-500">Pro</p>
                  <p className="text-2xl font-bold text-primary">R$ 197</p>
                  <p className="text-[10px] text-zinc-500">/mês</p>
                </button>
              </div>

              {/* Formulário */}
              <div className="space-y-3 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <div>
                  <Label className="text-zinc-400 text-xs">Nome do restaurante</Label>
                  <Input value={form.restaurant_name} onChange={e => setForm(p => ({ ...p, restaurant_name: e.target.value }))}
                    placeholder="Burger House" className="bg-zinc-800 border-zinc-700 text-foreground mt-1" />
                </div>
                <div>
                  <Label className="text-zinc-400 text-xs">Seu nome completo</Label>
                  <Input value={form.customer_name} onChange={e => setForm(p => ({ ...p, customer_name: e.target.value }))}
                    placeholder="João Silva" className="bg-zinc-800 border-zinc-700 text-foreground mt-1" />
                </div>
                <div>
                  <Label className="text-zinc-400 text-xs">Email de acesso</Label>
                  <Input type="email" value={form.customer_email} onChange={e => setForm(p => ({ ...p, customer_email: e.target.value }))}
                    placeholder="seu@email.com" className="bg-zinc-800 border-zinc-700 text-foreground mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-zinc-400 text-xs">CPF</Label>
                    <Input value={form.customer_cpf} onChange={e => setForm(p => ({ ...p, customer_cpf: formatCpf(e.target.value) }))}
                      placeholder="000.000.000-00" className="bg-zinc-800 border-zinc-700 text-foreground mt-1" maxLength={14} />
                  </div>
                  <div>
                    <Label className="text-zinc-400 text-xs">WhatsApp</Label>
                    <Input value={form.customer_phone} onChange={e => setForm(p => ({ ...p, customer_phone: formatPhone(e.target.value) }))}
                      placeholder="(11) 99999-9999" className="bg-zinc-800 border-zinc-700 text-foreground mt-1" maxLength={15} />
                  </div>
                </div>
              </div>

              <Button onClick={submit} disabled={submitting || !acceptedTerms}
                className="w-full h-12 bg-primary hover:brightness-110 text-primary-foreground font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed">
                {submitting ? <><Loader2 size={18} className="animate-spin mr-2" /> Gerando PIX...</> : `💳 Pagar R$ ${amount} via PIX`}
              </Button>

              <label className="flex items-start gap-2 cursor-pointer p-2 rounded-lg hover:bg-zinc-900/50 transition-colors">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={e => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 accent-primary"
                />
                <span className="text-xs text-zinc-400 leading-relaxed">
                  Li e aceito os{" "}
                  <Link to="/termos" target="_blank" className="text-primary hover:underline">
                    Termos de Uso
                  </Link>{" "}
                  e a{" "}
                  <Link to="/privacidade" target="_blank" className="text-primary hover:underline">
                    Política de Privacidade
                  </Link>{" "}
                  da FoodWaker.
                </span>
              </label>
            </motion.div>
          )}

          {step === "pix" && (
            <motion.div key="pix" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md space-y-5">
              <div className="text-center">
                <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Clock size={24} className="text-primary" />
                </div>
                <h1 className="font-display text-2xl font-bold text-foreground">Pague via PIX</h1>
                <p className="text-sm text-zinc-400 mt-1">Aprovação automática em segundos</p>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-400">Valor</span>
                  <span className="text-2xl font-bold text-primary">R$ {amount.toFixed(2).replace(".", ",")}</span>
                </div>
                <div className="h-px bg-zinc-800" />

                {/* QR Code */}
                <div className="flex flex-col items-center gap-3 py-3">
                  <div className="bg-white p-3 rounded-lg">
                    <QRCodeSVG value={pixCode} size={200} level="M" />
                  </div>
                  <p className="text-xs text-zinc-500 flex items-center gap-1">
                    <QrCode size={12} /> Escaneie com a câmera do seu banco
                  </p>
                </div>

                <div className="h-px bg-zinc-800" />

                <div>
                  <Label className="text-zinc-400 text-xs mb-2 block">Código PIX Copia e Cola</Label>
                  <div className="flex gap-2">
                    <Input value={pixCode} readOnly className="bg-zinc-800 border-zinc-700 text-foreground text-xs font-mono" />
                    <Button onClick={copyPix} size="icon" className="shrink-0">
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-zinc-300">
                <p className="font-semibold text-foreground mb-1">📱 Como pagar:</p>
                <ol className="space-y-1 text-xs list-decimal list-inside text-zinc-400">
                  <li>Abra o app do seu banco</li>
                  <li>Escolha pagar com PIX</li>
                  <li>Escaneie o QR code ou copie o código</li>
                  <li>Confirme o pagamento de R$ {amount.toFixed(2).replace(".", ",")}</li>
                </ol>
              </div>

              <div className="text-center text-xs text-zinc-500">
                <Loader2 size={14} className="inline animate-spin mr-1" /> Aguardando confirmação automática...
              </div>

              {/* Botão de teste - só em dev */}
              {import.meta.env.DEV && (
                <Button
                  onClick={simulatePayment}
                  variant="outline"
                  className="w-full border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10"
                >
                  <FlaskConical size={14} className="mr-2" /> Testar pagamento (dev)
                </Button>
              )}
            </motion.div>
          )}

          {step === "success" && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md space-y-5 text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 12 }}
                className="w-20 h-20 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
                <Check size={40} className="text-green-500" />
              </motion.div>
              <div>
                <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Pagamento confirmado! 🎉</h1>
                <p className="text-sm text-zinc-400 mt-2">Obrigado por confiar no FoodWaker</p>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 space-y-3 text-left text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-primary font-bold text-sm">1</div>
                  <div>
                    <p className="text-foreground font-medium">Painel sendo configurado</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Nossa equipe vai configurar tudo para você nas próximas 24h</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-primary font-bold text-sm">2</div>
                  <div>
                    <p className="text-foreground font-medium">Acesso enviado automaticamente</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Você receberá email e WhatsApp com login e senha</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-primary font-bold text-sm">3</div>
                  <div>
                    <p className="text-foreground font-medium">Pronto para usar!</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Acesse o painel, configure seu bot e comece a vender</p>
                  </div>
                </div>
              </div>

              <Button onClick={() => navigate("/")} variant="outline" className="border-zinc-700 text-zinc-300">
                Voltar ao site
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
