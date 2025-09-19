# Instruções para Executar a Migração

## Problema Identificado
O banco de dados não possui os campos `contract_type` e `partner_services` necessários para os contratos de permuta.

## Solução
Execute os seguintes comandos SQL no seu banco de dados Supabase:

```sql
-- Adicionar campos para contratos de permuta
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS contract_type VARCHAR(20) DEFAULT 'service';
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS partner_services TEXT;
```

## Como Executar

### Opção 1: Via Dashboard do Supabase
1. Acesse o dashboard do Supabase
2. Vá para "SQL Editor"
3. Cole e execute os comandos SQL acima

### Opção 2: Via CLI do Supabase
```bash
supabase db reset
```

### Opção 3: Via API (se tiver acesso)
Execute a migração através da API do Supabase.

## Verificação
Após executar a migração, verifique se os campos foram adicionados:
```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'contracts' 
AND column_name IN ('contract_type', 'partner_services');
```

## Resultado Esperado
- `contract_type`: VARCHAR(20) com DEFAULT 'service'
- `partner_services`: TEXT (nullable)
