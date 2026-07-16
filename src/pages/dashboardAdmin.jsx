import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// 🛠️ Importação de ícones modernos e consistentes
import { 
  Calendar, 
  BookOpen, 
  CheckCircle, 
  Users, 
  LogOut, 
  PlusCircle, 
  Edit2, 
  Trash2, 
  Search, 
  UserPlus 
} from "lucide-react";

function DashboardAdmin() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Abas do Painel: 'eventos' | 'minicursos' | 'presencas' | 'colaboradores'
  const [abaAtiva, setAbaAtiva] = useState("eventos");

  // Estados de Dados
  const [eventos, setEventos] = useState([]);
  const [minicursos, setMinicursos] = useState([]);
  const [presencas, setPresencas] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [usuariosSistema, setUsuariosSistema] = useState([]);
  const [inscricoesPorEvento, setInscricoesPorEvento] = useState({});

  // Estados de Formulários e Edição
  const [carregando, setCarregando] = useState(true);
  const [idEventoEditando, setIdEventoEditando] = useState(null);

  const [formEvento, setFormEvento] = useState({
    titulo: "", descricao: "", local: "",
    dataInicio: "", dataFim: "", cargaHorariaTotal: "", limiteParticipantes: "", videoUrl: ""
  });

  const [formMinicurso, setFormMinicurso] = useState({
    titulo: "", descricao: "", cargaHoraria: "", vagas: "", eventoId: "", filtroEventoId: ""
  });

  // Carregamento de Dados Centralizado
  const carregarDados = async () => {
    setCarregando(true);
    const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };

    try {
      const resEventos = await fetch("https://projeto-congresso.onrender.com/eventos");
      if (resEventos.ok) setEventos(await resEventos.json());

      const resMinicursos = await fetch("https://projeto-congresso.onrender.com/miniCurso", { headers });
      if (resMinicursos.ok) setMinicursos(await resMinicursos.json());

      const resPresencas = await fetch("https://projeto-congresso.onrender.com/presenca", { headers });
      if (resPresencas.ok) setPresencas(await resPresencas.json());

      const resColab = await fetch("https://projeto-congresso.onrender.com/colaborador", { headers });
      if (resColab.ok) setColaboradores(await resColab.json());

      const resUsuarios = await fetch("https://projeto-congresso.onrender.com/usuario/detalhes", { headers });
      if (resUsuarios.ok) setUsuariosSistema(await resUsuarios.json());

      // 🎯 Contagem de inscrições por evento
      const resContagemEvento = await fetch("https://projeto-congresso.onrender.com/inscricao/contagem", { headers });
      if (resContagemEvento.ok) setInscricoesPorEvento(await resContagemEvento.json());

    } catch (err) {
      console.error("Erro ao sincronizar dados do painel:", err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    carregarDados();
  }, [token]);

  // Ações de Evento
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
        videoUrl: formEvento.videoUrl || null,
      };

      let url = "https://projeto-congresso.onrender.com/eventos";
      let method = "POST";

      if (idEventoEditando) {
        url = `https://projeto-congresso.onrender.com/eventos/${idEventoEditando}`;
        method = "PUT";
      }

      const res = await fetch(url, { method, headers, body: JSON.stringify(dadosFormatados) });

      if (res.ok) {
        alert(idEventoEditando ? "Evento updated!" : "Evento criado com sucesso!");
        setIdEventoEditando(null);
        // ✨ CORREÇÃO 1: Adicionado videoUrl no reset do formulário
        setFormEvento({ titulo: "", descricao: "", local: "", dataInicio: "", dataFim: "", cargaHorariaTotal: "", limiteParticipantes: "", videoUrl: "" });
        carregarDados();
      } else {
        const errData = await res.json();
        alert(`Erro: ${errData.error || errData.message}`);
      }
    } catch (err) {
      alert("Erro ao conectar com o servidor.");
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
      limiteParticipantes: ev.limiteParticipantes || "",
      videoUrl: ev.videoUrl || ""
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleExcluirEvento = async (id) => {
    if (!confirm("Tem certeza que deseja remover este evento?")) return;
    try {
      const res = await fetch(`https://projeto-congresso.onrender.com/eventos/${id}`, {
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

    const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };
    const minicursoFormatado = {
      titulo: formMinicurso.titulo,
      descricao: formMinicurso.descricao,
      cargaHoraria: parseInt(formMinicurso.cargaHoraria, 10),
      vagas: parseInt(formMinicurso.vagas, 10),
      eventoId: parseInt(formMinicurso.eventoId, 10)
    };

    try {
      const res = await fetch("https://projeto-congresso.onrender.com/miniCurso", {
        method: "POST",
        headers,
        body: JSON.stringify(minicursoFormatado)
      });

      if (res.ok) {
        alert("Minicurso adicionado com sucesso! 🎉");
        setFormMinicurso({ ...formMinicurso, titulo: "", descricao: "", cargaHoraria: "", vagas: "", eventoId: "" });
        carregarDados();
      } else {
        const errData = await res.json();
        alert(`Erro: ${errData.error || errData.message}`);
      }
    } catch (err) {
      alert("Erro ao conectar com o servidor.");
    }
  };

  // 🎯 CORREÇÃO: Remove presenças duplicadas (mesmo participante lido várias vezes pelo QR)
  // Mantém sempre a primeira ocorrência; chave inclui minicursoId pra não misturar minicursos diferentes
  const removerDuplicadas = (lista) => {
    const vistos = new Set();
    return lista.filter(p => {
      const chave = `${p.inscricaoId}-${p.minicursoId || "evento"}`;
      if (vistos.has(chave)) return false;
      vistos.add(chave);
      return true;
    });
  };

  const eventoSelecionadoId = parseInt(formMinicurso.filtroEventoId, 10);

  const listaPresencaEvento = removerDuplicadas(
    presencas.filter(p => {
      if (p.tipo !== "EVENTO") return false;
      return (p.eventoId || p.inscricao?.eventoId) === eventoSelecionadoId;
    })
  );

  const listaPresencaMinicurso = removerDuplicadas(
    presencas.filter(p => {
      if (p.tipo !== "MINICURSO") return false;
      return (p.minicurso?.eventoId || p.inscricao?.minicurso?.eventoId) === eventoSelecionadoId;
    })
  );

  const colaboradoresDoEvento = colaboradores.filter(
    c => Number(c.eventoId) === Number(eventoSelecionadoId)
  );

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        .nav-btn { position: relative; transition: color 0.2s; }
        .nav-btn:hover { color: #3b82f6 !important; }
        .input-dark:focus { outline: none; border-color: #3b82f6 !important; box-shadow: 0 0 0 2px rgba(59,130,246,0.2); }
        .card-ev { transition: transform 0.2s, border-color 0.2s; }
        .card-ev:hover { transform: translateY(-2px); border-color: #4b5563 !important; }
        .btn-action { transition: opacity 0.2s; }
        .btn-action:hover { opacity: 0.9; }
        tr-row { transition: background-color 0.2s; }
        tr-row:hover { background-color: #242936; }
      `}</style>

      {/* HEADER BAR */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logoIcon}>🛠️</div>
          <h2 style={styles.headerTitle}>Painel Administrativo</h2>
        </div>
        <button onClick={() => { localStorage.clear(); navigate("/"); }} style={styles.btnSair} className="btn-action">
          <LogOut size={15} /> Sair do Painel
        </button>
      </header>

      {/* MENUS DE ABAS */}
      <nav style={styles.navBar}>
        {[
          { id: "eventos", label: "Gerenciar Eventos", icon: <Calendar size={16} /> },
          { id: "minicursos", label: "Minicursos", icon: <BookOpen size={16} /> },
          { id: "presencas", label: "Controle de Presença", icon: <CheckCircle size={16} /> },
          { id: "colaboradores", label: "Validar Colaboradores", icon: <Users size={16} /> }
        ].map((aba) => {
          const ativa = abaAtiva === aba.id;
          return (
            <button
              key={aba.id}
              onClick={() => setAbaAtiva(aba.id)}
              style={{
                ...styles.navBtn,
                color: ativa ? "#3b82f6" : "#9ca3af",
                borderBottom: ativa ? "3px solid #3b82f6" : "3px solid transparent",
              }}
              className="nav-btn"
            >
              {aba.icon}
              {aba.label}
            </button>
          );
        })}
      </nav>

      <main style={styles.mainContent}>
        {carregando && <div style={styles.loadingBanner}>Sincronizando dados com o servidor...</div>}

        {/* ==================== ABA: EVENTOS ==================== */}
        {abaAtiva === "eventos" && (
          <div>
            <h3 style={styles.sectionTitle}>
              {idEventoEditando ? <><Edit2 size={20} color="#fbbf24"/> Editar Evento</> : <><PlusCircle size={20} color="#10b981"/> Criar Novo Evento</>}
            </h3>
            
            <form onSubmit={handleSalvarEvento} style={styles.formContainer}>
              <div style={styles.row}>
                <input type="text" placeholder="Título do Evento" value={formEvento.titulo} onChange={e => setFormEvento({...formEvento, titulo: e.target.value})} required style={styles.input} className="input-dark" />
                <input type="text" placeholder="Local/Ambiente" value={formEvento.local} onChange={e => setFormEvento({...formEvento, local: e.target.value})} required style={styles.input} className="input-dark" />
              </div>
              <textarea placeholder="Descrição detalhada do evento" value={formEvento.descricao} onChange={e => setFormEvento({...formEvento, descricao: e.target.value})} required style={{ ...styles.input, minHeight: "90px", resize: "vertical" }} className="input-dark" />
              
              {/* ✨ CORREÇÃO 2: Campo visual adicionado para entrada do link do vídeo */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={styles.label}>Link do Vídeo de Apresentação (Opcional - YouTube)</label>
                <input type="url" placeholder="https://www.youtube.com/watch?v=... ou Embed" value={formEvento.videoUrl} onChange={e => setFormEvento({...formEvento, videoUrl: e.target.value})} style={styles.input} className="input-dark" />
              </div>

              <div style={styles.grid4}>
                <div>
                  <label style={styles.label}>Data de Início</label>
                  <input type="date" value={formEvento.dataInicio} onChange={e => setFormEvento({...formEvento, dataInicio: e.target.value})} required style={styles.input} className="input-dark" />
                </div>
                <div>
                  <label style={styles.label}>Data de Encerramento</label>
                  <input type="date" value={formEvento.dataFim} onChange={e => setFormEvento({...formEvento, dataFim: e.target.value})} required style={styles.input} className="input-dark" />
                </div>
                <div>
                  <label style={styles.label}>Carga Horária (h)</label>
                  <input type="number" placeholder="Ex: 40" value={formEvento.cargaHorariaTotal} onChange={e => setFormEvento({...formEvento, cargaHorariaTotal: e.target.value})} required style={styles.input} className="input-dark" />
                </div>
                <div>
                  <label style={styles.label}>Limite de Vagas</label>
                  <input type="number" placeholder="Ex: 150" value={formEvento.limiteParticipantes} onChange={e => setFormEvento({...formEvento, limiteParticipantes: e.target.value})} required style={styles.input} className="input-dark" />
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "5px" }}>
                <button type="submit" style={{ ...styles.btnPrimary, backgroundColor: idEventoEditando ? "#d97706" : "#10b981" }} className="btn-action">
                  {idEventoEditando ? "Salvar Alterações" : "Publicar Evento"}
                </button>
                {idEventoEditando && (
                  <button type="button" onClick={() => { setIdEventoEditando(null); setFormEvento({ titulo: "", descricao: "", local: "", dataInicio: "", dataFim: "", cargaHorariaTotal: "", limiteParticipantes: "", videoUrl: "" }); }} style={styles.btnSecondary} className="btn-action">
                    Cancelar
                  </button>
                )}
              </div>
            </form>

            <h3 style={styles.sectionTitle}>Eventos Ativos no Sistema</h3>
            <div style={styles.cardsGrid}>
              {eventos.map(ev => (
                <div key={ev.id} style={styles.eventCard} className="card-ev">
                  <h4 style={styles.cardTitle}>{ev.titulo}</h4>
                  <p style={styles.cardDesc}>{ev.descricao}</p>
                  <div style={styles.cardMeta}>
                    <span>📍 {ev.local}</span>
                    <span>⏱️ {ev.cargaHorariaTotal}h</span>
                    <span>👥 {inscricoesPorEvento[ev.id] || 0} inscritos</span>
                  </div>
                  <div style={styles.cardActions}>
                    <button onClick={() => handleIniciarEdicao(ev)} style={styles.btnEdit} className="btn-action"><Edit2 size={13}/> Editar</button>
                    <button onClick={() => handleExcluirEvento(ev.id)} style={styles.btnDelete} className="btn-action"><Trash2 size={13}/> Excluir</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== ABA: MINICURSOS ==================== */}
        {abaAtiva === "minicursos" && (
          <div>
            <h3 style={styles.sectionTitle}><PlusCircle size={20} color="#3b82f6"/> Vincular Novo Minicurso</h3>
            <form onSubmit={handleCriarMinicurso} style={styles.formContainer}>
              <select value={formMinicurso.eventoId} onChange={e => setFormMinicurso({...formMinicurso, eventoId: e.target.value})} required style={styles.input} className="input-dark">
                <option value="" style={{background: "#1e2230"}}>-- Selecione o Evento Pai --</option>
                {eventos.map(ev => (
                  <option key={ev.id} value={ev.id} style={{background: "#1e2230"}}>{ev.titulo}</option>
                ))}
              </select>
              
              <div style={{ display: "flex", gap: "15px" }}>
                <input type="text" placeholder="Título do Minicurso" value={formMinicurso.titulo} onChange={e => setFormMinicurso({...formMinicurso, titulo: e.target.value})} required style={{ ...styles.input, flex: 2 }} className="input-dark" />
                <input type="number" placeholder="Carga Horária (h)" value={formMinicurso.cargaHoraria} onChange={e => setFormMinicurso({...formMinicurso, cargaHoraria: e.target.value})} required style={{ ...styles.input, flex: 1 }} className="input-dark" />
                <input type="number" placeholder="Qtd Vagas" value={formMinicurso.vagas} onChange={e => setFormMinicurso({...formMinicurso, vagas: e.target.value})} required style={{ ...styles.input, flex: 1 }} className="input-dark" />
              </div>

              <textarea placeholder="Grade/Descrição resumida do minicurso" value={formMinicurso.descricao} onChange={e => setFormMinicurso({...formMinicurso, descricao: e.target.value})} required style={{ ...styles.input, minHeight: "70px" }} className="input-dark" />
              <button type="submit" style={{ ...styles.btnPrimary, backgroundColor: "#3b82f6" }} className="btn-action">Criar e Vincular</button>
            </form>

            <h3 style={styles.sectionTitle}>Minicursos Cadastrados</h3>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thRow}>
                    <th style={styles.th}>Minicurso</th>
                    <th style={styles.th}>Evento Relacionado</th>
                    <th style={styles.th}>Vagas</th>
                    <th style={styles.th}>Duração</th>
                  </tr>
                </thead>
                <tbody>
                  {minicursos.map(c => (
                    <tr key={c.id} style={styles.tdRow} className="tr-row">
                      <td style={styles.td}><strong>{c.titulo}</strong><br/><span style={styles.subText}>{c.descricao}</span></td>
                      <td style={{ ...styles.td, color: "#3b82f6", fontWeight: 500 }}>{c.evento?.titulo || `Evento #${c.eventoId}`}</td>
                      <td style={styles.td}>{c.vagas} vagas</td>
                      <td style={styles.td}>{c.cargaHoraria}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== ABA: PRESENÇAS ==================== */}
        {abaAtiva === "presencas" && (
          <div>
            <h3 style={styles.sectionTitle}><Search size={20} color="#10b981"/> Controle de Presença por Evento</h3>
            
            <div style={{ marginBottom: "25px" }}>
              <select 
                value={formMinicurso.filtroEventoId || ""} 
                onChange={e => setFormMinicurso({...formMinicurso, filtroEventoId: e.target.value})}
                style={styles.selectFilter}
                className="input-dark"
              >
                <option value="" style={{background: "#1e2230"}}>-- Escolha um Evento para analisar presenças --</option>
                {eventos.map(ev => (
                  <option key={ev.id} value={ev.id} style={{background: "#1e2230"}}>{ev.titulo}</option>
                ))}
              </select>
            </div>

            {formMinicurso.filtroEventoId ? (
              <div style={styles.grid2}>
                <div style={styles.tableCard}>
                  <h4 style={{ ...styles.cardTableTitle, color: "#10b981" }}>Entrada Principal (Evento)</h4>
                  <table style={styles.tableContainerMini}>
                    <thead>
                      <tr style={styles.thRowMini}>
                        <th style={styles.thMini}>Participante</th>
                        <th style={styles.thMini}>Inscrição</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listaPresencaEvento.length === 0 ? (
                        <tr><td colSpan="2" style={styles.emptyTd}>Nenhuma presença registrada.</td></tr>
                      ) : (
                        listaPresencaEvento.map(p => (
                          <tr key={p.id} style={styles.tdRowMini}>
                            <td style={styles.tdMini}>
                              <strong>{p.inscricao?.usuario?.nome || "Participante Anônimo"}</strong>
                              <br/><span style={styles.subText}>{p.inscricao?.usuario?.email || ""}</span>
                            </td>
                            <td style={styles.tdMiniCode}>#{p.inscricaoId}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div style={styles.tableCard}>
                  <h4 style={{ ...styles.cardTableTitle, color: "#06b6d4" }}>Acesso aos Minicursos</h4>
                  <table style={styles.tableContainerMini}>
                    <thead>
                      <tr style={styles.thRowMini}>
                        <th style={styles.thMini}>Participante</th>
                        <th style={styles.thMini}>Minicurso</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listaPresencaMinicurso.length === 0 ? (
                        <tr><td colSpan="2" style={styles.emptyTd}>Nenhuma presença em minicursos.</td></tr>
                      ) : (
                        listaPresencaMinicurso.map(p => (
                          <tr key={p.id} style={styles.tdRowMini}>
                            <td style={styles.tdMini}>
                              <strong>{p.inscricao?.usuario?.nome || "Participante Anônimo"}</strong>
                              <br/><span style={styles.subText}>{p.inscricao?.usuario?.email || ""}</span>
                            </td>
                            <td style={styles.tdMini}><span style={styles.badge}>{p.minicurso?.titulo || `Minicurso #${p.minicursoId}`}</span></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div style={styles.placeholderBox}>Escolha um evento no menu superior para filtrar as presenças.</div>
            )}
          </div>
        )}

        {/* ==================== ABA: COLABORADORES ==================== */}
        {abaAtiva === "colaboradores" && (
          <div>
            <h3 style={styles.sectionTitle}><Users size={20} color="#f59e0b"/> Gestão de Colaboradores por Evento</h3>
            
            <div style={{ marginBottom: "25px" }}>
              <select 
                value={formMinicurso.filtroEventoId || ""} 
                onChange={e => setFormMinicurso({...formMinicurso, filtroEventoId: e.target.value})}
                style={styles.selectFilter}
                className="input-dark"
              >
                <option value="" style={{background: "#1e2230"}}>-- Selecione o Evento de Gestão --</option>
                {eventos.map(ev => (
                  <option key={ev.id} value={ev.id} style={{background: "#1e2230"}}>{ev.titulo}</option>
                ))}
              </select>
            </div>

            {formMinicurso.filtroEventoId ? (
              <div style={styles.gridColumnsCustom}>
                <div style={styles.tableCard}>
                  <h4 style={{ ...styles.cardTableTitle, color: "#3b82f6", display: "flex", gap: "6px", alignItems: "center" }}><UserPlus size={16}/> Alocar Equipe</h4>
                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const selecaoUsuarioId = e.target.usuarioSelecionado.value;
                      const idEvento = parseInt(formMinicurso.filtroEventoId, 10);
                      if (!selecaoUsuarioId) return alert("Selecione um usuário!");

                      try {
                        const res = await fetch("https://projeto-congresso.onrender.com/colaborador", {
                          method: "POST",
                          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                          body: JSON.stringify({ eventoId: idEvento, usuarioId: parseInt(selecaoUsuarioId, 10) })
                        });

                        if (res.ok) {
                          alert("Colaborador vinculado! 🎉");
                          e.target.reset();
                          carregarDados();
                        } else {
                          alert("Este usuário já faz parte deste evento.");
                        }
                      } catch (err) {
                        alert("Erro ao conectar.");
                      }
                    }}
                    style={{ display: "flex", flexDirection: "column", gap: "14px" }}
                  >
                    <label style={styles.label}>Buscar Usuário:</label>
                    <select name="usuarioSelecionado" required style={styles.input} className="input-dark">
                      <option value="" style={{background: "#1e2230"}}>-- Selecione o usuário --</option>
                      {usuariosSistema.map(user => (
                        <option key={user.id} value={user.id} style={{background: "#1e2230"}}>{user.nome} ({user.email})</option>
                      ))}
                    </select>
                    <button type="submit" style={{ ...styles.btnPrimary, backgroundColor: "#10b981" }} className="btn-action">Autorizar Acesso</button>
                  </form>
                </div>

                <div style={styles.tableCard}>
                  <h4 style={{ ...styles.cardTableTitle, color: "#fbbf24" }}>Equipe Homologada</h4>
                  <table style={styles.tableContainerMini}>
                    <thead>
                      <tr style={styles.thRowMini}>
                        <th style={styles.thMini}>Registro</th>
                        <th style={styles.thMini}>Colaborador</th>
                        <th style={styles.thMini}>Usuário / E-mail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {colaboradoresDoEvento.length === 0 ? (
                        <tr><td colSpan="3" style={styles.emptyTd}>Nenhum colaborador alocado.</td></tr>
                      ) : (
                        colaboradoresDoEvento.map(c => (
                          <tr key={c.id} style={styles.tdRowMini}>
                            <td style={styles.tdMiniCode}>#{c.id}</td>
                            <td style={styles.tdMini}><strong>{c.usuario?.nome || `ID #${c.usuarioId}`}</strong></td>
                            <td style={styles.subTextMini}>{c.usuario?.email || "-"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div style={styles.placeholderBox}>Selecione um evento acima para gerenciar a equipe de colaboradores.</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  page: {
    fontFamily: "'Inter', sans-serif",
    backgroundColor: "#12141c",
    color: "#f3f4f6",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 40px",
    background: "#1e2230",
    borderBottom: "1px solid #2d3446",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: "12px" },
  logoIcon: { fontSize: "20px" },
  headerTitle: { fontSize: "18px", fontWeight: 700, margin: 0 },
  btnSair: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "#ef4444",
    color: "white",
    border: "none",
    padding: "8px 14px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
  },
  navBar: {
    display: "flex",
    background: "#1e2230",
    padding: "0 40px",
    gap: "24px",
    borderBottom: "1px solid #2d3446",
  },
  navBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "16px 4px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
  },
  mainContent: { flex: 1, padding: "40px" },
  loadingBanner: { color: "#3b82f6", fontSize: "14px", fontWeight: 500, marginBottom: "20px" },
  sectionTitle: { fontSize: "16px", fontWeight: 700, marginBottom: "18px", color: "#f3f4f6", display: "flex", alignItems: "center", gap: "8px" },
  formContainer: {
    background: "#1e2230",
    padding: "24px",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    marginBottom: "40px",
    border: "1px solid #2d3446"
  },
  row: { display: "flex", gap: "16px" },
  grid4: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", alignItems: "flex-end" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" },
  gridColumnsCustom: { display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "24px" },
  label: { fontSize: "12px", color: "#9ca3af", display: "block", marginBottom: "6px", fontWeight: 500 },
  input: {
    flex: 1,
    padding: "11px 14px",
    borderRadius: "8px",
    border: "1px solid #2d3446",
    background: "#12141c",
    color: "white",
    fontSize: "14px",
    fontFamily: "'Inter', sans-serif"
  },
  selectFilter: {
    padding: "12px 14px",
    width: "100%",
    maxWidth: "420px",
    borderRadius: "8px",
    border: "1px solid #2d3446",
    background: "#1e2230",
    color: "white",
    fontSize: "14px"
  },
  btnPrimary: {
    border: "none",
    color: "white",
    padding: "11px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "14px"
  },
  btnSecondary: {
    background: "#4b5563",
    color: "white",
    border: "none",
    padding: "11px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px"
  },
  cardsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" },
  eventCard: {
    background: "#1e2230",
    padding: "20px",
    borderRadius: "12px",
    border: "1px solid #2d3446"
  },
  cardTitle: { fontSize: "15px", fontWeight: 700, margin: "0 0 8px 0", color: "#f3f4f6" },
  cardDesc: { fontSize: "13px", color: "#9ca3af", margin: "0 0 14px 0", lineHeight: 1.5, height: "40px", overflow: "hidden" },
  cardMeta: { display: "flex", gap: "16px", fontSize: "12px", color: "#9ca3af", marginBottom: "16px" },
  cardActions: { display: "flex", gap: "10px" },
  btnEdit: { flex: 1, background: "#fbbf24", color: "#12141c", border: "none", padding: "8px", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" },
  btnDelete: { flex: 1, background: "#ef4444", color: "white", border: "none", padding: "8px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" },
  tableWrapper: { background: "#1e2230", borderRadius: "12px", border: "1px solid #2d3446", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  thRow: { borderBottom: "1px solid #2d3446", background: "#181b26", textAlign: "left" },
  th: { padding: "14px 20px", fontSize: "13px", fontWeight: 600, color: "#9ca3af" },
  tdRow: { borderBottom: "1px solid #2d3446" },
  td: { padding: "16px 20px", fontSize: "14px", color: "#f3f4f6" },
  subText: { fontSize: "12px", color: "#9ca3af", marginTop: "4px", display: "inline-block" },
  tableCard: { background: "#1e2230", padding: "20px", borderRadius: "12px", border: "1px solid #2d3446" },
  cardTableTitle: { fontSize: "14px", fontWeight: 700, margin: "0 0 16px 0" },
  tableContainerMini: { width: "100%", borderCollapse: "collapse" },
  thRowMini: { borderBottom: "1px solid #2d3446", textAlign: "left" },
  thMini: { padding: "8px 4px", fontSize: "12px", color: "#9ca3af" },
  tdRowMini: { borderBottom: "1px solid #1c1f2b" },
  tdMini: { padding: "10px 4px", fontSize: "13px" },
  tdMiniCode: { padding: "10px 4px", fontSize: "12px", color: "#9ca3af", fontFamily: "monospace" },
  subTextMini: { padding: "10px 4px", fontSize: "12px", color: "#9ca3af" },
  emptyTd: { padding: "20px 4px", textAlign: "center", color: "#9ca3af", fontSize: "13px" },
  badge: { background: "#2d3446", padding: "3px 8px", borderRadius: "4px", fontSize: "11px", color: "#f3f4f6" },
  placeholderBox: { padding: "40px", border: "2px dashed #2d3446", borderRadius: "12px", textAlign: "center", color: "#9ca3af", fontSize: "14px" }
};

export default DashboardAdmin;
