import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

function DashboardAdmin() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Abas do Painel: 'eventos' | 'minicursos' | 'inscricoes' | 'presencas' | 'colaboradores'
  const [abaAtiva, setAbaAtiva] = useState("eventos");

  // Estados de Dados
  const [eventos, setEventos] = useState([]);
  const [minicursos, setMinicursos] = useState([]);
  const [presencas, setPresencas] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [usuariosSistema, setUsuariosSistema] = useState([]);

  // Estados de Formulários, Filtros e Edição
  const [carregando, setCarregando] = useState(true);
  const [idEventoEditando, setIdEventoEditando] = useState(null);
  const [filtroEventoId, setFiltroEventoId] = useState(""); // <-- CORRIGIDO: Estado de filtro isolado

  const [formEvento, setFormEvento] = useState({
    titulo: "", descricao: "", local: "",
    dataInicio: "", dataFim: "", cargaHorariaTotal: "", limiteParticipantes: ""
  });

  const [formMinicurso, setFormMinicurso] = useState({
    titulo: "", descricao: "", cargaHoraria: "", vagas: "", eventoId: ""
  });

  // Carregamento de Dados Centralizado Otimizado
  const carregarDados = useCallback(async () => {
    if (!token) return;
    setCarregando(true);
    const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };

    try {
      // Executa as requisições em paralelo para melhor performance
      const [resEventos, resMinicursos, resPresencas, resColab, resUsuarios] = await Promise.all([
        fetch("http://localhost:3000/eventos"),
        fetch("http://localhost:3000/miniCurso", { headers }),
        fetch("http://localhost:3000/presenca", { headers }),
        fetch("http://localhost:3000/colaborador", { headers }),
        fetch("http://localhost:3000/usuario/detalhes", { headers })
      ]);

      if (resEventos.ok) setEventos(await resEventos.json());
      if (resMinicursos.ok) setMinicursos(await resMinicursos.json());
      if (resPresencas.ok) setPresencas(await resPresencas.json());
      if (resColab.ok) setColaboradores(await resColab.json());
      if (resUsuarios.ok) setUsuariosSistema(await resUsuarios.json());

    } catch (err) {
      console.error("Erro ao sincronizar dados do painel:", err);
    } finally {
      setCarregando(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    carregarDados();
  }, [token, navigate, carregarDados]);

  // Ações de Evento (Criar / Editar / Remover)
  const handleSalvarEvento = async (e) => {
    e.preventDefault();
    const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };
    
    try {
      const dataInicioFormatada = new Date(`${formEvento.dataInicio}T08:00:00`).toISOString();
      const dataFimFormatada = new Date(`${formEvento.dataFim}T18:00:00`).toISOString();

      const dadosFormatados = {
        titulo: formEvento.titulo,
        descricao: formEvento.descricao,
        local: formEvento.local,
        dataInicio: dataInicioFormatada,
        dataFim: dataFimFormatada,
        cargaHorariaTotal: parseInt(formEvento.cargaHorariaTotal, 10),
        limiteParticipantes: parseInt(formEvento.limiteParticipantes, 10),
      };

      let url = "http://localhost:3000/eventos";
      let method = "POST";

      if (idEventoEditando) {
        url = `http://localhost:3000/eventos/${idEventoEditando}`;
        method = "PUT";
      }

      const res = await fetch(url, { method, headers, body: JSON.stringify(dadosFormatados) });

      if (res.ok) {
        alert(idEventoEditando ? "Evento atualizado!" : "Evento criado com sucesso!");
        setIdEventoEditando(null);
        setFormEvento({ titulo: "", descricao: "", local: "", dataInicio: "", dataFim: "", cargaHorariaTotal: "", limiteParticipantes: "" });
        carregarDados();
      } else {
        const errData = await res.json();
        alert(`Erro do Servidor: ${errData.error || errData.message || "Verifique o backend"}`);
      }
    } catch (err) {
      alert("Erro ao formatar os dados ou conectar com o servidor.");
      console.error(err);
    }
  };

  const handleIniciarEdicao = (ev) => {
    setIdEventoEditando(ev.id);
    setFormEvento({
      titulo: ev.titulo || ev.nome || "",
      descricao: ev.descricao || "",
      local: ev.local || "",
      dataInicio: ev.dataInicio ? ev.dataInicio.split("T")[0] : "",
      dataFim: ev.dataFim ? ev.dataFim.split("T")[0] : "",
      cargaHorariaTotal: ev.cargaHorariaTotal || "",
      limiteParticipantes: ev.limiteParticipantes || ""
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleExcluirEvento = async (id) => {
    if (!confirm("Tem certeza que deseja remover este evento? Isso pode afetar minicursos e inscrições vinculadas.")) return;
    try {
      const res = await fetch(`http://localhost:3000/eventos/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        alert("Evento removido!");
        carregarDados();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Ações de Minicurso
  const handleCriarMinicurso = async (e) => {
    e.preventDefault();
    if (!formMinicurso.eventoId) return alert("Selecione um evento para vincular este minicurso!");

    const headers = { 
      "Authorization": `Bearer ${token}`, 
      "Content-Type": "application/json" 
    };

    const minicursoFormatado = {
      titulo: formMinicurso.titulo,
      descricao: formMinicurso.descricao,
      cargaHoraria: parseInt(formMinicurso.cargaHoraria, 10),
      vagas: parseInt(formMinicurso.vagas, 10),
      eventoId: parseInt(formMinicurso.eventoId, 10)
    };

    try {
      const res = await fetch("http://localhost:3000/miniCurso", {
        method: "POST",
        headers,
        body: JSON.stringify(minicursoFormatado)
      });

      if (res.ok) {
        alert("Minicurso adicionado com sucesso! 🎉");
        setFormMinicurso({ titulo: "", descricao: "", cargaHoraria: "", vagas: "", eventoId: "" });
        carregarDados();
      } else {
        const errData = await res.json();
        alert(`Erro: ${errData.error || errData.message || "Verifique o backend"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao conectar com o servidor.");
    }
  };

  // Filtros Isolados e Seguros baseados no novo estado dedicado
  const eventoSelecionadoId = parseInt(filtroEventoId, 10);

  const listaPresencaEvento = presencas.filter(p => {
    if (p.tipo !== "EVENTO") return false;
    return (p.eventoId || p.inscricao?.eventoId) === eventoSelecionadoId;
  });

  const listaPresencaMinicurso = presencas.filter(p => {
    if (p.tipo !== "MINICURSO") return false;
    return (p.minicurso?.eventoId || p.inscricao?.minicurso?.eventoId) === eventoSelecionadoId;
  });

  const colaboradoresDoEvento = colaboradores.filter(c => c.eventoId === eventoSelecionadoId);

  return (
    <div style={{ background: "#12141c", color: "white", minHeight: "100vh", fontFamily: "sans-serif" }}>
      {/* HEADER BAR */}
      <header style={{ display: "flex", justifyContent: "space-between", padding: "20px 40px", background: "#1a1d24", borderBottom: "1px solid #2d3139" }}>
        <h2>Painel Administrativo 🛠️</h2>
        <button onClick={() => { localStorage.clear(); navigate("/"); }} style={{ background: "#dc3545", color: "white", border: "none", padding: "8px 15px", borderRadius: "4px", cursor: "pointer" }}>
          Sair do Painel
        </button>
      </header>

      {/* MENUS DE ABAS */}
      <nav style={{ display: "flex", background: "#1a1d24", padding: "0 40px", gap: "10px" }}>
        {[
          { id: "eventos", label: "Gerenciar Eventos" },
          { id: "minicursos", label: "Minicursos" },
          { id: "presencas", label: "Controle de Presença" },
          { id: "colaboradores", label: "Validar Colaboradores" }
        ].map((aba) => (
          <button
            key={aba.id}
            onClick={() => setAbaAtiva(aba.id)}
            style={{
              padding: "15px 20px", background: "none", color: abaAtiva === aba.id ? "#007bff" : "#a0a5b5",
              border: "none", borderBottom: abaAtiva === aba.id ? "3px solid #007bff" : "3px solid transparent",
              cursor: "pointer", fontWeight: "bold"
            }}
          >
            {aba.label}
          </button>
        ))}
      </nav>

      <main style={{ padding: "40px" }}>
        {carregando && <p style={{ color: "#007bff" }}>Sincronizando dados com o servidor...</p>}

        {/* ==================== ABA: EVENTOS ==================== */}
        {abaAtiva === "eventos" && (
          <div>
            <h3>{idEventoEditando ? "📝 Editar Evento" : "✨ Criar Novo Evento"}</h3>
            <form onSubmit={handleSalvarEvento} style={{ background: "#1a1d24", padding: "25px", borderRadius: "8px", display: "grid", gap: "15px", marginBottom: "40px" }}>
              <div style={{ display: "flex", gap: "15px" }}>
                <input type="text" placeholder="Título do Evento" value={formEvento.titulo} onChange={e => setFormEvento({...formEvento, titulo: e.target.value})} required style={{ flex: 1, padding: "10px", borderRadius: "4px", border: "1px solid #2d3139", background: "#12141c", color: "white" }} />
                <input type="text" placeholder="Local/Ambiente" value={formEvento.local} onChange={e => setFormEvento({...formEvento, local: e.target.value})} required style={{ flex: 1, padding: "10px", borderRadius: "4px", border: "1px solid #2d3139", background: "#12141c", color: "white" }} />
              </div>
              <textarea placeholder="Descrição detalhada do evento" value={formEvento.descricao} onChange={e => setFormEvento({...formEvento, descricao: e.target.value})} required style={{ padding: "10px", borderRadius: "4px", border: "1px solid #2d3139", background: "#12141c", color: "white", minHeight: "80px" }} />
              
              <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "12px", color: "#a0a5b5", display: "block", marginBottom: "5px" }}>Data de Início</label>
                  <input type="date" value={formEvento.dataInicio} onChange={e => setFormEvento({...formEvento, dataInicio: e.target.value})} required style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #2d3139", background: "#12141c", color: "white" }} />
                </div>
                
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "12px", color: "#a0a5b5", display: "block", marginBottom: "5px" }}>Data de Encerramento</label>
                  <input type="date" value={formEvento.dataFim} onChange={e => setFormEvento({...formEvento, dataFim: e.target.value})} required style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #2d3139", background: "#12141c", color: "white" }} />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "12px", color: "#a0a5b5", display: "block", marginBottom: "5px" }}>Carga Horária (h)</label>
                  <input type="number" placeholder="Ex: 40" value={formEvento.cargaHorariaTotal} onChange={e => setFormEvento({...formEvento, cargaHorariaTotal: e.target.value})} required style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #2d3139", background: "#12141c", color: "white" }} />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "12px", color: "#a0a5b5", display: "block", marginBottom: "5px" }}>Limite de Vagas</label>
                  <input type="number" placeholder="Ex: 150" value={formEvento.limiteParticipantes} onChange={e => setFormEvento({...formEvento, limiteParticipantes: e.target.value})} required style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #2d3139", background: "#12141c", color: "white" }} />
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button type="submit" style={{ background: "#28a745", color: "white", border: "none", padding: "12px 20px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
                  {idEventoEditando ? "Salvar Alterações" : "Publicar Evento"}
                </button>
                {idEventoEditando && (
                  <button type="button" onClick={() => { setIdEventoEditando(null); setFormEvento({ titulo: "", descricao: "", local: "", dataInicio: "", dataFim: "", cargaHorariaTotal: "", limiteParticipantes: "" }); }} style={{ background: "#6c757d", color: "white", border: "none", padding: "12px 20px", borderRadius: "4px", cursor: "pointer" }}>
                    Cancelar
                  </button>
                )}
              </div>
            </form>

            <h3>Eventos Ativos no Sistema</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
              {eventos.map(ev => (
                <div key={ev.id} style={{ background: "#1a1d24", padding: "20px", borderRadius: "8px", border: "1px solid #2d3139" }}>
                  <h4>{ev.titulo}</h4>
                  <p style={{ fontSize: "14px", color: "#a0a5b5" }}>{ev.descricao}</p>
                  <p style={{ fontSize: "13px" }}>📍 Local: {ev.local}</p>
                  <p style={{ fontSize: "13px" }}>⏱️ Carga Horária: {ev.cargaHorariaTotal}h</p>
                  <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                    <button onClick={() => handleIniciarEdicao(ev)} style={{ flex: 1, background: "#ffc107", color: "#12141c", border: "none", padding: "8px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Editar</button>
                    <button onClick={() => handleExcluirEvento(ev.id)} style={{ flex: 1, background: "#dc3545", color: "white", border: "none", padding: "8px", borderRadius: "4px", cursor: "pointer" }}>Excluir</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== ABA: MINICURSOS ==================== */}
        {abaAtiva === "minicursos" && (
          <div>
            <h3>Vincular Novo Minicurso a um Evento</h3>
            <form onSubmit={handleCriarMinicurso} style={{ background: "#1a1d24", padding: "25px", borderRadius: "8px", display: "grid", gap: "15px", marginBottom: "40px" }}>
              <select value={formMinicurso.eventoId} onChange={e => setFormMinicurso({...formMinicurso, eventoId: e.target.value})} required style={{ padding: "10px", borderRadius: "4px", border: "1px solid #2d3139", background: "#12141c", color: "white" }}>
                <option value="">-- Selecione o Evento Pai --</option>
                {eventos.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.titulo}</option>
                ))}
              </select>
              
              <div style={{ display: "flex", gap: "15px" }}>
                <input type="text" placeholder="Título do Minicurso" value={formMinicurso.titulo} onChange={e => setFormMinicurso({...formMinicurso, titulo: e.target.value})} required style={{ flex: 2, padding: "10px", borderRadius: "4px", border: "1px solid #2d3139", background: "#12141c", color: "white" }} />
                <input type="number" placeholder="Carga Horária (h)" value={formMinicurso.cargaHoraria} onChange={e => setFormMinicurso({...formMinicurso, cargaHoraria: e.target.value})} required style={{ flex: 1, padding: "10px", borderRadius: "4px", border: "1px solid #2d3139", background: "#12141c", color: "white" }} />
                <input type="number" placeholder="Qtd Vagas" value={formMinicurso.vagas} onChange={e => setFormMinicurso({...formMinicurso, vagas: e.target.value})} required style={{ flex: 1, padding: "10px", borderRadius: "4px", border: "1px solid #2d3139", background: "#12141c", color: "white" }} />
              </div>

              <textarea placeholder="Grade/Descrição resumida do minicurso" value={formMinicurso.descricao} onChange={e => setFormMinicurso({...formMinicurso, descricao: e.target.value})} required style={{ padding: "10px", borderRadius: "4px", border: "1px solid #2d3139", background: "#12141c", color: "white", minHeight: "60px" }} />
              <button type="submit" style={{ background: "#007bff", color: "white", border: "none", padding: "12px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Criar e Vincular</button>
            </form>

            <h3>Minicursos Cadastrados</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", background: "#1a1d24", borderRadius: "8px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #2d3139", textAlign: "left" }}>
                  <th style={{ padding: "12px" }}>Minicurso</th>
                  <th style={{ padding: "12px" }}>Evento Relacionado</th>
                  <th style={{ padding: "12px" }}>Vagas</th>
                  <th style={{ padding: "12px" }}>Duração</th>
                </tr>
              </thead>
              <tbody>
                {minicursos.map(c => (
                  <tr key={c.id} style={{ borderBottom: "1px solid #2d3139" }}>
                    <td style={{ padding: "12px" }}><strong>{c.titulo}</strong><br/><span style={{ fontSize: "12px", color: "#a0a5b5" }}>{c.descricao}</span></td>
                    <td style={{ padding: "12px", color: "#007bff" }}>{c.evento?.titulo || `Evento #${c.eventoId}`}</td>
                    <td style={{ padding: "12px" }}>{c.vagas} vagas</td>
                    <td style={{ padding: "12px" }}>{c.cargaHoraria}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ==================== ABA: PRESENÇAS ==================== */}
        {abaAtiva === "presencas" && (
          <div>
            <h3>Controle de Presença por Evento</h3>
            <p style={{ color: "#a0a5b5", marginBottom: "20px" }}>Selecione um evento abaixo para gerenciar e visualizar a lista de participantes presentes.</p>

            <div style={{ marginBottom: "30px" }}>
              <select 
                value={filtroEventoId} 
                onChange={e => setFiltroEventoId(e.target.value)}
                style={{ padding: "12px", width: "100%", maxWidth: "400px", borderRadius: "4px", border: "1px solid #2d3139", background: "#1a1d24", color: "white", fontSize: "16px" }}
              >
                <option value="">-- Escolha um Evento para ver as presenças --</option>
                {eventos.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.titulo}</option>
                ))}
              </select>
            </div>

            {filtroEventoId ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                
                {/* COLUNA A: PRESENÇA NO EVENTO PRINCIPAL */}
                <div style={{ background: "#1a1d24", padding: "20px", borderRadius: "8px", border: "1px solid #2d3139" }}>
                  <h4 style={{ color: "#28a745", borderBottom: "1px solid #2d3139", paddingBottom: "10px", marginTop: 0 }}>
                    Entrada Principal (Evento)
                  </h4>
                  <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #2d3139", textAlign: "left", fontSize: "13px", color: "#a0a5b5" }}>
                        <th style={{ padding: "8px" }}>Participante</th>
                        <th style={{ padding: "8px" }}>Inscrição</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listaPresencaEvento.length === 0 ? (
                        <tr><td colSpan="2" style={{ padding: "15px", textAlign: "center", color: "#a0a5b5", fontSize: "14px" }}>Nenhuma presença registrada para o evento principal.</td></tr>
                      ) : (
                        listaPresencaEvento.map(p => (
                          <tr key={p.id} style={{ borderBottom: "1px solid #12141c" }}>
                            <td style={{ padding: "8px" }}>
                              <strong>{p.inscricao?.usuario?.nome || "Participante Anônimo"}</strong>
                              <br/><span style={{ fontSize: "11px", color: "#a0a5b5" }}>{p.inscricao?.usuario?.email || ""}</span>
                            </td>
                            <td style={{ padding: "8px", color: "#a0a5b5", fontSize: "13px" }}>#{p.inscricaoId}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* COLUNA B: PRESENÇA NOS MINICURSOS */}
                <div style={{ background: "#1a1d24", padding: "20px", borderRadius: "8px", border: "1px solid #2d3139" }}>
                  <h4 style={{ color: "#17a2b8", borderBottom: "1px solid #2d3139", paddingBottom: "10px", marginTop: 0 }}>
                    Acesso aos Minicursos
                  </h4>
                  <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #2d3139", textAlign: "left", fontSize: "13px", color: "#a0a5b5" }}>
                        <th style={{ padding: "8px" }}>Participante</th>
                        <th style={{ padding: "8px" }}>Minicurso</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listaPresencaMinicurso.length === 0 ? (
                        <tr><td colSpan="2" style={{ padding: "15px", textAlign: "center", color: "#a0a5b5", fontSize: "14px" }}>Nenhuma presença registrada em minicursos deste evento.</td></tr>
                      ) : (
                        listaPresencaMinicurso.map(p => (
                          <tr key={p.id} style={{ borderBottom: "1px solid #12141c" }}>
                            <td style={{ padding: "8px" }}>
                              <strong>{p.inscricao?.usuario?.nome || "Participante Anônimo"}</strong>
                              <br/><span style={{ fontSize: "11px", color: "#a0a5b5" }}>{p.inscricao?.usuario?.email || ""}</span>
                            </td>
                            <td style={{ padding: "8px" }}>
                              <span style={{ background: "#2d3139", padding: "2px 6px", borderRadius: "4px", fontSize: "12px" }}>
                                {p.minicurso?.titulo || `Minicurso #${p.minicursoId}`}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

              </div>
            ) : (
              <div style={{ padding: "40px", border: "2px dashed #2d3139", borderRadius: "8px", textAlign: "center", color: "#a0a5b5" }}>
                Escolha um evento no seletor acima para carregar as listas de presença correspondentes.
              </div>
            )}
          </div>
        )}

        {/* ==================== ABA: COLABORADORES ==================== */}
        {abaAtiva === "colaboradores" && (
          <div>
            <h3>Gestão de Colaboradores por Evento</h3>
            <p style={{ color: "#a0a5b5", marginBottom: "20px" }}>
              Selecione um evento para gerenciar a equipe e validar novos colaboradores.
            </p>

            {/* SELETOR DE EVENTO GLOBAL DA ABA */}
            <div style={{ marginBottom: "30px" }}>
              <select 
                value={filtroEventoId} 
                onChange={e => setFiltroEventoId(e.target.value)}
                style={{ padding: "12px", width: "100%", maxWidth: "400px", borderRadius: "4px", border: "1px solid #2d3139", background: "#1a1d24", color: "white", fontSize: "16px" }}
              >
                <option value="">-- Escolha um Evento --</option>
                {eventos.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.titulo}</option>
                ))}
              </select>
            </div>

            {filtroEventoId ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "30px" }}>
                
                {/* FORMULÁRIO UNIFICADO: ADICIONAR NOVO COLABORADOR */}
                <div style={{ background: "#1a1d24", padding: "20px", borderRadius: "8px", border: "1px solid #2d3139", height: "fit-content" }}>
                  <h4 style={{ marginTop: 0, color: "#007bff" }}>Validar Novo Colaborador</h4>
                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const selecaoUsuarioId = e.target.usuarioSelecionado.value;
                      const idEvento = parseInt(filtroEventoId, 10);

                      if (!selecaoUsuarioId) return alert("Selecione um usuário da lista!");

                      try {
                        const res = await fetch("http://localhost:3000/colaborador", {
                          method: "POST",
                          headers: { 
                            "Authorization": `Bearer ${token}`, 
                            "Content-Type": "application/json" 
                          },
                          body: JSON.stringify({
                            eventoId: idEvento,
                            usuarioId: parseInt(selecaoUsuarioId, 10)
                          })
                        });

                        if (res.ok) {
                          alert("Colaborador vinculado e validado com sucesso! 🎉");
                          e.target.reset();
                          carregarDados();
                        } else {
                          const errData = await res.json();
                          alert(`Erro: ${errData.error || "Este usuário já é colaborador deste evento."}`);
                        }
                      } catch (err) {
                        console.error(err);
                        alert("Erro ao conectar com o servidor.");
                      }
                    }}
                    style={{ display: "flex", flexDirection: "column", gap: "12px" }}
                  >
                    <label style={{ fontSize: "13px", color: "#a0a5b5" }}>Selecione o Usuário por Nome:</label>
                    <select 
                      name="usuarioSelecionado" 
                      required 
                      style={{ padding: "10px", borderRadius: "4px", border: "1px solid #2d3139", background: "#12141c", color: "white" }}
                    >
                      <option value="">-- Escolha o usuário --</option>
                      {usuariosSistema.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.nome} ({user.email})
                        </option>
                      ))}
                    </select>

                    <button 
                      type="submit" 
                      style={{ background: "#28a745", color: "white", border: "none", padding: "10px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
                    >
                      Vincular e Validar Equipe
                    </button>
                  </form>
                </div>

                {/* TABELA DE LISTAGEM DOS COLABORADORES DO EVENTO */}
                <div style={{ background: "#1a1d24", padding: "20px", borderRadius: "8px", border: "1px solid #2d3139" }}>
                  <h4 style={{ marginTop: 0, color: "#ffc107" }}>Equipe de Colaboradores Alocada</h4>
                  <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #2d3139", textAlign: "left", fontSize: "13px", color: "#a0a5b5" }}>
                        <th style={{ padding: "8px" }}>ID Reg</th>
                        <th style={{ padding: "8px" }}>Nome do Colaborador</th>
                        <th style={{ padding: "8px" }}>E-mail corporativo / usuário</th>
                      </tr>
                    </thead>
                    <tbody>
                      {colaboradoresDoEvento.length === 0 ? (
                        <tr><td colSpan="3" style={{ padding: "15px", textAlign: "center", color: "#a0a5b5", fontSize: "14px" }}>Nenhum colaborador alocado para este evento.</td></tr>
                      ) : (
                        colaboradoresDoEvento.map(c => (
                          <tr key={c.id} style={{ borderBottom: "1px solid #12141c" }}>
                            <td style={{ padding: "8px", color: "#a0a5b5" }}>#{c.id}</td>
                            <td style={{ padding: "8px" }}><strong>{c.usuario?.nome || `Usuário #${c.usuarioId}`}</strong></td>
                            <td style={{ padding: "8px", color: "#a0a5b5" }}>{c.usuario?.email || "-"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

              </div>
            ) : (
              <div style={{ padding: "40px", border: "2px dashed #2d3139", borderRadius: "8px", textAlign: "center", color: "#a0a5b5" }}>
                Selecione um evento no topo para gerenciar e visualizar a equipe de colaboradores.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default DashboardAdmin;