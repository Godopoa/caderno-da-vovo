# 👵 Caderno da Vovó — Plataforma de Receitas Acessível (PC + Mobile + TudoGostoso)

Bem-vindo ao **Caderno da Vovó**, uma plataforma completa de receitas desenvolvida especialmente para a **terceira idade (idosos)**, com leitura em voz alta (`Text-to-Speech`), modo cozinha passo a passo em letras gigantes, temporizadores automáticos com alarme sonoro e integração direta com o **TudoGostoso (`tudogostoso.com.br`)**.

---

## 🚀 Como Abrir o Sistema (1 Clique)

1. Dê **2 cliques** no arquivo [`INICIAR_CADERNO_DA_VOVO.bat`](./INICIAR_CADERNO_DA_VOVO.bat) na raiz desta pasta.
2. Ele iniciará automaticamente a **API Backend (Porta 3333)** e o **Site / Painel (Porta 5173)**.

### Endereços de Acesso:
- 💻 **No Computador (PC):** `http://localhost:5173`
- 📱 **No Celular (conectado no mesmo Wi-Fi):** `http://192.168.1.214:5173`
- ⚙️ **API Backend:** `http://localhost:3333` (ou `http://192.168.1.214:3333`)

---

## ✨ Funcionalidades Construídas

1. **Acessibilidade Sênior (WCAG AAA):**
   - Fonte **Atkinson Hyperlegible** (criada especificamente para pessoas com baixa visão).
   - Botões globais no topo **`[ A- Diminuir ]`** e **`[ A+ Aumentar ]`** para regular o tamanho de toda a interface.
   - Alternância entre **Fundo Creme Acolhedor (`#FFFDF9`)** e **Alto Contraste Escuro**.
2. **Busca por Voz e "O que você tem na geladeira?":**
   - Botão **`🎤 Buscar por Voz`** para falar o nome da receita no microfone.
   - Botões rápidos de ingredientes (`🥚 Ovos`, `🥕 Cenoura`, `🍗 Frango`, `🥛 Leite`, `🥔 Batata`, `🧀 Queijo`, `🍚 Arroz`, `🍫 Chocolate`).
3. **Modo Cozinha Passo a Passo em Tela Cheia:**
   - Mostra **1 passo por vez** em letras gigantes.
   - Lê os ingredientes e cada passo em **voz alta (`pt-BR`)** com velocidade ajustável (*Normal* ou *Bem Pausada*).
   - Detecta tempos automaticamente nos passos (ex: *"asse por 40 minutos"*) e exibe um **Relógio Regressivo Gigante com Alarme Sonoro**.
   - Mantém a tela do celular acesa (`WakeLock API`) durante o preparo.
4. **Módulo Importer Oficial TudoGostoso (`🌐 Puxar do TudoGostoso`):**
   - **Busca e Importação em 1 Clique** direto pelo painel.
   - **Importação por URL única ou Lote de URLs** (`tudogostoso.com.br`).
   - Conversão automática de abreviações culinárias (`col. sopa` $\rightarrow$ `colher de sopa`, `xíc.` $\rightarrow$ `xícara`) para leitura natural por voz.
5. **Empacotamento Mobile Android/iOS (Capacitor):**
   - Projeto nativo Android já gerado em [`frontend/android/`](./frontend/android).
   - Funciona também **Offline**: todas as receitas abertas ficam salvas na memória do aparelho.
