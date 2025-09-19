-- Adicionar campos para contratos de permuta
ALTER TABLE contracts ADD COLUMN contract_type VARCHAR(20) DEFAULT 'service';
ALTER TABLE contracts ADD COLUMN partner_services TEXT;
