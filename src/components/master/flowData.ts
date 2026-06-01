export interface BlockDef {
  icon: string;
  title: string;
  locked?: boolean;
}

export interface BlockCategory {
  id: string;
  label: string;
  color: string;
  headerColor: string;
  blocks: BlockDef[];
}

export const blockCategories: BlockCategory[] = [
  {
    id: "client-triggers",
    label: "🟠 GATILHOS DO CLIENTE",
    color: "border-l-[hsl(var(--primary))]",
    headerColor: "hsl(var(--primary))",
    blocks: [
      { icon: "📩", title: "Primeira mensagem" },
      { icon: "💬", title: "Qualquer mensagem recebida" },
      { icon: "🔑", title: "Palavra-chave detectada" },
      { icon: "🆕", title: "Novo cliente cadastrado" },
      { icon: "🔄", title: "Cliente inativo 3 dias" },
      { icon: "🔄", title: "Cliente inativo 7 dias" },
      { icon: "🔄", title: "Cliente inativo 15 dias" },
      { icon: "🔄", title: "Cliente inativo 30 dias" },
      { icon: "🎂", title: "Aniversário do cliente" },
      { icon: "⭐", title: "Avaliação recebida" },
      { icon: "👎", title: "Avaliação negativa (1-2★)" },
      { icon: "👍", title: "Avaliação positiva (4-5★)" },
      { icon: "🖼️", title: "Cliente enviou imagem" },
      { icon: "🎵", title: "Cliente enviou áudio" },
      { icon: "📍", title: "Cliente enviou localização" },
      { icon: "🏷️", title: "Cliente com tag específica" },
      { icon: "🏷️", title: "Cliente sem nenhuma tag" },
      { icon: "🔢", title: "Cliente fez X pedidos" },
      { icon: "💎", title: "Cliente VIP identificado" },
    ],
  },
  {
    id: "order-triggers",
    label: "🟠 GATILHOS DE PEDIDO",
    color: "border-l-[hsl(var(--primary))]",
    headerColor: "hsl(var(--primary))",
    blocks: [
      { icon: "🛒", title: "Novo pedido recebido" },
      { icon: "✅", title: "Pedido confirmado" },
      { icon: "💳", title: "Pagamento confirmado" },
      { icon: "🔥", title: "Pedido em preparo" },
      { icon: "✅", title: "Pedido pronto" },
      { icon: "🛵", title: "Pedido saiu para entrega" },
      { icon: "📦", title: "Pedido entregue" },
      { icon: "❌", title: "Pedido cancelado" },
      { icon: "💰", title: "Pedido acima de R$X" },
      { icon: "💸", title: "Pedido abaixo de R$X" },
      { icon: "🎁", title: "Primeiro pedido do cliente" },
      { icon: "🔁", title: "Pedido repetido (mesmo item)" },
      { icon: "⏱️", title: "Sem resposta há X minutos" },
      { icon: "🛒", title: "Carrinho abandonado" },
      { icon: "🎟️", title: "Cupom utilizado" },
    ],
  },
  {
    id: "menu-triggers",
    label: "🟠 GATILHOS DO CARDÁPIO",
    color: "border-l-[hsl(var(--primary))]",
    headerColor: "hsl(var(--primary))",
    blocks: [
      { icon: "🍔", title: "Cliente escolheu categoria" },
      { icon: "🍔", title: "Cliente escolheu produto" },
      { icon: "➕", title: "Produto adicionado ao carrinho" },
      { icon: "➖", title: "Produto removido do carrinho" },
      { icon: "🔙", title: "Cliente voltou ao menu" },
      { icon: "🔍", title: "Cliente pesquisou produto" },
    ],
  },
  {
    id: "time-triggers",
    label: "⏰ GATILHOS DE TEMPO",
    color: "border-l-[hsl(38,92%,50%)]",
    headerColor: "hsl(38 92% 50%)",
    blocks: [
      { icon: "🌅", title: "Horário de abertura" },
      { icon: "🌙", title: "Horário de fechamento" },
      { icon: "🚫", title: "Fora do horário" },
      { icon: "📅", title: "Todo dia às X horas" },
      { icon: "📆", title: "Dia da semana específico" },
      { icon: "🗓️", title: "Data específica" },
      { icon: "⏳", title: "Após X tempo sem interação" },
      { icon: "🌅", title: "Toda manhã (8h-12h)" },
      { icon: "☀️", title: "Toda tarde (12h-18h)" },
      { icon: "🌙", title: "Toda noite (18h-23h)" },
    ],
  },
  {
    id: "conditions",
    label: "🔀 CONDIÇÕES",
    color: "border-l-[hsl(217,91%,60%)]",
    headerColor: "hsl(217 91% 60%)",
    blocks: [
      { icon: "⚡", title: "SE / SENÃO" },
      { icon: "🕐", title: "Horário está aberto?" },
      { icon: "📦", title: "Produto está disponível?" },
      { icon: "🔄", title: "Cliente já pediu antes?" },
      { icon: "💰", title: "Valor do pedido maior que?" },
      { icon: "💸", title: "Valor do pedido menor que?" },
      { icon: "🏷️", title: "Cliente tem tag específica?" },
      { icon: "🔢", title: "Número de pedidos maior que?" },
      { icon: "📝", title: "Mensagem contém texto?" },
      { icon: "🌍", title: "Cidade do cliente é?" },
      { icon: "📱", title: "Primeiro acesso hoje?" },
      { icon: "💎", title: "Cliente é VIP?" },
    ],
  },
  {
    id: "action-messages",
    label: "💬 AÇÕES — MENSAGENS",
    color: "border-l-[hsl(160,84%,39%)]",
    headerColor: "hsl(160 84% 39%)",
    blocks: [
      { icon: "💬", title: "Enviar texto simples" },
      { icon: "🔘", title: "Enviar texto com botões" },
      { icon: "📋", title: "Enviar lista de opções" },
      { icon: "🖼️", title: "Enviar imagem" },
      { icon: "🎵", title: "Enviar áudio" },
      { icon: "🍽️", title: "Enviar cardápio completo" },
      { icon: "📂", title: "Enviar categoria específica" },
      { icon: "🍔", title: "Enviar produto específico" },
      { icon: "🎟️", title: "Enviar cupom de desconto" },
      { icon: "⭐", title: "Solicitar avaliação" },
      { icon: "📍", title: "Solicitar localização" },
      { icon: "📞", title: "Enviar número de contato" },
    ],
  },
  {
    id: "action-automation",
    label: "🤖 AÇÕES — AUTOMAÇÃO",
    color: "border-l-[hsl(258,90%,66%)]",
    headerColor: "hsl(258 90% 66%)",
    blocks: [
      { icon: "👨‍💼", title: "Transferir para atendente" },
      { icon: "🤖", title: "Devolver para o bot" },
      { icon: "🏷️", title: "Adicionar tag ao cliente" },
      { icon: "🗑️", title: "Remover tag do cliente" },
      { icon: "💎", title: "Marcar cliente como VIP" },
      { icon: "▶️", title: "Iniciar outro fluxo" },
      { icon: "⏸️", title: "Pausar bot X minutos" },
      { icon: "▶️", title: "Reativar bot" },
      { icon: "⏳", title: "Aguardar X tempo" },
      { icon: "👂", title: "Aguardar resposta do cliente" },
      { icon: "🔚", title: "Finalizar conversa" },
      { icon: "📝", title: "Adicionar nota ao cliente" },
    ],
  },
  {
    id: "action-sales",
    label: "🎯 AÇÕES — VENDAS",
    color: "border-l-[hsl(330,81%,60%)]",
    headerColor: "hsl(330 81% 60%)",
    blocks: [
      { icon: "🚀", title: "Oferecer upsell" },
      { icon: "🔗", title: "Oferecer cross-sell" },
      { icon: "📦", title: "Oferecer combo" },
      { icon: "💸", title: "Aplicar desconto automático" },
      { icon: "🎁", title: "Enviar oferta especial" },
      { icon: "🏆", title: "Registrar ponto fidelidade" },
      { icon: "📊", title: "Registrar preferência do cliente" },
      { icon: "💰", title: "Aplicar frete grátis" },
    ],
  },
  {
    id: "action-operational",
    label: "⚙️ AÇÕES — OPERACIONAL",
    color: "border-l-[hsl(174,58%,39%)]",
    headerColor: "hsl(174 58% 39%)",
    blocks: [
      { icon: "🔔", title: "Notificar atendente" },
      { icon: "🔔", title: "Notificar dono do restaurante" },
      { icon: "📋", title: "Criar pedido manual" },
      { icon: "✅", title: "Marcar pedido como pago" },
      { icon: "🖨️", title: "Imprimir pedido (futuro)" },
      { icon: "📊", title: "Registrar métrica" },
    ],
  },
  {
    id: "integrations",
    label: "🔒 INTEGRAÇÕES — Em breve",
    color: "border-l-[hsl(220,9%,46%)]",
    headerColor: "hsl(220 9% 46%)",
    blocks: [
      { icon: "🔒", title: "iFood", locked: true },
      { icon: "🔒", title: "Rappi", locked: true },
      { icon: "🔒", title: "Uber Eats", locked: true },
      { icon: "🔒", title: "Google Planilhas", locked: true },
      { icon: "🔒", title: "Webhook personalizado", locked: true },
      { icon: "🔒", title: "Instagram DM", locked: true },
      { icon: "🔒", title: "Email marketing", locked: true },
      { icon: "🔒", title: "Sistema PDV (caixa)", locked: true },
      { icon: "🔒", title: "Programa de fidelidade", locked: true },
      { icon: "🔒", title: "Pagamento automático PIX", locked: true },
    ],
  },
];

