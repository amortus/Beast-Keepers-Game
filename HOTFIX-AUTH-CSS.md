# 🚨 HOTFIX: Login/Cadastro Inputs Invisíveis

**Data:** 2025-11-01  
**Problema:** CSS estava escondendo inputs SEMPRE, incluindo na tela de login/cadastro  
**Causa:** `auth-cleanup.css` tinha regras globais sem condicional  

---

## ❌ Problema

```css
/* ANTES (ERRADO): */
input[data-field="email"] {
  display: none !important; /* Escondia SEMPRE */
}
```

**Resultado:**
- ❌ Tela de login sem inputs
- ❌ Tela de cadastro sem inputs
- ❌ Impossível fazer login/cadastro

---

## ✅ Solução

```css
/* DEPOIS (CORRETO): */
body.authenticated input[data-field="email"] {
  display: none !important; /* Esconde APENAS após autenticação */
}
```

**Resultado:**
- ✅ Inputs aparecem DURANTE login/cadastro
- ✅ Inputs desaparecem APÓS autenticação
- ✅ Login/cadastro funcionando
- ✅ Bug de inputs em outras telas resolvido

---

## 📦 Deploy

**URL:** https://vanilla-game-ooeg59x3w-amortus-projects.vercel.app  
**Status:** ✅ Corrigido e deployado

---

## 📝 Nota Técnica

O arquivo `client/public/auth-cleanup.css` está no `.gitignore`, por isso não aparece no git.  
A correção está no arquivo físico e foi deployada via Vercel build.

**Localização:** `E:\PROJETOS\Vectorizer\vanilla-game\client\public\auth-cleanup.css`

