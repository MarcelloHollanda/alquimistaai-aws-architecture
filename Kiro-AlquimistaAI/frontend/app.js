// Catálogo de 32 agentes do ecossistema AlquimistaAI/Fibonacci.
// URL base da API Fibonacci (PROD). Troque se estiver diferente.
const API_BASE = "https://ogsd1547nd.execute-api.us-east-1.amazonaws.com";
const AGENTS = [
  // HERMES · CONTEÚDO & LANÇAMENTOS
  {
    name: "Hermes · Creator Pro",
    tag: "Conteúdo",
    category: "conteudo",
    desc: "Roteiriza, escreve e organiza conteúdos para redes e blogs."
  },
  {
    name: "Hermes · Social Care",
    tag: "Social",
    category: "social",
    desc: "Responde DMs/comentários com tom definido e limites claros."
  },
  {
    name: "Hermes · Email Marketing",
    tag: "Conteúdo",
    category: "conteudo",
    desc: "Cria e organiza campanhas de e-mail com foco em conversão."
  },
  {
    name: "Hermes · Script Maker",
    tag: "Conteúdo",
    category: "conteudo",
    desc: "Transforma ideias em roteiros prontos para vídeo e podcast."
  },
  {
    name: "Hermes · Launch Planner",
    tag: "Conteúdo",
    category: "conteudo",
    desc: "Ajuda a estruturar calendários de lançamentos e campanhas sazonais."
  },

  // SOPHIA · ATENDIMENTO & EXPERIÊNCIA
  {
    name: "Sophia · Suporte",
    tag: "Agenda/Atendimento",
    category: "agenda",
    desc: "Atende clientes, gera tickets e encaminha para o time certo."
  },
  {
    name: "Sophia · FAQ",
    tag: "Social",
    category: "social",
    desc: "Responde perguntas frequentes com base em base de conhecimento."
  },
  {
    name: "Sophia · Onboarding",
    tag: "Agenda/Operações",
    category: "agenda",
    desc: "Conduz novos clientes pelo passo a passo de implantação."
  },
  {
    name: "Sophia · Satisfaction Check",
    tag: "Pesquisa/Insights",
    category: "pesquisa",
    desc: "Coleta feedback, NPS e comentários pós-atendimento."
  },

  // ATLAS · OPERAÇÕES & ROTINAS
  {
    name: "Atlas · Agenda",
    tag: "Agenda",
    category: "agenda",
    desc: "Agenda, confirma e lembra reuniões/consultas."
  },
  {
    name: "Atlas · Documentos",
    tag: "Operações",
    category: "agenda",
    desc: "Organiza contratos, documentos e tarefas administrativas."
  },
  {
    name: "Atlas · Workflow Ops",
    tag: "Operações",
    category: "agenda",
    desc: "Orquestra checklists operacionais e tarefas recorrentes."
  },
  {
    name: "Atlas · Service Desk",
    tag: "Operações",
    category: "agenda",
    desc: "Centraliza solicitações internas entre equipes e áreas."
  },

  // ORACLE · ANÁLISES & ESTRATÉGIA
  {
    name: "Oracle · Insights",
    tag: "Pesquisa/Insights",
    category: "pesquisa",
    desc: "Gera relatórios e análises de desempenho a partir dos dados."
  },
  {
    name: "Oracle · Previsão",
    tag: "Pesquisa/Insights",
    category: "pesquisa",
    desc: "Ajuda a estimar resultados futuros a partir do histórico."
  },
  {
    name: "Oracle · Segmentação",
    tag: "Pesquisa/Insights",
    category: "pesquisa",
    desc: "Cria segmentos de público por comportamento e potencial."
  },
  {
    name: "Oracle · Growth Analyst",
    tag: "Pesquisa/Insights",
    category: "pesquisa",
    desc: "Aponta gargalos e oportunidades em funis de marketing e vendas."
  },

  // NIGREDO · PROSPECÇÃO & VENDAS
  {
    name: "Nigredo · Prospector",
    tag: "Vendas",
    category: "vendas",
    desc: "Identifica e qualifica leads para o time comercial."
  },
  {
    name: "Nigredo · Sales Flow",
    tag: "Vendas",
    category: "vendas",
    desc: "Orquestra follow-ups e cadências de contato."
  },
  {
    name: "Nigredo · Reativação",
    tag: "Vendas",
    category: "vendas",
    desc: "Resgata leads frios e clientes inativos com abordagens sob medida."
  },
  {
    name: "Nigredo · Upsell & Cross",
    tag: "Vendas",
    category: "vendas",
    desc: "Sugere ofertas complementares e upgrades conforme o perfil do cliente."
  },

  // TREASURER · FINANÇAS & COBRANÇA
  {
    name: "Treasurer · Finanças",
    tag: "Finanças",
    category: "financas",
    desc: "Auxilia em projeções, consolidação de entradas/saídas e alertas."
  },
  {
    name: "Treasurer · Cash Flow",
    tag: "Finanças",
    category: "financas",
    desc: "Organiza fluxo de caixa diário, semanal e mensal."
  },
  {
    name: "Treasurer · Cobrança Light",
    tag: "Finanças",
    category: "financas",
    desc: "Faz lembretes amigáveis de pagamento e acompanha respostas."
  },
  {
    name: "Treasurer · Pricing Lab",
    tag: "Finanças",
    category: "financas",
    desc: "Simula cenários de preço, margem e descontos por plano."
  },

  // GUARDIAN · GOVERNANÇA & RISCO
  {
    name: "Guardian · LGPD Watch",
    tag: "Pesquisa/Insights",
    category: "pesquisa",
    desc: "Verifica usos de dados, escopos e riscos para LGPD e compliance."
  },
  {
    name: "Guardian · Risk Monitor",
    tag: "Pesquisa/Insights",
    category: "pesquisa",
    desc: "Monitora incidentes, alertas críticos e padrões de risco."
  },

  // LIBRARIAN · CONHECIMENTO & DOCUMENTAÇÃO
  {
    name: "Librarian · Knowledge Base",
    tag: "Conteúdo",
    category: "conteudo",
    desc: "Constrói e organiza bases de conhecimento internas e externas."
  },
  {
    name: "Librarian · Docs Summarizer",
    tag: "Conteúdo",
    category: "conteudo",
    desc: "Resume contratos, relatórios e documentos longos para decisão rápida."
  },

  // RELAY · CONECTORES DE CANAIS
  {
    name: "Relay · WhatsApp Bridge",
    tag: "Social",
    category: "social",
    desc: "Orquestra fluxos de mensagens e handoff entre agentes e humanos no WhatsApp."
  },
  {
    name: "Relay · Email Bridge",
    tag: "Social",
    category: "social",
    desc: "Ajuda a distribuir e organizar e-mails entre caixas e responsáveis."
  },
  {
    name: "Relay · Multi-Channel Sync",
    tag: "Social",
    category: "social",
    desc: "Mantém consistência de mensagens entre WhatsApp, e-mail e redes sociais."
  }
];

