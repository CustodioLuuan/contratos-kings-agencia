
CREATE TABLE contracts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_document TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  contract_value REAL NOT NULL,
  payment_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  signature_link_token TEXT,
  signature_data TEXT,
  signed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contracts_user_id ON contracts(user_id);
CREATE INDEX idx_contracts_token ON contracts(signature_link_token);
CREATE INDEX idx_contracts_status ON contracts(status);
