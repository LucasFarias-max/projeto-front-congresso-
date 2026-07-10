import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
// Importando os ícones modernos alinhados com a identidade visual da Home
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  GraduationCap, 
  LogOut, 
  Sparkles,
  QrCode,
  Award,
  ArrowLeft
} from "lucide-react";

function DashboardParticipante() {
  const [inscricoesEventos, setInscricoesEventos] = useState([]);
  const [inscricoesMinicursos, setInscricoesMinicursos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [nomeUsuario, setNomeUsuario] = useState(""); 
  
  // Estado para controlar o loading do certificado enquanto bate no backend
  const [carregandoCertificado, setCarregandoCertificado] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");
    const nomeSalvo = localStorage.getItem("userName") || "Participante";
    
    setNomeUsuario(nomeSalvo);

    if (!token || role !== "PARTICIPANTE") {
      localStorage.clear();
      navigate("/login");
      return;
    }

    const buscarDadosDashboard = async () => {
      try {
        setCarregando(true);
        
        const headers = {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        };

        const resEventos = await fetch("https://projeto-congresso.onrender.com/inscricao", { headers });
        if (!resEventos.ok) throw new Error("Erro ao buscar inscrições de eventos.");
        const dadosEventos = await resEventos.json();

        const resMinicursos = await fetch("https://projeto-congresso.onrender.com/inscricaoCurso", { headers });
        if (!resMinicursos.ok) throw new Error("Erro ao buscar inscrições de minicursos.");
        const dadosMinicursos = await resMinicursos.json();

        setInscricoesEventos(dadosEventos);
        setInscricoesMinicursos(dadosMinicursos);

      } catch (err) {
        setErro(err.message);
      } finally {
        setCarregando(false);
      }
    };

    buscarDadosDashboard();
  }, [navigate]);

  // FUNÇÃO PARA EMITIR OU RECUPERAR O CERTIFICADO
  const lidarComEmissaoCertificado = async (eventoId, minicursoId = null) => {
    if (!eventoId) {
      alert("Erro: ID do evento não encontrado para este certificado.");
      return;
    }

    try {
      setCarregandoCertificado(true);
      const token = localStorage.getItem("token");

      const response = await fetch("https://projeto-congresso.onrender.com/certificados", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          eventoId: Number(eventoId),
          minicursoId: minicursoId ? Number(minicursoId) : null
        })
      });

      const dados = await response.json();

      if (!response.ok) {
        throw new Error(dados.erro || "Não foi possível emitir o certificado.");
      }

      // Sucesso! Redireciona para a página de visualização passando o objeto do certificado
      navigate(`/visualizar-certificado/${dados.id}`, { state: { certificado: dados } });

    } catch (err) {
      alert(`Aviso: ${err.message}`);
    } finally {
      setCarregandoCertificado(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div style={styles.page}>
      {/* Fontes globais + Regras de Animação idênticas à Home */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        .dashboard-card { transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; }
        .dashboard-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(15, 23, 41, 0.06); border-color: #bfdbfe; }
        .btn-primario:hover { background-color: #1d4ed8 !important; }
        .btn-ghost:hover { background-color: #f1f5f9 !important; }
        .btn-success:hover { background-color: #059669 !important; }
        .btn-gold:hover { background-color: #ca8a04 !important; }
      `}</style>

      {/* HEADER INTEGRADO */}
      <header style={styles.header}>
        <div style={styles.logoBox}>
          <div style={styles.logoIcone}>◆</div>
          <div>
            <div style={styles.logoTexto}>CONECTA</div>
            <div style={styles.logoSubtexto}>PAINEL</div>
          </div>
        </div>

        <div style={styles.headerAcoes}>
          <button onClick={() => navigate("/")} style={styles.botaoHome} className="btn-ghost">
            <ArrowLeft size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            Ver Novos Eventos
          </button>
          <button onClick={handleLogout} style={styles.botaoSair}>
            <LogOut size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            Sair
          </button>
        </div>
      </header>

      {/* HERO DO PAINEL */}
      <section style={styles.hero}>
        <div style={styles.heroConteudo}>
          <span style={styles.heroBadge}>ÁREA DO PARTICIPANTE</span>
          <h1 style={styles.heroTitulo}>
            Olá, <span style={styles.heroDestaque}>{nomeUsuario}</span>! 🎓
          </h1>
          <p style={styles.heroDescricao}>
            Gerencie suas inscrições, acesse seus comprovantes digitais com QR Code e emita seus certificados de conclusão.
          </p>
        </div>
      </section>

      {/* CONTEÚDO PRINCIPAL DO DASHBOARD */}
      <main style={styles.conteudoPrincipal}>
        {erro && <div style={styles.erroBox}>{erro}</div>}
        {carregando && <p style={styles.textoCarregando}>Carregando sua programação...</p>}

        {!carregando && (
          <>
            {/* SEÇÃO 1: SEUS CONGRESSOS / EVENTOS */}
            <section style={styles.secao}>
              <div style={styles.tituloSecaoBox}>
                <span style={styles.eyebrow}>
                  <Calendar size={14} style={{ display: 'inline', marginRight: '6px', marginBottom: '-2px' }} /> 
                  Passaportes
                </span>
                <h2 style={styles.tituloSecao}>Meus Eventos & Congressos</h2>
              </div>

              {inscricoesEventos.length === 0 ? (
                <p style={styles.textoVazio}>Você não está inscrito em nenhum evento principal ainda.</p>
              ) : (
                <div style={styles.grid}>
                  {inscricoesEventos.map((item) => (
                    <div key={item.id} className="dashboard-card" style={styles.card}>
                      <div style={styles.cardTopo}>
                        <div style={styles.cardIcone}>
                          <GraduationCap size={22} color="#2563eb" />
                        </div>
                        <span style={styles.badgeStatus}>{item.status}</span>
                      </div>

                      <h3 style={styles.cardTitulo}>{item.evento?.nome || item.evento?.titulo || "Evento sem nome"}</h3>
                      
                      <div style={styles.cardMetaGrid}>
                        <div style={styles.cardMetaItem}>
                          <MapPin size={14} color="#64748b" />
                          <span>{item.evento?.local}</span>
                        </div>
                        <div style={styles.cardMetaItem}>
                          <Calendar size={14} color="#64748b" />
                          <span>{item.evento?.dataInicio ? new Date(item.evento.dataInicio).toLocaleDateString() : "Ver na Home"}</span>
                        </div>
                      </div>

                      <div style={styles.botoesContainer}>
                        <button 
                          onClick={() => navigate(`/comprovante/${item.id}`)} 
                          style={styles.botaoQr}
                          className="btn-primario"
                        >
                          <QrCode size={15} /> Ver QR Code de Entrada
                        </button>

                        <button
                          onClick={() => lidarComEmissaoCertificado(item.eventoId)}
                          style={styles.botaoCertificado}
                          className="btn-gold"
                          disabled={carregandoCertificado}
                        >
                          <Award size={15} /> {carregandoCertificado ? "Processando..." : "Emitir Certificado"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* SEÇÃO 2: SEUS MINICURSOS */}
            <section style={styles.secao}>
              <div style={styles.tituloSecaoBox}>
                <span style={styles.eyebrow}>
                  <Sparkles size={14} style={{ display: 'inline', marginRight: '6px', marginBottom: '-2px' }} /> 
                  Especializações
                </span>
                <h2 style={styles.tituloSecao}>Meus Minicursos Inscritos</h2>
              </div>

              {inscricoesMinicursos.length === 0 ? (
                <p style={styles.textoVazio}>Você ainda não garantiu vaga em nenhum minicurso.</p>
              ) : (
                <div style={styles.grid}>
                  {inscricoesMinicursos.map((item) => {
                    const idDoEvento = item.minicurso?.eventoId || item.inscricao?.eventoId;

                    return (
                      <div key={item.id} className="dashboard-card" style={{ ...styles.card, borderLeft: "4px solid #10b981" }}>
                        <div style={styles.cardTopo}>
                          <h3 style={styles.cardTitulo}>{item.minicurso?.titulo || "Minicurso"}</h3>
                          <span style={styles.badgeMinicurso}>Confirmado 🚀</span>
                        </div>

                        <div style={styles.cardMetaGrid}>
                          <div style={styles.cardMetaItem}>
                            <Clock size={14} color="#64748b" />
                            <span>{item.minicurso?.cargaHoraria || "N/A"}h de Carga Horária</span>
                          </div>
                          <div style={styles.cardMetaItem}>
                            <Users size={14} color="#64748b" />
                            <span>Inscrição #{item.id}</span>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => lidarComEmissaoCertificado(idDoEvento, item.minicursoId)}
                          style={{ ...styles.botaoCertificado, marginTop: "12px" }}
                          className="btn-gold"
                          disabled={carregandoCertificado}
                        >
                          <Award size={15} /> {carregandoCertificado ? "Processando..." : "Certificado Minicurso"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* FOOTER COERENTE */}
      <footer style={styles.footer}>
        <div style={styles.footerTopo}>
          <div style={styles.logoBox}>
            <div style={styles.logoIcone}>◆</div>
            <div>
              <div style={{ ...styles.logoTexto, color: "#fff" }}>CONECTA</div>
              <div style={styles.logoSubtexto}>EVENTOS</div>
            </div>
          </div>
        </div>
        <p style={styles.footerCopyright}>© {new Date().getFullYear()} Conecta Eventos. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

// Folha de estilos alinhada 100% com o padrão moderno e claro da Home
const styles = {
  page: {
    fontFamily: "'Inter', sans-serif",
    backgroundColor: "#ffffff",
    color: "#0f172a",
    minHeight: "100vh",
  },

  // HEADER
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 48px",
    borderBottom: "1px solid #e2e8f0",
    position: "sticky",
    top: 0,
    backgroundColor: "rgba(255,255,255,0.9)",
    backdropFilter: "blur(8px)",
    zIndex: 10,
  },
  logoBox: { display: "flex", alignItems: "center", gap: "10px" },
  logoIcone: {
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
  },
  logoTexto: { fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "16px", lineHeight: 1, color: "#0f172a" },
  logoSubtexto: { fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "11px", letterSpacing: "1.5px", color: "#2563eb" },
  headerAcoes: { display: "flex", alignItems: "center", gap: "14px" },
  botaoHome: { display: "flex", alignItems: "center", padding: "9px 18px", backgroundColor: "transparent", color: "#0f172a", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" },
  botaoSair: { display: "flex", alignItems: "center", padding: "9px 16px", backgroundColor: "transparent", color: "#ef4444", border: "1px solid #fecaca", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 600, transition: "all 0.2s" },

  // HERO
  hero: {
    background: "linear-gradient(135deg, #0f1729 0%, #14213d 60%, #1e3a8a 130%)",
    padding: "64px 48px 72px",
    display: "flex",
    justifyContent: "center",
  },
  heroConteudo: { maxWidth: "760px", textAlign: "center" },
  heroBadge: {
    display: "inline-block",
    padding: "6px 14px",
    borderRadius: "999px",
    backgroundColor: "rgba(37, 99, 235, 0.2)",
    color: "#93c5fd",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "1px",
    marginBottom: "20px",
  },
  heroTitulo: {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 700,
    fontSize: "38px",
    lineHeight: 1.2,
    color: "#f8fafc",
    margin: "0 0 16px 0",
  },
  heroDestaque: { color: "#60a5fa" },
  heroDescricao: { fontSize: "15px", color: "#cbd5e1", lineHeight: 1.6, maxWidth: "580px", margin: "0 auto" },

  // SEÇÕES DE CONTEÚDO
  conteudoPrincipal: { padding: "60px 48px 40px", maxWidth: "1240px", margin: "0 auto" },
  secao: { marginBottom: "56px" },
  tituloSecaoBox: { textAlign: "left", marginBottom: "28px" },
  eyebrow: { display: "block", fontSize: "12px", fontWeight: 700, color: "#2563eb", letterSpacing: "0.5px", marginBottom: "4px" },
  tituloSecao: { fontFamily: "'Poppins', sans-serif", fontSize: "24px", fontWeight: 700, margin: 0, color: "#0f172a" },
  textoCarregando: { textAlign: "center", color: "#64748b", fontSize: "15px" },
  textoVazio: { textAlign: "left", color: "#94a3b8", fontStyle: "italic", fontSize: "14px" },
  erroBox: { backgroundColor: "#fef2f2", border: "1px solid #fee2e2", color: "#ef4444", padding: "14px", borderRadius: "10px", marginBottom: "24px", fontSize: "14px" },

  // GRID E CARDS
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "24px" },
  card: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "26px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    position: "relative"
  },
  cardTopo: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  cardIcone: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    backgroundColor: "#eff6ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeStatus: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#2563eb",
    backgroundColor: "#eff6ff",
    padding: "5px 12px",
    borderRadius: "999px",
    textTransform: "uppercase"
  },
  badgeMinicurso: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#059669",
    backgroundColor: "#ecfdf5",
    padding: "5px 12px",
    borderRadius: "999px",
  },
  cardTitulo: { fontFamily: "'Poppins', sans-serif", fontSize: "18px", fontWeight: 600, margin: 0, color: "#0f172a", lineHeight: 1.4 },
  cardMetaGrid: { display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" },
  cardMetaItem: { display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#475569" },
  
  // CONTAINER DE BOTÕES INTERNOS
  botoesContainer: { display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" },
  botaoQr: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: "100%",
    padding: "12px",
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "13px",
    transition: "background 0.2s"
  },
  botaoCertificado: { 
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: "100%", 
    padding: "12px", 
    backgroundColor: "#eab308", 
    color: "#fff", 
    border: "none", 
    borderRadius: "10px", 
    cursor: "pointer", 
    fontSize: "13px", 
    fontWeight: "600", 
    transition: "background 0.2s",
  },

  // FOOTER
  footer: {
    marginTop: "88px",
    padding: "48px 48px 24px",
    backgroundColor: "#0f1729",
  },
  footerTopo: { display: "flex", flexDirection: "column", gap: "14px", maxWidth: "1240px", margin: "0 auto" },
  footerCopyright: {
    textAlign: "center",
    color: "#475569",
    fontSize: "12px",
    marginTop: "24px",
    paddingTop: "20px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
  },
};

export default DashboardParticipante;