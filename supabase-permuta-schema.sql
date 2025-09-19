-- Adicionar colunas para contrato de permuta
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS contract_type VARCHAR(20) DEFAULT 'service',
ADD COLUMN IF NOT EXISTS partner_services TEXT;

-- Atualizar registros existentes para ter o tipo 'service'
UPDATE contracts 
SET contract_type = 'service' 
WHERE contract_type IS NULL;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_contracts_contract_type ON contracts(contract_type);
