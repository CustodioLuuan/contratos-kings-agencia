# Kings Contratos - Deploy na Vercel

## 🚀 Deploy Automático

Este projeto está configurado para deploy automático na Vercel.

### 📋 Pré-requisitos

- Conta na Vercel
- Projeto conectado ao GitHub

### 🔧 Configuração

1. **Build Command**: `npm run build`
2. **Output Directory**: `dist/client`
3. **Install Command**: `npm install`

### 📁 Estrutura de Deploy

```
dist/
├── client/          # Frontend React
│   ├── index.html
│   └── assets/
└── worker/          # Backend Hono (se necessário)
```

### ⚙️ Variáveis de Ambiente

Configure as seguintes variáveis na Vercel:

- `NODE_ENV=production`

### 🎯 Funcionalidades

- ✅ Sistema de contratos completo
- ✅ Assinatura digital responsiva
- ✅ Geração de PDF
- ✅ Dashboard administrativo
- ✅ Autenticação
- ✅ Mobile-first design

### 📱 Mobile

- Interface totalmente responsiva
- Canvas de assinatura otimizado para touch
- Botões e layouts adaptativos

### 🔧 Comandos Úteis

```bash
# Build local
npm run build

# Desenvolvimento
npm run dev

# Lint
npm run lint
```

### 📞 Suporte

Para dúvidas sobre o deploy, consulte a documentação da Vercel ou entre em contato com a equipe de desenvolvimento.
