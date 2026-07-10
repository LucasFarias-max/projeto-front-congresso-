import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
// Importando os ícones modernos
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  GraduationCap, 
  LogOut, 
  Sparkles,
  ArrowRight
} from "lucide-react";
// 🔗 Importa o serviço de API — ele já decide sozinho se usa localhost ou o backend do Render
import { api } from "../services/api";

function Home() {
  const [eventos, setEventos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");

  // Referências para as seções que serão navegadas via scroll
  const topoRef = useRef(null);
  const eventosRef = useRef(null);
  const rodapeRef = useRef(null);

  useEffect(() => {
    api.get("/eventos")
      .then((data) => {
        if (Array.isArray(data)) {
          setEventos(data);
        } else {
          console.error("O backend não devolveu uma lista de eventos válida:", data);
          setEventos([]);
        }
        setCarregando(false);
      })
      .catch((err) => {
        console.error("Erro ao buscar eventos:", err);
        setEventos([]);
        setCarregando(false);
      });
  }, []);

  const handleInscricao = (eventoId) => {
    navigate(`/eventos/${eventoId}`);
  };

  const irParaInicio = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const irParaEventos = () => {
    eventosRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const irParaRodape = () => {
    rodapeRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  return (
    <div style={styles.page} ref={topoRef}>
      {/* Fontes + Animações + REGRAS DE RESPONSIVIDADE */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        .evento-card { transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; }
        .evento-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(15, 23, 41, 0.08); border-color: #bfdbfe; }
        .btn-primario:hover { background-color: #1d4ed8 !important; }
        .btn-ghost:hover { background-color: #f1f5f9 !important; }
        .nav-link { position: relative; }
        .nav-link::after { content: ""; position: absolute; left: 0; bottom: -4px; width: 0; height: 2px; background: #2563eb; transition: width 0.2s ease; }
        .nav-link:hover::after { width: 100%; }
        html { scroll-behavior: smooth; }

        /* Barra de rolagem discreta para o header no mobile */
        .header-scroll::-webkit-scrollbar { height: 0px; }
        .header-scroll { scrollbar-width: none; -ms-overflow-style: none; }

        /* ===== MEDIA QUERIES PARA RESPONSIVIDADE ===== */
        @media (max-width: 900px) {
          .header-conecta { padding: 14px 16px !important; }
          .header-scroll {
            display: flex !important;
            flex-wrap: nowrap !important;
            align-items: center !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
            gap: 24px !important;
            width: 100%;
          }
          .header-scroll > * { flex-shrink: 0; }
          .header-scroll .nav-conecta { gap: 20px !important; }
          
          /* Hero Responsivo */
          .hero-section { padding: 60px 20px 70px !important; }
          .hero-titulo { fontSize: 32px !important; }
          
          /* Conteúdo Principal (Grid) */
          .main-conteudo { padding: 48px 20px 40px !important; }
          .grid-eventos { grid-template-columns: 1fr !important; }
          .card-meta { grid-template-columns: 1fr !important; gap: 8px !important; }
          
          /* Faixa Final Responsiva */
          .faixa-final { 
            margin: 30px 20px 0 !important; 
            padding: 24px !important;
            flex-direction: column !important;
            text-align: center !important;
          }
          
          /* Footer Responsivo */
          .footer-section { padding: 40px 20px 24px !important; }
        }
      `}</style>

      {/* HEADER */}
      <header style={styles.header} className="header-conecta">
        <div className="header-scroll">
          <div style={styles.logoBox}>
            <div style={styles.logoIcone}>◆</div>
            <div>
              <div style={styles.logoTexto}>CONECTA</div>
              <div style={styles.logoSubtexto}>EVENTOS</div>
            </div>
          </div>

          <nav style={styles.nav} className="nav-conecta">
            <span className="nav-link" style={styles.navLink} onClick={irParaInicio}>Início</span>
            <span className="nav-link" style={styles.navLink} onClick={irParaEventos}>Eventos</span>
            <span className="nav-link" style={styles.navLink} onClick={irParaRodape}>Sobre</span>
            <span className="nav-link" style={styles.navLink} onClick={irParaRodape}>Contato</span>
          </nav>

          <div style={styles.headerAcoes}>
            {token ? (
              <>
                <Link
                  to={`/dashboard-${userRole?.toLowerCase()}`}
                  style={styles.linkPainel}
                >
                  Meu Painel ({userRole})
                </Link>
                <button
                  onClick={() => { localStorage.clear(); window.location.reload(); }}
                  style={styles.botaoSair}
                >
                  <LogOut size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link to="/login" style={styles.botaoEntrar} className="btn-ghost">Entrar</Link>
                <Link to="/cadastrar" style={styles.botaoCriarConta} className="btn-primario">
                  Criar conta
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section style={styles.hero} className="hero-section">
        <div style={styles.heroConteudo}>
          <span style={styles.heroBadge}>EVENTOS DISPONÍVEIS</span>
          <h1 style={styles.heroTitulo} className="hero-titulo">
            Conecte-se ao que há de <span style={styles.heroDestaque}>mais atual</span> em tecnologia
          </h1>
          <p style={styles.heroDescricao}>
            Explore congressos, workshops e minicursos pensados para quem quer aprender,
            fazendo networking. Garanta sua vaga em poucos cliques.
          </p>
          <div style={styles.heroStats}>
            <div style={styles.heroStatItem}>
              <span style={styles.heroStatNumero}>{carregando ? "—" : eventos.length}</span>
              <span style={styles.heroStatLabel}>Eventos abertos</span>
            </div>
            <div style={styles.heroStatDivisor} />
            <div style={styles.heroStatItem}>
              <span style={styles.heroStatNumero}>100%</span>
              <span style={styles.heroStatLabel}>Inscrição online</span>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO DE EVENTOS */}
      <main style={styles.conteudoPrincipal} ref={eventosRef} className="main-conteudo">
        <div style={styles.tituloSecaoBox}>
          <span style={styles.eyebrow}>
            <Calendar size={14} style={{ display: 'inline', marginRight: '6px', marginBottom: '-2px' }} /> 
            Programação
          </span>
          <h2 style={styles.tituloSecao}>Eventos Disponíveis</h2>
          <p style={styles.subtituloSecao}>Escolha um evento e garanta sua vaga agora mesmo.</p>
        </div>

        {carregando && <p style={styles.textoCarregando}>Carregando eventos...</p>}
        {!carregando && eventos.length === 0 && (
          <p style={styles.textoVazio}>Nenhum evento cadastrado no momento.</p>
        )}

        <div style={styles.grid} className="grid-eventos">
          {eventos.map((evento) => (
            <div key={evento.id} className="evento-card" style={styles.card}>
              <div style={styles.cardTopo}>
                <div style={styles.cardIcone}>
                  <GraduationCap size={22} color="#2563eb" />
                </div>
                <span style={styles.cardBadge}>Evento Presencial</span>
              </div>

              <h3 style={styles.cardTitulo}>{evento.nome || evento.titulo}</h3>
              <p style={styles.cardDescricao}>{evento.descricao}</p>

              <div style={styles.cardMetaGrid} className="card-meta">
                <div style={styles.cardMetaItem}>
                  <MapPin size={14} color="#64748b" />
                  <span>{evento.local}</span>
                </div>
                <div style={styles.cardMetaItem}>
                  <Calendar size={14} color="#64748b" />
                  <span>{evento.dataInicio ? new Date(evento.dataInicio).toLocaleDateString() : "A definir"}</span>
                </div>
                <div style={styles.cardMetaItem}>
                  <Clock size={14} color="#64748b" />
                  <span>{evento.cargaHorariaTotal || evento.cargaHoraria}h de carga horária</span>
                </div>
                <div style={styles.cardMetaItem}>
                  <Users size={14} color="#64748b" />
                  <span>{evento.limiteParticipantes} vagas restantes</span>
                </div>
              </div>

              <button
                onClick={() => handleInscricao(evento.id)}
                style={styles.botaoInscrever}
                className="btn-primario"
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  Ver detalhes / Inscrever-se <ArrowRight size={16} />
                </span>
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* FAIXA DE CHAMADA FINAL */}
      <section style={styles.faixaFinal} className="faixa-final">
        <div style={styles.faixaFinalIconeBox}>
          <Sparkles size={22} color="#60a5fa" />
        </div>
        <div style={styles.faixaFinalTexto}>
          <h3 style={styles.faixaFinalTitulo}>Garanta já sua participação!</h3>
          <p style={styles.faixaFinalSubtitulo}>Não perca a oportunidade de viver essa experiência única.</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={styles.footer} ref={rodapeRef} className="footer-section">
        <div style={styles.footerTopo}>
          <div style={styles.logoBox}>
            <div style={styles.logoIcone}>◆</div>
            <div>
              <div style={{ ...styles.logoTexto, color: "#fff" }}>CONECTA</div>
              <div style={styles.logoSubtexto}>EVENTOS</div>
            </div>
          </div>
          <p style={styles.footerFrase}>Conectando pessoas, ideias e tecnologia para um futuro melhor.</p>
        </div>
        <p style={styles.footerCopyright}>© {new Date().getFullYear()} Conecta Eventos. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

// Pequenas modificações no objeto de estilos para remover valores fixos prejudiciais
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
  nav: { display: "flex", gap: "32px" },
  navLink: { fontSize: "14px", fontWeight: 500, color: "#334155", cursor: "pointer" },
  headerAcoes: { display: "flex", alignItems: "center", gap: "14px" },
  linkPainel: { fontSize: "14px", fontWeight: 600, color: "#2563eb", textDecoration: "none" },
  botaoSair: { display: "flex", alignItems: "center", padding: "9px 16px", backgroundColor: "transparent", color: "#ef4444", border: "1px solid #fecaca", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 600 },
  botaoEntrar: { padding: "9px 18px", backgroundColor: "transparent", color: "#0f172a", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", fontWeight: 600, textDecoration: "none" },
  botaoCriarConta: { padding: "9px 18px", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600, textDecoration: "none" },

  // HERO
  hero: {
    background: "linear-gradient(135deg, #0f1729 0%, #14213d 60%, #1e3a8a 130%)",
    padding: "88px 48px 96px",
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
    marginBottom: "24px",
  },
  heroTitulo: {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 700,
    fontSize: "44px",
    lineHeight: 1.2,
    color: "#f8fafc",
    margin: "0 0 20px 0",
  },
  heroDestaque: { color: "#60a5fa" },
  heroDescricao: { fontSize: "17px", color: "#cbd5e1", lineHeight: 1.6, maxWidth: "100%", margin: "0 auto 36px" }, // Alterado max-width para 100%
  heroStats: { display: "flex", justifyContent: "center", alignItems: "center", gap: "28px" },
  heroStatItem: { display: "flex", flexDirection: "column", gap: "2px" },
  heroStatNumero: { fontFamily: "'Poppins', sans-serif", fontSize: "26px", fontWeight: 700, color: "#fff" },
  heroStatLabel: { fontSize: "13px", color: "#94a3b8" },
  heroStatDivisor: { width: "1px", height: "36px", backgroundColor: "rgba(255,255,255,0.15)" },

  // SEÇÃO DE EVENTOS
  conteudoPrincipal: { padding: "72px 48px 40px", maxWidth: "1240px", margin: "0 auto", width: "100%" },
  tituloSecaoBox: { textAlign: "center", marginBottom: "48px" },
  eyebrow: { display: "block", fontSize: "13px", fontWeight: 700, color: "#2563eb", marginBottom: "8px" },
  tituloSecao: { fontFamily: "'Poppins', sans-serif", fontSize: "32px", fontWeight: 700, margin: "0 0 8px 0", color: "#0f172a" },
  subtituloSecao: { fontSize: "15px", color: "#64748b", margin: 0 },
  textoCarregando: { textAlign: "center", color: "#64748b" },
  textoVazio: { textAlign: "center", color: "#94a3b8", fontStyle: "italic" },

  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px", width: "100%" }, // Reduzido minmax para caber melhor em telas pequenas
  card: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "26px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
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
  cardBadge: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#2563eb",
    backgroundColor: "#eff6ff",
    padding: "5px 10px",
    borderRadius: "999px",
  },
  cardTitulo: { fontFamily: "'Poppins', sans-serif", fontSize: "19px", fontWeight: 600, margin: 0, color: "#0f172a" },
  cardDescricao: { fontSize: "14px", color: "#64748b", margin: 0, lineHeight: 1.5 },
  cardMetaGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "4px" },
  cardMetaItem: { display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", color: "#475569" },
  botaoInscrever: {
    marginTop: "10px",
    width: "100%",
    padding: "12px",
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "14px",
  },

  // FAIXA FINAL
  faixaFinal: {
    margin: "40px 48px 0",
    backgroundColor: "#0f1729",
    borderRadius: "18px",
    padding: "32px 40px",
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  faixaFinalIconeBox: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    backgroundColor: "rgba(37, 99, 235, 0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  faixaFinalTexto: { flex: 1 },
  faixaFinalTitulo: { fontFamily: "'Poppins', sans-serif", color: "#fff", fontSize: "19px", margin: "0 0 4px 0" },
  faixaFinalSubtitulo: { color: "#94a3b8", fontSize: "14px", margin: 0 },

  // FOOTER
  footer: {
    marginTop: "56px",
    padding: "48px 48px 24px",
    backgroundColor: "#0f1729",
  },
  footerTopo: { display: "flex", flexDirection: "column", gap: "14px", maxWidth: "1240px", margin: "0 auto" },
  footerFrase: { color: "#64748b", fontSize: "13px", maxWidth: "100%" }, // Removido max-width de 360px fixo
  footerCopyright: {
    textAlign: "center",
    color: "#475569",
    fontSize: "12px",
    marginTop: "32px",
    paddingTop: "20px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
  },
};

export default Home;