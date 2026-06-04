// supabase/functions/_shared/email-templates.ts
// Templates de email reutilizáveis

export function welcomeEmail(opts: {
  brand_name: string;
  primary_color: string;
  restaurant_name: string;
  panel_url: string;
  admin_email: string;
  admin_password: string;
  next_steps?: string[];
}): string {
  const {
    brand_name,
    primary_color,
    restaurant_name,
    panel_url,
    admin_email,
    admin_password,
    next_steps = [
      "Configure seu WhatsApp (Z-API) em Configurações",
      "Crie seu cardápio com categorias e itens",
      "Adicione atendentes da sua equipe",
      "Mande mensagem para seu WhatsApp e veja aparecer no painel",
    ],
  } = opts;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #f8f8f8; padding: 20px;">
      <div style="background: ${primary_color}; padding: 32px 24px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: #fff; margin: 0; font-size: 28px; font-weight: bold;">${brand_name}</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">Seu painel está pronto!</p>
      </div>

      <div style="background: #fff; padding: 32px 24px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <h2 style="margin: 0 0 8px; color: #1a1a1a; font-size: 22px;">Olá! Bem-vindo ao ${brand_name} 🎉</h2>
        <p style="color: #555; line-height: 1.6; margin: 0 0 24px;">O painel do <strong>${restaurant_name}</strong> foi configurado com sucesso. Você já pode começar a usar!</p>

        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid ${primary_color};">
          <p style="margin: 0 0 12px; color: #333; font-weight: 600; font-size: 14px;">Seus dados de acesso:</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #888; font-size: 13px; width: 80px;">Painel:</td>
              <td style="padding: 6px 0;"><a href="${panel_url}" style="color: ${primary_color}; font-weight: 600; text-decoration: none; word-break: break-all;">${panel_url}</a></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #888; font-size: 13px;">Email:</td>
              <td style="padding: 6px 0; color: #1a1a1a; font-weight: 600;">${admin_email}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #888; font-size: 13px;">Senha:</td>
              <td style="padding: 6px 0; color: #1a1a1a; font-weight: 600; font-family: monospace;">${admin_password}</td>
            </tr>
          </table>
        </div>

        <p style="text-align: center; margin: 32px 0 16px;">
          <a href="${panel_url}" style="display: inline-block; background: ${primary_color}; color: #fff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">Acessar painel →</a>
        </p>

        <div style="background: #fffbeb; border: 1px solid #fde68a; padding: 16px; border-radius: 8px; margin: 24px 0;">
          <p style="margin: 0; color: #92400e; font-size: 13px;">⚠️ <strong>Recomendamos trocar a senha no primeiro acesso.</strong> Vá em Configurações → Conta.</p>
        </div>

        <h3 style="margin: 32px 0 16px; color: #1a1a1a; font-size: 16px;">Próximos passos (5 min):</h3>
        <ol style="padding-left: 20px; color: #555; line-height: 1.8;">
          ${next_steps.map((s, i) => `<li style="margin-bottom: 4px;">${s}</li>`).join("")}
        </ol>

        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />

        <p style="color: #888; font-size: 12px; margin: 0; text-align: center;">
          ${brand_name} — Vendas no WhatsApp<br/>
          <a href="mailto:suporte@peddi.com.br" style="color: ${primary_color};">suporte@peddi.com.br</a>
        </p>
      </div>
    </div>
  `;
}

export function newPaymentEmail(opts: {
  restaurant_name: string;
  restaurant_slug: string;
  plan: string;
  amount: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_cpf: string;
  config_url: string;
}): string {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #FF6B2C;">🎉 Novo pagamento aprovado!</h2>
      <p>Um novo cliente acaba de pagar pelo Peddi. Configure o painel dele:</p>
      <table style="background: #f5f5f5; padding: 20px; border-radius: 8px; width: 100%; margin: 16px 0; border-collapse: collapse;">
        <tr><td style="padding: 6px 0; color: #666; width: 120px;">Restaurante:</td><td style="padding: 6px 0; font-weight: bold;">${opts.restaurant_name}</td></tr>
        <tr><td style="padding: 6px 0; color: #666;">Slug:</td><td style="padding: 6px 0;">${opts.restaurant_slug}</td></tr>
        <tr><td style="padding: 6px 0; color: #666;">Plano:</td><td style="padding: 6px 0; font-weight: bold;">${opts.plan.toUpperCase()}</td></tr>
        <tr><td style="padding: 6px 0; color: #666;">Valor:</td><td style="padding: 6px 0; font-weight: bold; color: #10b981;">R$ ${opts.amount.toFixed(2)}</td></tr>
        <tr><td colspan="2" style="padding: 12px 0 4px; color: #666; border-top: 1px solid #ddd;">Dados do cliente:</td></tr>
        <tr><td style="padding: 6px 0; color: #666;">Nome:</td><td style="padding: 6px 0;">${opts.customer_name}</td></tr>
        <tr><td style="padding: 6px 0; color: #666;">Email:</td><td style="padding: 6px 0;">${opts.customer_email}</td></tr>
        <tr><td style="padding: 6px 0; color: #666;">WhatsApp:</td><td style="padding: 6px 0;">${opts.customer_phone}</td></tr>
        <tr><td style="padding: 6px 0; color: #666;">CPF:</td><td style="padding: 6px 0;">${opts.customer_cpf}</td></tr>
      </table>
      <p style="text-align: center; margin: 24px 0;">
        <a href="${opts.config_url}" style="background: #FF6B2C; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
          Configurar Painel →
        </a>
      </p>
    </div>
  `;
}
