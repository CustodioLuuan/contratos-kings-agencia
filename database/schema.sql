-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  picture VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de contratos
CREATE TABLE IF NOT EXISTS contracts (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  client_document VARCHAR(20) NOT NULL,
  client_email VARCHAR(255),
  client_phone VARCHAR(20),
  company_name VARCHAR(255),
  contract_value DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  signature_link_token VARCHAR(255) UNIQUE,
  signature_data TEXT,
  signed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Inserir usuário padrão
INSERT INTO users (id, email, name, picture) 
VALUES ('user-1', 'admin@kings.com', 'Administrador Kings', 'https://via.placeholder.com/150')
ON CONFLICT (id) DO NOTHING;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_signature_token ON contracts(signature_link_token);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
