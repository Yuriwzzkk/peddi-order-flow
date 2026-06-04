# 🌐 Guia de Domínio Customizado — Peddi

## Como funciona o multi-tenant

Cada cliente do Peddi tem seu próprio "espaço" (restaurant) que pode ser acessado de 2 formas:

1. **Subdomínio gratuito**: `slug-do-cliente.foodwaker.app`
   - Configurado automaticamente após pagamento
   - Não precisa configurar DNS
   - SSL via Let's Encrypt automático

2. **Domínio próprio** (recomendado para clientes que já têm marca):
   - Cliente compra/configura o domínio (Registro.br, Hostinger, Namecheap, etc.)
   - Aponta um CNAME para `foodwaker.app`
   - SSL automático via Cloudflare

---

## Para o cliente configurar domínio próprio

### Passo 1: Comprar o domínio

Recomendamos:
- **Hostinger** (R$ 40-60/ano) — fácil, suporte em português
- **Registro.br** (domínios .com.br) — autoridade nacional
- **Namecheap / GoDaddy** — internacionais

### Passo 2: Apontar o domínio para o Peddi

#### Opção A: Usando Cloudflare (recomendado — gratuito)

1. **Crie uma conta em [cloudflare.com](https://cloudflare.com)** e adicione o domínio
2. **Mude os nameservers** no registrador do domínio para os da Cloudflare (a Cloudflare mostra os 2 nameservers)
3. **Aguarde propagação** (até 24h, geralmente 30min)
4. Na Cloudflare, vá em **DNS > Records** e adicione:

   | Tipo | Nome | Conteúdo | Proxy |
   |------|------|----------|-------|
   | CNAME | @ | foodwaker.app | ✅ Proxied |
   | CNAME | www | foodwaker.app | ✅ Proxied |

5. Vá em **SSL/TLS** e ative **Full (Strict)**
6. Em **Edge Certificates** ative **Always Use HTTPS**

#### Opção B: Sem Cloudflare (apenas Hostinger)

1. No **hPanel da Hostinger**, vá em **Domínios** → selecione o domínio
2. Clique em **DNS / Zone de DNS**
3. Adicione:

   | Tipo | Nome | Aponta para |
   |------|------|-------------|
   | CNAME | @ | foodwaker.app |
   | CNAME | www | foodwaker.app |

4. Em **SSL** ative **Let's Encrypt**

### Passo 3: Avisar o Peddi (master)

Após configurar o DNS, envie ao suporte:

```
Domínio: seudominio.com.br
Email admin: admin@seudominio.com.br
Slug preferido: seudominio  (sem .com.br)
```

O master (você) vai:
1. Entrar no **Master → Whitelabel**
2. Selecionar o restaurante do cliente
3. Preencher:
   - **Domínio customizado**: `seudominio.com.br`
   - **Usar domínio customizado**: ✅
   - **Domínio verificado**: ✅ (depois de confirmar que propagou)
4. Clicar **Salvar**

### Passo 4: Testar

Abra `https://seudominio.com.br` no navegador. Deve aparecer o painel do cliente com a marca dele.

---

## Checklist do cliente

- [ ] Domínio comprado
- [ ] Cloudflare configurada (ou DNS direto)
- [ ] CNAME `@` → `foodwaker.app` adicionado
- [ ] CNAME `www` → `foodwaker.app` adicionado
- [ ] SSL Full (Strict) ativado
- [ ] HTTPS forçado
- [ ] Propagação confirmada (`nslookup seudominio.com.br`)
- [ ] Email enviado ao master com domínio + slug

---

## Verificação de DNS

Para confirmar que propagou:
- [dnschecker.org](https://dnschecker.org) — digite o domínio, veja se CNAME aponta para foodwaker.app
- `nslookup seudominio.com.br` no terminal
- Aguarde até 24h (geralmente 30min para Cloudflare)

---

## Troubleshooting

| Problema | Solução |
|----------|---------|
| "ERR_CONNECTION_REFUSED" | CNAME não propagou ainda — aguarde 1-24h |
| "525 SSL handshake failed" | Cloudflare SSL não está em Full — mude para Full (Strict) |
| "Too many redirects" | Cloudflare SSL em Flexible, mude para Full |
| Domínio cai no lugar errado | Verifique se `foodwaker.app` resolve (deve apontar para o nosso IP) |
| SSL expirado | Ative Always Use HTTPS na Cloudflare |

---

## Custos estimados

| Item | Custo anual |
|------|-------------|
| Domínio .com.br | R$ 40-60 |
| Cloudflare Free | R$ 0 |
| SSL | R$ 0 (incluído) |
| **Total** | **R$ 40-60/ano** |

---

## Para o master (você)

### Verificar tenants configurados

```sql
SELECT name, slug, custom_domain, use_custom_domain, domain_verified
FROM restaurants
WHERE custom_domain IS NOT NULL;
```

### Adicionar domínio manualmente

```sql
UPDATE restaurants
SET custom_domain = 'cliente.com.br',
    use_custom_domain = TRUE,
    domain_verified = TRUE,
    updated_at = now()
WHERE slug = 'cliente-slug';
```

### Tenant resolution (frontend)

Quando o cliente acessa `https://cliente.com.br`:
1. Frontend chama RPC `get_tenant_by_domain('cliente.com.br')`
2. Recebe `{restaurant_id, slug, name, logo_url, primary_color}`
3. Aplica white label em todo o app
4. Se não encontrar, mostra página "Domínio não configurado"

---

## Próximos passos (para o master)

1. Configurar `foodwaker.app` no Cloudflare apontando para o IP do servidor
2. SSL wildcard `*.foodwaker.app` para subdomínios automáticos
3. Configurar Resend para emails de boas-vindas
4. Criar página de "Domínio não configurado" para casos de erro
5. Adicionar validação automática de DNS no Whitelabel
