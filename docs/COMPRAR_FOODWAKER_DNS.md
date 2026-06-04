# 🌐 TAREFA 7: Comprar foodwaker.app + Configurar DNS

## ⚠️ AÇÃO NECESSÁRIA DO VOCÊ

Esta tarefa precisa que VOCÊ compre o domínio e configure o Cloudflare manualmente. Não há como automatizar.

---

## Passo 1: Comprar `foodwaker.app` (R$ 50-80/ano)

### Opção A: Namecheap (recomendado para .app)

1. Acesse https://www.namecheap.com/domains/
2. Pesquise `foodwaker.app`
3. Adicione ao carrinho (~US$ 9-14/ano ≈ R$ 50-80)
4. Crie conta e pague
5. **NÃO** configure nada no painel deles, vamos usar Cloudflare

### Opção B: Registro.br
- Apenas para `.com.br`. Não serve para `.app` (TLD genérico)

### Opção C: Hostinger
1. https://www.hostinger.com.br/
2. Pesquise `foodwaker.app`
3. Cuidado com renovação cara (verifique preço de renewal)
4. Pode apontar nameservers para Cloudflare depois

**Recomendação**: Namecheap (preço justo, suporte bom, integração com Cloudflare fácil)

---

## Passo 2: Criar conta Cloudflare (grátis)

1. Acesse https://dash.cloudflare.com/sign-up
2. Crie conta (pode usar Google/GitHub)
3. Clique em **"+ Add a Site"**
4. Digite: `foodwaker.app`
5. Escolha plano **Free** (grátis, suficiente)

---

## Passo 3: Cloudflare vai escanear DNS existentes

A Cloudflare vai listar registros DNS atuais. Como o domínio é novo, provavelmente não tem nada.
Apenas clique **"Continue"**.

---

## Passo 4: Trocar Nameservers no Namecheap

A Cloudflare vai mostrar 2 nameservers, algo como:
```
clark.ns.cloudflare.com
isla.ns.cloudflare.com
```

**No Namecheap**:
1. Vá em **Domain List** → clique em `foodwaker.app`
2. Aba **Nameservers** → selecione **Custom DNS**
3. Cole os 2 nameservers da Cloudflare
4. Salve

Aguarde propagação: **1-24h** (geralmente 30 minutos).

---

## Passo 5: Configurar DNS Records na Cloudflare

Depois que os nameservers propagarem, volte ao dashboard Cloudflare:

1. Vá em `foodwaker.app` → **DNS** → **Records**
2. **Delete** qualquer registro padrão (A, CNAME, etc) que a Cloudflare criou
3. **Adicione** os seguintes registros:

### Registro 1: Wildcard para subdomínios

| Campo | Valor |
|-------|-------|
| Type | `CNAME` |
| Name | `*` |
| Target | `cname.vercel-dns.com` (depois do deploy Vercel) ou `foodwaker.app` |
| Proxy status | **DNS only** (cinza, não laranja) — importante para wildcard funcionar |
| TTL | Auto |

**Nota**: Quando fizermos o deploy no Vercel (TAREFA 8), o target vai mudar para o CNAME específico do Vercel. Por enquanto, pode deixar como placeholder.

### Registro 2: Root domain

| Campo | Valor |
|-------|-------|
| Type | `A` |
| Name | `@` |
| IPv4 | `76.76.21.21` (IP do Vercel, mas será atualizado) |
| Proxy | **Proxied** (laranja) |
| TTL | Auto |

### Registro 3: www

| Campo | Valor |
|-------|-------|
| Type | `CNAME` |
| Name | `www` |
| Target | `foodwaker.app` |
| Proxy | **Proxied** |
| TTL | Auto |

---

## Passo 6: Configurar SSL (Full Strict)

1. Vá em **SSL/TLS** → **Overview**
2. Selecione: **Full (Strict)**
3. Aguarde 5min para o certificado ser provisionado

---

## Passo 7: Forçar HTTPS

1. Vá em **SSL/TLS** → **Edge Certificates**
2. Ative: **Always Use HTTPS** ✅
3. Ative: **Minimum TLS Version** → TLS 1.2
4. Ative: **Automatic HTTPS Rewrites** ✅

---

## Passo 8: Aguardar propagação DNS

A propagação pode levar até 24h (geralmente 30min). Teste em:

- https://dnschecker.org/#A/foodwaker.app
- https://dnschecker.org/#CNAME/_dcmmr.foodwaker.app (wildcard)

Você deve ver:
- `foodwaker.app` → IP do Vercel (depois do deploy)
- `*.foodwaker.app` → CNAME

---

## Passo 9: Verificar wildcard funcionando

No terminal (PowerShell):
```powershell
nslookup burger-house.foodwaker.app
# Deve resolver para IP do Vercel (mesmo que retorne 404 de tenant)
```

Se retornar NXDOMAIN, o wildcard não está configurado corretamente.

---

## Verificação Final

Acesse:
- `https://foodwaker.app` → deve mostrar landing (depois do deploy)
- `https://qualquer-coisa.foodwaker.app` → deve mostrar landing também (com erro de tenant, OK)

---

## ⚠️ ATENÇÃO: .app TLD

Domínios `.app` FORÇAM HTTPS por causa do HSTS preload list. Se o SSL não estiver configurado, **nada carrega**. Garanta que Cloudflare SSL está em **Full (Strict)**.

---

## Custos

| Item | Custo |
|------|-------|
| foodwaker.app (1 ano) | ~R$ 50-80 |
| Cloudflare Free | R$ 0 |
| SSL (Let's Encrypt via Cloudflare) | R$ 0 |
| **Total ano 1** | **R$ 50-80** |

Renovação anual: mesmo valor.

---

## Próximos passos após configurar

Quando você completar este tutorial:
1. Me avise
2. Eu rodo o teste de DNS
3. Continuamos para TAREFA 8 (Deploy Vercel) que vai usar este domínio
