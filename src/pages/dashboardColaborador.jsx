import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import LeitorPresenca from "./components/LeitorPresenca";


function DashboardColaborador() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const obterUsuarioLogado = () => {
    try {
      const usuarioSalvo = localStorage.getItem("usuario");
      if (usuarioSalvo) return JSON.parse(usuarioSalvo);
    } catch (e) {
      console.error("Erro ao processar objeto usuario do localStorage:", e);
    }

    return {
      id: localStorage.getItem("userId") || null,
      nome: localStorage.getItem("userName") || "Colaborador",
      email: localStorage.getItem("userEmail") || "E-mail não informado"
    };
  };

  const usuarioLogado = obterUsuarioLogado();

  const [meusEventos, setMeusEventos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  // 🔥 Controla se a seção do leitor de QR Code está visível
  const [mostrarLeitor, setMostrarLeitor] = useState(false);

  const carregarDadosColaborador = useCallback(async () => {
    if (!token) return;
    setCarregando(true);

    const headers = {
      "Authorization": `Bearer ${token.trim()}`,
      "Content-Type": "application/json"
    };

    try {
      const resVinculos = await fetch("https://projeto-congresso.onrender.com/colaborador/meu-historico", { headers });

      if (resVinculos.ok) {
        const vinculosDoUsuario = await resVinculos.json();
        setMeusEventos(vinculosDoUsuario);
      } else if (resVinculos.status === 401) {
        console.error("❌ Erro 401: Token inválido.");
        localStorage.clear();
        navigate("/login");
      } else {
        console.error(`Erro do servidor: Código HTTP ${resVinculos.status}`);
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setCarregando(false);
    }
  }, [token, navigate]);

  // Executa estritamente uma vez ao montar o componente
  useEffect(() => {
    if (!token) {
      navigate("/login");
    } else {
      carregarDadosColaborador();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 🔥 Correção das datas: Zera as horas para comparar apenas o "Dia" atual corretamente
  const dataAtual = new Date();
  dataAtual.setHours(0, 0, 0, 0);

  const proximosTrabalhos = meusEventos.filter(v => {
    if (!v.evento?.dataFim) return false;
    const dataFimEvento = new Date(v.evento.dataFim);
    return dataFimEvento >= dataAtual;
  });

  const historicoTrabalhado = meusEventos.filter(v => {
    if (!v.evento?.dataFim) return false;
    const dataFimEvento = new Date(v.evento.dataFim);
    return dataFimEvento < dataAtual;
  });

  return (
    <div style={{ background: "#12141c", color: "white", minHeight: "100vh", fontFamily: "sans-serif" }}>

      <header style={{ display: "flex", justifyContent: "space-between", padding: "20px 40px", background: "#1a1d24", borderBottom: "1px solid #2d3139" }}>
        <div>
          <h2 style={{ margin: 0 }}>Painel de Escalas 🤝</h2>
          <p style={{ margin: "5px 0 0 0", fontSize: "15px", color: "#a0a5b5" }}>
            Colaborador: <strong style={{ color: "#fff" }}>{usuarioLogado.nome}</strong> ({usuarioLogado.email})
          </p>
        </div>
        <button onClick={() => { localStorage.clear(); navigate("/"); }} style={{ background: "#dc3545", color: "white", border: "none", padding: "8px 15px", borderRadius: "4px", cursor: "pointer", alignSelf: "center" }}>
          Sair
        </button>
      </header>

      <main style={{ padding: "40px" }}>
        {carregando && <p style={{ color: "#007bff" }}>Carregando sua agenda...</p>}

        {!carregando && (
          <div>
            {/* SEÇÃO: LEITOR DE PRESENÇA (QR CODE) */}
            <section style={{ marginBottom: "40px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #8b5cf6", paddingBottom: "10px" }}>
                <h3 style={{ margin: 0, color: "#8b5cf6" }}>
                  🔍 Leitor de Presença (QR Code)
                </h3>
                <button
                  onClick={() => setMostrarLeitor((atual) => !atual)}
                  style={{
                    background: mostrarLeitor ? "#2d3139" : "#8b5cf6",
                    color: "white",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "bold"
                  }}
                >
                  {mostrarLeitor ? "Fechar Leitor" : "Abrir Leitor de QR Code"}
                </button>
              </div>

              {mostrarLeitor && (
                <div style={{ marginTop: "20px" }}>
                  <LeitorPresenca />
                </div>
              )}
            </section>

            <section style={{ marginBottom: "40px" }}>
              <h3 style={{ borderBottom: "2px solid #28a745", paddingBottom: "10px", color: "#28a745" }}>
                📅 Próximas Escalas (Eventos Confirmados)
              </h3>
              {proximosTrabalhos.length === 0 ? (
                <p style={{ color: "#6c757d", fontStyle: "italic" }}>Você não está escalado para nenhum evento futuro no momento.</p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px", marginTop: "20px" }}>
                  {proximosTrabalhos.map((v, index) => (
                    <div key={v.id || `prox-${index}`} style={{ background: "#1a1d24", padding: "20px", borderRadius: "8px", border: "1px solid #28a745" }}>
                      <h4 style={{ marginTop: 0, color: "#fff" }}>{v.evento?.titulo || v.evento?.nome}</h4>
                      <p style={{ fontSize: "14px", color: "#a0a5b5" }}>{v.evento?.descricao}</p>
                      <hr style={{ border: "0", borderTop: "1px solid #2d3139", margin: "15px 0" }} />
                      <p style={{ fontSize: "13px", margin: "5px 0" }}>📍 <strong>Local:</strong> {v.evento?.local}</p>
                      <p style={{ fontSize: "13px", margin: "5px 0" }}>📆 <strong>Início:</strong> {v.evento?.dataInicio ? new Date(v.evento.dataInicio).toLocaleString('pt-BR') : "-"}</p>
                      <p style={{ fontSize: "13px", margin: "5px 0" }}>⏱️ <strong>Carga Horária:</strong> {v.evento?.cargaHorariaTotal || v.evento?.cargaHoraria || 0}h</p>
                      <div style={{ marginTop: "15px", textAlign: "right" }}>
                        <span style={{ background: "#28a745", color: "white", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold" }}>Escalado</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section style={{ marginTop: "50px" }}>
              <h3 style={{ borderBottom: "2px solid #007bff", paddingBottom: "10px", color: "#007bff" }}>
                📜 Histórico de Eventos Trabalhados (Concluídos)
              </h3>

              <table style={{ width: "100%", borderCollapse: "collapse", background: "#1a1d24", borderRadius: "8px", overflow: "hidden", marginTop: "20px" }}>
                <thead>
                  <tr style={{ background: "#161920", textAlign: "left", borderBottom: "2px solid #2d3139" }}>
                    <th style={{ padding: "15px" }}>Evento</th>
                    <th style={{ padding: "15px" }}>Local</th>
                    <th style={{ padding: "15px" }}>Data de Encerramento</th>
                    <th style={{ padding: "15px" }}>Carga Horária</th>
                    <th style={{ padding: "15px" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {historicoTrabalhado.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ padding: "20px", textAlign: "center", color: "#a0a5b5" }}>
                        Nenhum evento concluído no seu histórico.
                      </td>
                    </tr>
                  ) : (
                    historicoTrabalhado.map((v, index) => (
                      <tr key={v.id || `hist-${index}`} style={{ borderBottom: "1px solid #2d3139" }}>
                        <td style={{ padding: "15px" }}><strong>{v.evento?.titulo || v.evento?.nome}</strong></td>
                        <td style={{ padding: "15px" }}>{v.evento?.local}</td>
                        <td style={{ padding: "15px" }}>{v.evento?.dataFim ? new Date(v.evento.dataFim).toLocaleDateString('pt-BR') : "-"}</td>
                        <td style={{ padding: "15px" }}>{v.evento?.cargaHorariaTotal || v.evento?.cargaHoraria || 0}h</td>
                        <td style={{ padding: "15px" }}>
                          <span style={{ background: "#6c757d", color: "white", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold" }}>
                            Finalizado
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default DashboardColaborador;
