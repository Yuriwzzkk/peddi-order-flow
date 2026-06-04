# 💾 TAREFA 11: PITR / Backups

## ⚠️ AÇÃO NECESSÁRIA (uma vez)

Você precisa ativar PITR no dashboard do Supabase (não tem como automatizar).

---

## O que é PITR

**Point-in-Time Recovery (PITR)** permite restaurar o banco para qualquer ponto dos últimos 7 dias. Útil quando:
- Cliente deletou dados por engano
- Bug em migration corrompeu dados
- Hacker deletou tudo (complementa com RLS)

---

## Como ativar

### 1. Supabase Pro é necessário

PITR está disponível em:
- **Pro plan**: $25/mês, PITR de 7 dias
- **Team plan**: $599/mês, PITR de 14 dias
- **Free**: NÃO tem PITR, apenas backups diários (7 dias de retenção)

**Recomendação**: comece com Free + backups diários, faça upgrade para Pro quando tiver clientes pagantes.

### 2. Ativar PITR

1. Acesse https://supabase.com/dashboard/project/sqclpeyoimddjcrfcrmi/settings/database
2. Role até **"Point in Time Recovery"**
3. Clique **"Enable PITR"** (se estiver em Pro plan)
4. Aguarde 5-10min para provisionar

### 3. Verificar backups diários

Mesmo no Free, o Supabase faz backup diário:
1. Em **Settings** → **Database**
2. Veja **"Backups"** → lista dos últimos 7 dias
3. Pode baixar .sql.gz para restaurar localmente

---

## Procedimento de Restore (quando precisar)

### Cenário 1: Bug em migration (última 1h)

```bash
# 1. Acessar Supabase Dashboard > SQL Editor
# 2. Settings > Database > Point in Time Recovery
# 3. Escolher timestamp ANTES do bug (ex: 30min atrás)
# 4. Confirmar
# 5. Cria um "PITR" novo projeto
# 6. Promove para principal
```

### Cenário 2: Cliente deletou restaurante

```sql
-- 1. No PITR, restaurar banco para timestamp antes da deleção
-- 2. Exportar dados do restaurante (SELECT * FROM restaurants WHERE id = 'xxx')
-- 3. Restaurar manualmente no banco principal
```

### Cenário 3: Hacker/deletação em massa

```bash
# 1. Mudar senha do banco imediatamente
# 2. Revisar audit_log
# 3. Restaurar PITR do momento anterior ao ataque
# 4. Identificar vetor de ataque (geralmente SQL injection via edge function)
# 5. Patch
```

---

## Backups Manuais (extra segurança)

Recomendado fazer backup mensal manual para S3/Google Cloud Storage (off-site):

### Opção 1: Via CLI

```bash
# Instale Supabase CLI
npm install -g supabase

# Dump completo
supabase db dump --linked -f backup-2026-01-15.sql

# Comprimir
gzip backup-2026-01-15.sql

# Upload para S3
aws s3 cp backup-2026-01-15.sql.gz s3://peddi-backups/
```

### Opção 2: Automatizar com cron

```bash
# /etc/cron.d/peddi-backup
0 3 1 * * root cd /opt/peddi && supabase db dump --linked -f /backups/peddi-$(date +\%Y\%m\%d).sql && gzip /backups/peddi-*.sql && aws s3 cp /backups/peddi-$(date +\%Y\%m\%d).sql.gz s3://peddi-backups/
```

### Opção 3: GitHub Action (secrets)

```yaml
# .github/workflows/backup.yml
name: Monthly DB Backup
on:
  schedule:
    - cron: '0 3 1 * *'  # 1º dia do mês às 3h UTC
jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install -g supabase
      - run: supabase db dump --linked -f backup-$(date +%Y%m%d).sql
      - uses: actions/upload-artifact@v4
        with:
          name: db-backup
          path: backup-*.sql
          retention-days: 90
```

---

## Função `export_critical_data()`

Já criei em `supabase/migrations/015_backup_helpers.sql`. Retorna contagens e timestamp:

```sql
SELECT public.export_critical_data();
-- {"exported_at": "2026-06-02T...", "counts": {"restaurants": 3, "orders": 50, "customers": 100}, ...}
```

Útil para alertas ("Restaurants count decreased from 10 to 9!") e health checks.

---

## Custos

| Item | Custo |
|------|-------|
| PITR 7 dias (Pro) | $25/mês |
| S3 backups (10GB) | ~$0.50/mês |
| **Total backup confiável** | **$25.50/mês** |

---

## Teste de Restore (sem medo)

Quando ativar PITR, faça um teste:

1. Crie um restaurante de teste: `Restaurante Backup Teste`
2. Espere 1h
3. Delete esse restaurante
4. Use PITR para restaurar 30min atrás
5. Restaurante volta
6. Agora você sabe que funciona para emergências reais

---

## Próximo passo

Me avise quando ativar PITR (ou decidir manter só backups diários). Vou prosseguir para TAREFA 12.