function openAgentModal(agent) {
  const backdrop = document.getElementById("agent-modal");
  const nameEl = document.getElementById("agent-modal-name");
  const descEl = document.getElementById("agent-modal-desc");
  const contactEl = document.getElementById("agent-contact");
  const feedbackEl = document.getElementById("agent-modal-feedback");
  if (!backdrop || !nameEl || !descEl) return;

  nameEl.textContent = agent.name;
  descEl.textContent = agent.desc;
  if (contactEl) contactEl.value = "";
  if (feedbackEl) feedbackEl.textContent = "";

  backdrop.classList.add("open");
}

function closeAgentModal() {
  const backdrop = document.getElementById("agent-modal");
  if (!backdrop) return;
  backdrop.classList.remove("open");
}

function renderAgents(filter = "all") {
  const grid = document.getElementById("agents-grid");
  if (!grid) return;

  grid.innerHTML = "";

  const filtered = AGENTS.filter((agent) =>
    filter === "all" ? true : agent.category === filter
  );

  filtered.forEach((agent) => {
    const card = document.createElement("div");
    card.className = "agent-card";
    card.setAttribute("data-category", agent.category);

    card.innerHTML = `
      <div class="agent-name">${agent.name}</div>
      <div class="agent-tag">${agent.tag}</div>
      <div class="agent-desc">${agent.desc}</div>
      <button class="btn agent-select-btn" style="margin-top:8px;font-size:12px;padding:6px 10px;">
        Quero este agente
      </button>
    `;

    const btn = card.querySelector(".agent-select-btn");
    if (btn) {
      btn.addEventListener("click", () => openAgentModal(agent));
    }

    grid.appendChild(card);
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<p style="font-size:13px;color:var(--text-muted);">Nenhum agente encontrado para este filtro.</p>`;
  }
}

function setupFilters() {
  const chips = document.querySelectorAll(".filter-chip");
  if (!chips.length) return;

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      const filter = chip.getAttribute("data-filter") || "all";
      renderAgents(filter);
    });
  });
}

function setupModal() {
  const backdrop = document.getElementById("agent-modal");
  const closeBtn = document.getElementById("agent-modal-close");
  const sendBtn = document.getElementById("agent-modal-send");

  if (closeBtn) {
    closeBtn.addEventListener("click", closeAgentModal);
  }

  if (sendBtn) {
    sendBtn.addEventListener("click", () => {
      sendAgentInterest();
    });
  }

  if (backdrop) {
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) {
        closeAgentModal();
      }
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAgentModal();
    }
  });
}

function setupNavToggle() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav-links");

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      nav.classList.toggle("open");
    });
  }
}

async function sendAgentInterest() {
  const nameEl = document.getElementById("agent-modal-name");
  const contactEl = document.getElementById("agent-contact");
  const feedbackEl = document.getElementById("agent-modal-feedback");

  if (!nameEl || !contactEl || !feedbackEl) return;

  const contact = (contactEl.value || "").trim();
  if (!contact) {
    feedbackEl.textContent = "Informe um e-mail ou WhatsApp para entrarmos em contato.";
    return;
  }

  feedbackEl.textContent = "Enviando interesse...";
  try {
    const res = await fetch(API_BASE + "/public/agent-interest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentName: nameEl.textContent,
        contact,
        source: "site-frontend-prod"
      })
    });

    if (!res.ok) {
      throw new Error("Erro HTTP " + res.status);
    }

    feedbackEl.textContent = "Interesse registrado com sucesso. Em breve entraremos em contato.";
  } catch (err) {
    console.error(err);
    feedbackEl.textContent =
      "Não conseguimos registrar agora. Tente novamente mais tarde ou fale conosco pelo WhatsApp.";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // página de produtos
  if (document.getElementById("agents-grid")) {
  setupFilters();
  renderAgents("all");
  setupModal();
}

  // menu mobile (todas as páginas)
  setupNavToggle();
});
