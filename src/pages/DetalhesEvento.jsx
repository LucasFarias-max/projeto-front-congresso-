import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
// Importando os ícones modernos
import { 
  ArrowLeft, 
  GraduationCap, 
  MapPin, 
  Calendar, 
  Globe, 
  FileText, 
  Video, 
  Clock, 
  CheckCircle2, 
  Plus, 
  Lock, 
  Ticket,
  ArrowRight,
  LogOut
} from "lucide-react";

const transformarYoutubeEmbed = (url) => {
  if (!url) return null;

  // Já é embed
  if (url.includes("/embed/")) {
    return url;
  }

  let videoId = "";

  if (url.includes("watch?v=")) {
    videoId = url.split("v=")[1].split("&")[0];
  } else if (url.includes("youtu.be/")) {
    videoId = url.split("youtu.be/")[1].split("?")[0];
  } else if (url.includes("/shorts/")) {
    videoId = url.split("/shorts/")[1].split("?")[0];
  } else if (url.includes("/live/")) {
    videoId = url.split("/live/")[1].split("?")[0];
  }

  if (!videoId) return null;

  return `https://www.youtube.com/embed/${videoId}`;
};

// Formata uma data ISO (ex: "2026-07-10T11:00:00.000Z") para o formato
// brasileiro "10/07/2026, 08:00", removendo o "Z" e o formato cru do banco.
const formatarData = (dataISO) => {
  if (!dataISO) return "A definir";

  const data = new Date(dataISO);

  if (isNaN(data.getTime())) return "A definir";

  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function DetalhesEvento() {
  const { id } = useParams();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");

  const [evento, setEvento] = useState(null);
  const [minicursos, setMinicursos] = useState([]);
  const [inscricaoPrincipal, setInscricaoPrincipal] = useState(null);
  const [meusMinicursosIds, setMeusMinicursosIds] = useState([]);

  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");

  const [modalConfirmacao, setModalConfirmacao] = useState({
    aberto: false,
    tipo: null,       // "evento" | "minicurso"
    minicursoId: null,
    nomeMinicurso: "",
  });

  // Referências para navegação por scroll do menu superior
  const topoRef = useRef(null);
  const sobreRef = useRef(null);
  const eventosRef = useRef(null);
  const rodapeRef = useRef(null);

  useEffect(() => {
    const carregarInformacoes = async () => {
      try {
        setCarregando(true);
        const tokenAtual = localStorage.getItem("token");
        const headers = tokenAtual ? { "Authorization": `Bearer ${tokenAtual}` } : {};

        // 1. Busca os dados do evento principal
        const resEvento = await fetch(`https://projeto-congresso.onrender.com/eventos/${id}`, { headers });
        if (!resEvento.ok) throw new Error("Erro ao carregar dados do evento.");
        setEvento(await resEvento.json());

        // 2. Busca os minicursos de forma independente
        try {
          const resMinicursos = await fetch(`https://projeto-congresso.onrender.com/miniCurso`, { headers });
          if (resMinicursos.ok) {
            const todosMinicursos = await resMinicursos.json();
            const dadosMinicursos = todosMinicursos.filter(mc => mc.eventoId === Number(id));
            setMinicursos(dadosMinicursos);
          }
        } catch (errMinicursos) {
          console.error("Erro ao carregar minicursos:", errMinicursos);
        }

        // 3. Se houver token, verifica as inscrições do usuário logado
        if (tokenAtual) {
          const resMinhasInscricoes = await fetch("https://projeto-congresso.onrender.com/inscricao", { headers });
          if (resMinhasInscricoes.ok) {
            const minhasInscricoes = await resMinhasInscricoes.json();
            const jaInscrito = minhasInscricoes.find(ins => ins.eventoId === Number(id));
            
            if (jaInscrito) {
              setInscricaoPrincipal(jaInscrito);

              const resMeusCursos = await fetch("https://projeto-congresso.onrender.com/inscricaoCurso", { headers });
              if (resMeusCursos.ok) {
                const meusCursos = await resMeusCursos.json();
                setMeusMinicursosIds(meusCursos.map(mc => mc.minicursoId));
              }
            }
          }
        }
      } catch (err) {
        setErro(err.message);
      } finally {
        setCarregando(false);
      }
    };

    carregarInformacoes();
  }, [id]);

  useEffect(() => {
    if (carregando) return;

    const tokenAtual = localStorage.getItem("token");
    if (!tokenAtual) return;

    const pendenteRaw = sessionStorage.getItem("acaoPendente");
    if (!pendenteRaw) return;

    const pendente = JSON.parse(pendenteRaw);
    if (String(pendente.eventoId) !== String(id)) return;

    sessionStorage.removeItem("acaoPendente");

    if (pendente.tipo === "evento" && !inscricaoPrincipal) {
      confirmarInscricaoEvento();
    }

    if (pendente.tipo === "minicurso") {
      if (!inscricaoPrincipal) {
        sessionStorage.setItem("acaoPendente", JSON.stringify(pendente));
        confirmarInscricaoEvento();
      } else if (!meusMinicursosIds.includes(pendente.minicursoId)) {
        confirmarInscricaoMinicurso(pendente.minicursoId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carregando, inscricaoPrincipal]);

  const confirmarInscricaoEvento = async () => {
    const tokenAtual = localStorage.getItem("token");

    if (!tokenAtual) {
      sessionStorage.setItem("acaoPendente", JSON.stringify({ tipo: "evento", eventoId: id }));
      navigate("/login", { state: { from: `/eventos/${id}` } });
      return;
    }

    try {
      setProcessando(true);
      setErro("");
      const usuarioIdStr = localStorage.getItem("userId");

      const response = await fetch("https://projeto-congresso.onrender.com/inscricao", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${tokenAtual}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          usuarioId: Number(usuarioIdStr),
          eventoId: Number(id)
        })
      });

      const dados = await response.json();
      if (!response.ok) throw new Error(dados.error || "Não foi possível realizar a inscrição.");

      setInscricaoPrincipal(dados);

    } catch (err) {
      setErro(err.message);
    } finally {
      setProcessando(false);
      setModalConfirmacao({ aberto: false, tipo: null, minicursoId: null, nomeMinicurso: "" });
    }
  };

  const confirmarInscricaoMinicurso = async (minicursoId) => {
    const tokenAtual = localStorage.getItem("token");

    if (!tokenAtual) {
      sessionStorage.setItem("acaoPendente", JSON.stringify({ tipo: "minicurso", eventoId: id, minicursoId }));
      navigate("/login", { state: { from: `/eventos/${id}` } });
      return;
    }

    if (!inscricaoPrincipal) {
      setErro("Você precisa se inscrever no evento principal primeiro!");
      setModalConfirmacao({ aberto: false, tipo: null, minicursoId: null, nomeMinicurso: "" });
      return;
    }

    try {
      setProcessando(true);
      const response = await fetch("https://projeto-congresso.onrender.com/inscricaoCurso", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${tokenAtual}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inscricaoId: Number(inscricaoPrincipal.id),
          minicursoId: Number(minicursoId)
        })
      });

      const dados = await response.json();
      if (!response.ok) throw new Error(dados.error || "Erro ao se inscrever no minicurso.");

      setMeusMinicursosIds(prev => [...prev, minicursoId]);

    } catch (err) {
      setErro(`Erro: ${err.message}`);
    } finally {
      setProcessando(false);
      setModalConfirmacao({ aberto: false, tipo: null, minicursoId: null, nomeMinicurso: "" });
    }
  };

  const abrirModalEvento = () => {
    setModalConfirmacao({ aberto: true, tipo: "evento", minicursoId: null, nomeMinicurso: "" });
  };

  const abrirModalMinicurso = (minicursoId, nomeMinicurso) => {
    if (!inscricaoPrincipal) {
      alert("Você precisa se inscrever no evento principal primeiro!");
      return;
    }
    setModalConfirmacao({ aberto: true, tipo: "minicurso", minicursoId, nomeMinicurso });
  };

  const fecharModal = () => {
    if (processando) return;
    setModalConfirmacao({ aberto: false, tipo: null, minicursoId: null, nomeMinicurso: "" });
  };

  const confirmarModal = () => {
    if (modalConfirmacao.tipo === "evento") {
      confirmarInscricaoEvento();
    } else if (modalConfirmacao.tipo === "minicurso") {
      confirmarInscricaoMinicurso(modalConfirmacao.minicursoId);
    }
  };

  const irParaInicio = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const irParaEventos = () => {
    eventosRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const irParaSobre = () => {
    sobreRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const irParaRodape = () => {
    rodapeRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  if (carregando) {
    return (
      <div style={styles.paginaEstado}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');`}</style>
        <p style={styles.loading}>Carregando detalhes do evento...</p>
      </div>
    );
  }

  if (!evento) {
    return (
      <div style={styles.paginaEstado}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');`}</style>
        <p style={styles.vazio}>Evento não encontrado.</p>
      </div>
    );
  }

  const linkVideo = transformarYoutubeEmbed(evento.videoUrl);

  return (
    <div style={styles.page} ref={topoRef}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        .card-minicurso { transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; }
        .card-minicurso:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(15, 23, 41, 0.08); border-color: #bfdbfe; }
        .btn-primario-detalhe:hover:not(:disabled) { background-color: #1d4ed8 !important; }
        .btn-ghost-detalhe:hover { background-color: #f1f5f9 !important; }
        .btn-cancelar-modal:hover { background-color: #f1f5f9 !important; }
        .nav-link { position: relative; }
        .nav-link::after { content: ""; position: absolute; left: 0; bottom: -4px; width: 0; height: 2px; background: #2563eb; transition: width 0.2s ease; }
        .nav-link:hover::after { width: 100%; }
        html { scroll-behavior: smooth; }
        @keyframes fadeInModal { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUpModal { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

        /* Barra de rolagem discreta para o header no mobile */
        .header-scroll::-webkit-scrollbar { height: 0px; }
        .header-scroll { scrollbar-width: none; -ms-overflow-style: none; }

        /* ===== ESTILO BASE (DESKTOP) DO HEADER =====
           Antes essa div só ganhava "display: flex" dentro do media query mobile,
           então no desktop ela virava um bloco comum e empilhava tudo.
           Agora ela já nasce em flex-row, alinhada e espaçada corretamente. */
        .header-scroll {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }

        /* ===== REGRAS DE RESPONSIVIDADE ===== */
        @media (max-width: 900px) {
          .header-conecta { padding: 14px 16px !important; }
          .header-scroll {
            display: flex !important;
            flex-wrap: nowrap !important;
            align-items: center !important;
            /* No mobile o carrossel usa scroll horizontal, então "flex-start" + gap
               funciona melhor que "space-between" (que tentaria espalhar os itens
               antes de deixar rolar). */
            justify-content: flex-start !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
            gap: 24px !important;
            width: 100%;
          }
          .header-scroll > * { flex-shrink: 0; }
          .header-scroll .nav-conecta { gap: 20px !important; }
          
          .sub-header { padding: 12px 16px !important; flex-direction: column; gap: 10px; align-items: stretch !important; }
          .sub-header button { justify-content: center; width: 100%; }

          .hero-section { padding: 48px 16px 40px !important; }
          .hero-titulo { fontSize: 26px !important; margin-bottom: 24px !important; }
          .hero-meta { grid-template-columns: 1fr !important; gap: 16px !important; }

          .main-conteudo { padding: 32px 16px 60px !important; }
          .bloco-duas-colunas { grid-template-columns: 1fr !important; gap: 20px !important; margin-bottom: 32px !important; }
          
          .faixa-inscricao { padding: 20px 16px !important; text-align: center; justify-content: center !important; }
          .faixa-inscricao button, .faixa-inscricao div { width: 100% !important; justify-content: center !important; }

          .grid-minicursos { grid-template-columns: 1fr !important; }

          .footer-section { padding: 40px 16px 24px !important; }
        }
      `}</style>

      {/* MENU SUPERIOR */}
      <header style={styles.headerTopo} className="header-conecta">
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
            <span className="nav-link" style={styles.navLink} onClick={irParaSobre}>Sobre</span>
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
                <Link to="/login" style={styles.botaoEntrar} className="btn-ghost-detalhe">Entrar</Link>
                <Link to="/cadastrar" style={styles.botaoCriarConta} className="btn-primario-detalhe">
                  Criar conta
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* SUB-HEADER */}
      <div style={styles.subHeader} className="sub-header">
        <button onClick={() => navigate(-1)} style={styles.botaoVoltar} className="btn-ghost-detalhe">
          <ArrowLeft size={14} style={{ marginRight: '6px' }} /> Voltar
        </button>

        {token && (
          <button
            onClick={() => navigate(`/dashboard-${userRole?.toLowerCase()}`)}
            style={styles.botaoDash}
          >
            Ir para Meu Painel <GraduationCap size={15} style={{ marginLeft: '6px' }} />
          </button>
        )}
      </div>

      {/* HERO NAVY DO EVENTO */}
      <section style={styles.hero} className="hero-section">
        <div style={styles.heroConteudo}>
          <span style={styles.heroBadge}>EVENTO PRESENCIAL</span>
          <h1 style={styles.heroTitulo} className="hero-titulo">{evento.nome}</h1>

          <div style={styles.heroMetaGrid} className="hero-meta">
            <div style={styles.heroMetaItem}>
              <span style={styles.heroMetaIcone}><MapPin size={16} color="#93c5fd" /></span>
              <div>
                <div style={styles.heroMetaLabel}>Local</div>
                <div style={styles.heroMetaValor}>{evento.local}</div>
              </div>
            </div>
            <div style={styles.heroMetaItem}>
              <span style={styles.heroMetaIcone}><Calendar size={16} color="#93c5fd" /></span>
              <div>
                <div style={styles.heroMetaLabel}>Data de início</div>
                <div style={styles.heroMetaValor}>{formatarData(evento.dataInicio)}</div>
              </div>
            </div>
            <div style={styles.heroMetaItem}>
              <span style={styles.heroMetaIcone}><Globe size={16} color="#93c5fd" /></span>
              <div>
                <div style={styles.heroMetaLabel}>Modalidade</div>
                <div style={styles.heroMetaValor}>{evento.modalidade || "Presencial"}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main style={styles.conteudo} className="main-conteudo">
        {erro && <div style={styles.erroBox}>{erro}</div>}

        {/* SOBRE O EVENTO + VÍDEO DE APRESENTAÇÃO */}
        <div style={styles.duasColunas} ref={sobreRef} className="bloco-duas-colunas">
          <div style={styles.painelSobre}>
            <h3 style={styles.painelTitulo}>
              <FileText size={18} color="#2563eb" /> Sobre o evento
            </h3>
            <p style={styles.painelTexto}>
              {evento.descricao || "Em breve mais informações sobre este evento."}
            </p>
          </div>

          <div style={styles.painelVideo}>
            <h3 style={{...styles.painelTitulo, color: '#f8fafc'}}>
              <Video size={18} color="#60a5fa" /> Vídeo de apresentação
            </h3>
            {linkVideo ? (
              <div style={styles.videoWrapper}>
                <iframe
                  src={linkVideo}
                  title="Vídeo de apresentação do evento"
                  style={styles.videoIframe}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div style={styles.videoVazio}>
                Nenhum vídeo de apresentação cadastrado para este evento ainda.
              </div>
            )}
          </div>
        </div>

        {/* BLOCO DE INSCRIÇÃO PRINCIPAL */}
        <div style={styles.faixaInscricao} className="faixa-inscricao">
          <div>
            <h3 style={styles.faixaInscricaoTitulo}>
              {inscricaoPrincipal ? "Sua vaga está garantida!" : "Garanta sua participação"}
            </h3>
            <p style={styles.faixaInscricaoSubtitulo}>
              {inscricaoPrincipal
                ? "Agora você já pode se inscrever nos minicursos disponíveis abaixo."
                : "Confirme sua inscrição para liberar o acesso aos minicursos do evento."}
            </p>
          </div>

          {inscricaoPrincipal ? (
            <div style={styles.badgeInscritoSucesso}>
              <CheckCircle2 size={16} style={{ marginRight: '6px' }} /> Inscrito no evento
            </div>
          ) : (
            <button
              onClick={abrirModalEvento}
              style={styles.botaoInscreverPrincipal}
              className="btn-primario-detalhe"
              disabled={processando}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {processando ? "Processando..." : "Confirmar minha inscrição"} <ArrowRight size={16} />
              </span>
            </button>
          )}
        </div>

        {/* SEÇÃO DOS MINICURSOS */}
        <section style={styles.secao} ref={eventosRef}>
          <div style={styles.tituloSecaoBox}>
            <span style={styles.eyebrow}>
              <GraduationCap size={14} style={{ display: 'inline', marginRight: '6px', marginBottom: '-2px' }} /> 
              Programação complementar
            </span>
            <h2 style={styles.tituloSecao}>Minicursos Disponíveis</h2>
            <p style={styles.subtituloSecao}>
              A inscrição em minicursos fica disponível assim que sua inscrição no evento principal for confirmada.
            </p>
          </div>

          {minicursos.length === 0 ? (
            <p style={styles.vazio}>Este evento não possui minicursos cadastrados.</p>
          ) : (
            <div style={styles.grid} className="grid-minicursos">
              {minicursos.map((curso) => {
                const jaInscritoNoCurso = meusMinicursosIds.includes(curso.id);

                return (
                  <div key={curso.id} className="card-minicurso" style={styles.card}>
                    <div style={styles.cardTopo}>
                      <div style={styles.cardIcone}>
                        <FileText size={18} color="#2563eb" />
                      </div>
                      <span style={styles.cardBadge}>Minicurso</span>
                    </div>

                    <h3 style={styles.cardTitulo}>{curso.titulo}</h3>
                    <p style={styles.cardInfo}>
                      <Clock size={14} color="#64748b" style={{ marginRight: '4px' }} /> {curso.cargaHoraria} horas de carga horária
                    </p>

                    <div style={{ marginTop: "auto" }}>
                      {jaInscritoNoCurso ? (
                        <div style={styles.badgeCursoInscrito}>
                          Vaga garantida <CheckCircle2 size={13} style={{ marginLeft: '4px', display: 'inline', verticalAlign: 'middle' }} />
                        </div>
                      ) : (
                        <button
                          onClick={() => abrirModalMinicurso(curso.id, curso.titulo)}
                          style={inscricaoPrincipal ? styles.botaoInscreverCurso : styles.botaoDesabilitado}
                          className={inscricaoPrincipal ? "btn-primario-detalhe" : ""}
                          disabled={!inscricaoPrincipal || processando}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            {inscricaoPrincipal ? (
                              <>
                                <Plus size={14} /> Inscrever-me neste minicurso
                              </>
                            ) : (
                              <>
                                <Lock size={14} /> Inscreva-se primeiro no evento
                              </>
                            )}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* RODAPÉ */}
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

      {/* MODAL DE CONFIRMAÇÃO DE INSCRIÇÃO */}
      {modalConfirmacao.aberto && (
        <div style={styles.modalOverlay} onClick={fecharModal}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalIcone}>
              <Ticket size={24} color="#2563eb" />
            </div>
            <h3 style={styles.modalTitulo}>
              {modalConfirmacao.tipo === "evento"
                ? "Confirmar inscrição no evento?"
                : `Confirmar inscrição em "${modalConfirmacao.nomeMinicurso}"?`}
            </h3>
            <p style={styles.modalTexto}>
              {modalConfirmacao.tipo === "evento"
                ? `Você está prestes a garantir sua vaga em "${evento.titulo}". Deseja continuar?`
                : "Você vai reservar sua vaga neste minicurso. Essa ação não pode ser desfeita pelo app."}
            </p>

            <div style={styles.modalBotoes}>
              <button
                onClick={fecharModal}
                style={styles.botaoCancelarModal}
                className="btn-cancelar-modal"
                disabled={processando}
              >
                Cancelar
              </button>
              <button
                onClick={confirmarModal}
                style={styles.botaoConfirmarModal}
                className="btn-primario-detalhe"
                disabled={processando}
              >
                {processando ? "Confirmando..." : "Sim, confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  paginaEstado: {
    width: "100%", minHeight: "100vh", backgroundColor: "#ffffff",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "'Inter', sans-serif",
  },
  loading: { color: "#64748b", fontSize: "16px" },
  vazio: { color: "#94a3b8", fontStyle: "italic", fontSize: "15px" },

  page: {
    fontFamily: "'Inter', sans-serif",
    backgroundColor: "#ffffff",
    color: "#0f172a",
    minHeight: "100vh",
  },

  // MENU SUPERIOR
  headerTopo: {
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

  // SUB-HEADER
  subHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "16px 48px", borderBottom: "1px solid #e2e8f0", backgroundColor: "#ffffff",
  },
  botaoVoltar: {
    display: "flex", alignItems: "center",
    padding: "9px 16px", backgroundColor: "transparent", color: "#0f172a",
    border: "1px solid #e2e8f0", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 600,
  },
  botaoDash: {
    display: "flex", alignItems: "center",
    padding: "9px 16px", backgroundColor: "transparent", color: "#2563eb",
    border: "1px solid #2563eb", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "13px",
  },

  hero: {
    background: "linear-gradient(135deg, #0f1729 0%, #14213d 60%, #1e3a8a 130%)",
    padding: "64px 48px 56px", display: "flex", justifyContent: "center",
  },
  heroConteudo: { maxWidth: "820px", width: "100%" },
  heroBadge: {
    display: "inline-block", padding: "6px 14px", borderRadius: "999px",
    backgroundColor: "rgba(37, 99, 235, 0.2)", color: "#93c5fd", fontSize: "12px",
    fontWeight: 700, letterSpacing: "1px", marginBottom: "20px",
  },
  heroTitulo: {
    fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px",
    lineHeight: 1.25, color: "#f8fafc", margin: "0 0 32px 0",
  },
  heroMetaGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" },
  heroMetaItem: { display: "flex", alignItems: "center", gap: "12px" },
  heroMetaIcone: {
    width: "38px", height: "38px", borderRadius: "10px",
    backgroundColor: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center",
    justifyContent: "center", flexShrink: 0,
  },
  heroMetaLabel: { fontSize: "12px", color: "#94a3b8", marginBottom: "2px" },
  heroMetaValor: { fontSize: "14px", color: "#f1f5f9", fontWeight: 600 },

  conteudo: { padding: "48px 48px 80px", maxWidth: "1100px", margin: "0 auto", width: "100%" },

  erroBox: {
    backgroundColor: "rgba(239, 68, 68, 0.08)", border: "1px solid #fecaca", color: "#dc2626",
    padding: "14px 16px", borderRadius: "10px", marginBottom: "24px", fontSize: "14px",
  },

  duasColunas: {
    display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "24px", marginBottom: "48px",
  },
  painelSobre: {
    backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "26px",
  },
  painelVideo: {
    backgroundColor: "#0f1729", border: "1px solid #1e293b", borderRadius: "16px", padding: "20px",
  },
  painelTitulo: {
    fontFamily: "'Poppins', sans-serif", fontSize: "16px", fontWeight: 600,
    display: "flex", alignItems: "center", gap: "8px", margin: "0 0 14px 0", color: "#0f172a"
  },
  painelTexto: { fontSize: "14px", color: "#475569", lineHeight: 1.65, margin: 0 },
  videoWrapper: {
    position: "relative", width: "100%", paddingTop: "56.25%", borderRadius: "10px", overflow: "hidden",
  },
  videoIframe: {
    position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none",
  },
  videoVazio: {
    padding: "40px 20px", textAlign: "center", color: "#64748b", fontSize: "13.5px",
    border: "1px dashed #334155", borderRadius: "10px",
  },

  faixaInscricao: {
    backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "16px",
    padding: "28px 32px", display: "flex", justifyContent: "space-between", alignItems: "center",
    gap: "24px", marginBottom: "56px", flexWrap: "wrap",
  },
  faixaInscricaoTitulo: { fontFamily: "'Poppins', sans-serif", fontSize: "19px", fontWeight: 600, margin: "0 0 4px 0", color: "#0f172a" },
  faixaInscricaoSubtitulo: { fontSize: "14px", color: "#64748b", margin: 0, maxWidth: "440px" },
  botaoInscreverPrincipal: {
    padding: "13px 26px", backgroundColor: "#2563eb", color: "#fff", border: "none",
    borderRadius: "10px", cursor: "pointer", fontSize: "14px", fontWeight: 600, whiteSpace: "nowrap",
  },
  badgeInscritoSucesso: {
    display: "flex", alignItems: "center",
    padding: "12px 20px", backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#059669",
    borderRadius: "10px", fontWeight: 600, fontSize: "14px", border: "1px solid rgba(16, 185, 129, 0.3)",
    whiteSpace: "nowrap",
  },

  secao: { marginTop: "8px" },
  tituloSecaoBox: { marginBottom: "32px" },
  eyebrow: { display: "block", fontSize: "13px", fontWeight: 700, color: "#2563eb", marginBottom: "8px" },
  tituloSecao: { fontFamily: "'Poppins', sans-serif", fontSize: "26px", fontWeight: 700, margin: "0 0 8px 0", color: "#0f172a" },
  subtituloSecao: { fontSize: "14px", color: "#64748b", margin: 0, maxWidth: "100%" },

  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px", width: "100%" },
  card: {
    backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "22px",
    textAlign: "left", display: "flex", flexDirection: "column", gap: "10px",
  },
  cardTopo: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  cardIcone: {
    width: "40px", height: "40px", borderRadius: "10px", backgroundColor: "#eff6ff",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  cardBadge: {
    fontSize: "11px", fontWeight: 700, color: "#2563eb", backgroundColor: "#eff6ff",
    padding: "5px 10px", borderRadius: "999px",
  },
  cardTitulo: { fontFamily: "'Poppins', sans-serif", fontSize: "16px", fontWeight: 600, color: "#0f172a", margin: 0 },
  cardInfo: { fontSize: "13px", color: "#64748b", margin: 0, display: "flex", alignItems: "center" },

  botaoInscreverCurso: {
    width: "100%", padding: "10px", backgroundColor: "#2563eb", color: "#fff",
    border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "13px",
  },
  botaoDesabilitado: {
    width: "100%", padding: "10px", backgroundColor: "#f1f5f9", color: "#94a3b8",
    border: "1px solid #e2e8f0", borderRadius: "8px", cursor: "not-allowed", fontSize: "13px", fontWeight: 600,
  },
  badgeCursoInscrito: {
    width: "100%", padding: "10px", backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#059669",
    borderRadius: "8px", fontWeight: 600, fontSize: "13px", border: "1px solid rgba(16, 185, 129, 0.3)",
    textAlign: "center", boxSizing: "border-box",
  },

  modalOverlay: {
    position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 41, 0.55)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 1000, padding: "20px", animation: "fadeInModal 0.15s ease",
  },
  modalCard: {
    backgroundColor: "#ffffff", borderRadius: "16px", padding: "32px",
    maxWidth: "420px", width: "100%", textAlign: "center",
    boxShadow: "0 20px 60px rgba(15,23,41,0.25)",
    animation: "slideUpModal 0.2s ease",
  },
  modalIcone: {
    width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "#eff6ff",
    display: "flex", alignItems: "center", justifyContent: "center",
    margin: "0 auto 16px",
  },
  modalTitulo: { fontFamily: "'Poppins', sans-serif", fontSize: "18px", fontWeight: 600, margin: "0 0 10px 0", color: "#0f172a" },
  modalTexto: { fontSize: "14px", color: "#64748b", lineHeight: 1.5, margin: "0 0 24px 0" },
  modalBotoes: { display: "flex", gap: "10px" },
  botaoCancelarModal: {
    flex: 1, padding: "12px", backgroundColor: "#ffffff", color: "#334155",
    border: "1px solid #e2e8f0", borderRadius: "10px", cursor: "pointer", fontWeight: 600, fontSize: "14px",
  },
  botaoConfirmarModal: {
    flex: 1, padding: "12px", backgroundColor: "#2563eb", color: "#fff",
    border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: 600, fontSize: "14px",
  },

  // RODAPÉ
  footer: {
    marginTop: "56px",
    padding: "48px 48px 24px",
    backgroundColor: "#0f1729",
  },
  footerTopo: { display: "flex", flexDirection: "column", gap: "14px", maxWidth: "1240px", margin: "0 auto" },
  footerFrase: { color: "#64748b", fontSize: "13px", maxWidth: "100%" },
  footerCopyright: {
    textAlign: "center",
    color: "#475569",
    fontSize: "12px",
    marginTop: "32px",
    paddingTop: "20px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
  },
};

export default DetalhesEvento;
