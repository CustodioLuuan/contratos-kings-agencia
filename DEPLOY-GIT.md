# 🚀 Deploy via Git - Kings Contratos

## 📋 Como fazer deploy na Vercel usando Git

### 1. **Conectar repositório na Vercel**
1. Acesse [vercel.com](https://vercel.com)
2. Faça login na sua conta
3. Clique em "New Project"
4. Conecte seu repositório GitHub: `CustodioLuuan/contratos-kings-agencia`

### 2. **Configurações do projeto na Vercel**
- **Framework Preset**: Other
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install --legacy-peer-deps`

### 3. **Deploy automático via Git**
Após conectar o repositório, cada push para a branch `main` fará deploy automático:

```bash
# Fazer alterações no código
# ... editar arquivos ...

# Adicionar mudanças
git add .

# Fazer commit
git commit -m "Descrição das mudanças"

# Fazer push (deploy automático)
git push origin main
```

### 4. **Comandos úteis**

```bash
# Ver status do git
git status

# Ver histórico de commits
git log --oneline

# Ver diferenças
git diff

# Fazer pull das mudanças
git pull origin main
```

### 5. **Estrutura do projeto**
```
├── src/
│   ├── react-app/          # Frontend React
│   └── shared/             # Tipos compartilhados
├── dist/                   # Build de produção
├── vercel.json            # Configuração da Vercel
├── package.json           # Dependências
└── vite.config.ts         # Configuração do Vite
```

### 6. **URLs importantes**
- **Repositório**: https://github.com/CustodioLuuan/contratos-kings-agencia
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Site em produção**: https://contratos-kings-agencia-kj3uhotam.vercel.app

### 7. **Troubleshooting**

**Se o deploy falhar:**
1. Verifique os logs na Vercel Dashboard
2. Teste o build local: `npm run build`
3. Verifique se todas as dependências estão corretas

**Se houver conflitos de dependências:**
```bash
# Limpar node_modules e reinstalar
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### 8. **Funcionalidades do site**
- ✅ Sistema completo de contratos
- ✅ Assinatura digital responsiva
- ✅ Geração de PDF
- ✅ Dashboard administrativo
- ✅ Formatação automática de CPF/CNPJ
- ✅ Mobile-first design

---

**🎯 Agora você pode fazer deploys facilmente usando apenas Git!**
