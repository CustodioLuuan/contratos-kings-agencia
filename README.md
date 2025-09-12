# Kings Contratos

Sistema de gestão de contratos web desenvolvido com React, TypeScript e Vite.

## 🚀 Tecnologias

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Build Tool**: Vite
- **Backend**: Hono (Cloudflare Workers)
- **Database**: Cloudflare D1
- **Deploy**: Cloudflare Pages

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

## 🌐 Deploy

O projeto está configurado para deploy no Cloudflare Pages:

```bash
# Verificar build
npm run check

# Deploy (via Wrangler)
wrangler deploy
```

## 📁 Estrutura do Projeto

```
src/
├── react-app/          # Aplicação React
│   ├── pages/         # Páginas da aplicação
│   └── components/    # Componentes reutilizáveis
├── shared/            # Tipos e utilitários compartilhados
└── worker/            # Cloudflare Worker (backend)
```

## 🔧 Scripts Disponíveis

- `npm run dev` - Servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run preview` - Preview do build local
- `npm run lint` - Verificar código com ESLint
- `npm run check` - Verificar build e deploy