export function getCategoryForBlock(title: string): BlockCategory | undefined {
  return blockCategories.find(c => c.blocks.some(b => b.title === title));
}

export interface CanvasBlock {
  id: string;
  icon: string;
  title: string;
  categoryId: string;
  message: string;
  x: number;
  y: number;
  config?: Record<string, unknown>;
}

export interface Connection {
  from: string;
  to: string;
  label?: string;
}

export interface FlowData {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: string;
  status: "active" | "inactive" | "draft";
  blockCount: number;
  lastEdited: string;
  blocks: CanvasBlock[];
  connections: Connection[];
  stats?: { triggered: number; responded?: number; ordered?: number; revenue?: string };
}

export const restaurants = [
  { id: "burger-house", name: "🍔 Burger House SP" },
  { id: "la-pizza", name: "🍕 La Pizza BH" },
  { id: "sushi-mania", name: "🍣 Sushi Mania CWB" },
  { id: "taco-loco", name: "🌮 Taco Loco RJ" },
  { id: "acai-bairro", name: "🍇 Açaí do Bairro" },
];

export const defaultFlows: FlowData[] = [
  {
    id: "atendimento",
    name: "Atendimento",
    icon: "🤖",
    description: "Fluxo principal",
    category: "🤖 Atendimento",
    status: "active",
    blockCount: 12,
    lastEdited: "hoje 14:23",
    stats: { triggered: 234 },
    blocks: [
      { id: "b1", icon: "📩", title: "Primeira mensagem", categoryId: "client-triggers", message: "Gatilho: primeira mensagem recebida", x: 300, y: 40 },
      { id: "b2", icon: "💬", title: "Enviar texto simples", categoryId: "action-messages", message: "Olá {nome}! Bem-vindo ao {restaurante}! 🍔", x: 300, y: 180 },
      { id: "b3", icon: "🍽️", title: "Enviar cardápio completo", categoryId: "action-messages", message: "Mostra categorias como botões clicáveis", x: 300, y: 320 },
      { id: "b4", icon: "⚡", title: "SE / SENÃO", categoryId: "conditions", message: "Horário está aberto?", x: 300, y: 460 },
      { id: "b5", icon: "🛵", title: "Enviar texto com botões", categoryId: "action-messages", message: "Delivery ou retirada?", x: 200, y: 620 },
      { id: "b6", icon: "💳", title: "Enviar lista de opções", categoryId: "action-messages", message: "Formas de pagamento disponíveis", x: 200, y: 760 },
      { id: "b7", icon: "✅", title: "Enviar texto simples", categoryId: "action-messages", message: "Pedido recebido! Em breve confirmamos 🎉", x: 200, y: 900 },
      { id: "b8", icon: "🌙", title: "Enviar texto simples", categoryId: "action-messages", message: "Estamos fechados! Voltamos às {horario} 🕐", x: 500, y: 620 },
    ],
    connections: [
      { from: "b1", to: "b2" },
      { from: "b2", to: "b3" },
      { from: "b3", to: "b4" },
      { from: "b4", to: "b5", label: "Sim" },
      { from: "b4", to: "b8", label: "Não" },
      { from: "b5", to: "b6" },
      { from: "b6", to: "b7" },
    ],
  },
  {
    id: "remarketing",
    name: "Remarketing",
    icon: "📢",
    description: "Clientes inativos",
    category: "📢 Remarketing",
    status: "active",
    blockCount: 6,
    lastEdited: "ontem",
    stats: { triggered: 47, responded: 12, ordered: 8, revenue: "R$487" },
    blocks: [
      { id: "r1", icon: "🔄", title: "Cliente inativo 7 dias", categoryId: "client-triggers", message: "Cliente sem pedido há 7 dias", x: 300, y: 40 },
      { id: "r2", icon: "💬", title: "Enviar texto simples", categoryId: "action-messages", message: "Oi {nome}! Sentimos sua falta! 😢 15% OFF hoje! Código: VOLTEI15", x: 300, y: 180 },
      { id: "r3", icon: "👂", title: "Aguardar resposta do cliente", categoryId: "action-automation", message: "Aguarda resposta por 24h", x: 300, y: 320 },
      { id: "r4", icon: "⚡", title: "SE / SENÃO", categoryId: "conditions", message: "Cliente respondeu?", x: 300, y: 460 },
      { id: "r5", icon: "🍽️", title: "Enviar cardápio completo", categoryId: "action-messages", message: "Exibir cardápio", x: 200, y: 600 },
      { id: "r6", icon: "🔚", title: "Finalizar conversa", categoryId: "action-automation", message: "Encerrar fluxo", x: 480, y: 600 },
    ],
    connections: [
      { from: "r1", to: "r2" },
      { from: "r2", to: "r3" },
      { from: "r3", to: "r4" },
      { from: "r4", to: "r5", label: "Sim" },
      { from: "r4", to: "r6", label: "Não" },
    ],
  },
  {
    id: "upsell",
    name: "Upsell automático",
    icon: "🎯",
    description: "Por produto",
    category: "🎯 Upsell",
    status: "active",
    blockCount: 8,
    lastEdited: "3 dias",
    stats: { triggered: 89 },
    blocks: [],
    connections: [],
  },
  {
    id: "promo-fds",
    name: "Promoção fim de semana",
    icon: "🎁",
    description: "Oferta toda sexta às 18h",
    category: "🎁 Promoção",
    status: "inactive",
    blockCount: 4,
    lastEdited: "1 semana",
    blocks: [],
    connections: [],
  },
  {
    id: "fora-horario",
    name: "Fora do horário",
    icon: "🌙",
    description: "Resposta automática",
    category: "⚙️ Operacional",
    status: "active",
    blockCount: 3,
    lastEdited: "hoje",
    blocks: [],
    connections: [],
  },
  {
    id: "pos-entrega",
    name: "Pós-entrega",
    icon: "⭐",
    description: "Avaliação",
    category: "⚙️ Operacional",
    status: "draft",
    blockCount: 5,
    lastEdited: "Nunca publicado",
    blocks: [],
    connections: [],
  },
];

export const flowTemplates = [
  { id: "basic", name: "Fluxo básico de pedidos", icon: "🤖" },
  { id: "remarketing-7", name: "Remarketing 7 dias", icon: "📢" },
  { id: "upsell-auto", name: "Upsell automático", icon: "🎯" },
  { id: "fora-horario", name: "Fora do horário", icon: "🌙" },
  { id: "pos-entrega", name: "Pós-entrega e avaliação", icon: "⭐" },
  { id: "promo-fds", name: "Promoção fim de semana", icon: "🎁" },
];

export const flowCategoryOptions = [
  { icon: "🤖", label: "Atendimento" },
  { icon: "📢", label: "Remarketing" },
  { icon: "🎯", label: "Upsell" },
  { icon: "🎁", label: "Promoção" },
  { icon: "⚙️", label: "Operacional" },
];

export const variables = ["{nome}", "{restaurante}", "{valor}", "{itens}", "{pagamento}", "{troco}"];
