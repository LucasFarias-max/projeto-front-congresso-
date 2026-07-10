import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  QrCode,
  Camera,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
  BookOpen,
  Calendar,
} from "lucide-react";

// ⚠️ Dependência necessária no front-end:
//    npm install html5-qrcode

const ID_LEITOR_DOM = "leitor-qrcode-camera";

function LeitorPresenca() {
  const [eventos, setEventos] = useState([]);
  const [minicursos, setMinicursos] = useState([]);

  const [eventoSelecionado, setEventoSelecionado] = useState("");
  const [modo, setModo] = useState("EVENTO"); // "EVENTO" | "MINICURSO"
  const [minicursoSelecionado, setMinicursoSelecionado] = useState("");

  const [estado, setEstado] = useState("PARADO"); // PARADO | LENDO | PROCESSANDO | SUCESSO | ERRO
  const [mensagem, setMensagem] = useState("");

  const leitorRef = useRef(null); // guarda a instância do Html5Qrcode
  const travaLeituraRef = useRef(false); // evita disparos duplicados enquanto processa

  // Carrega eventos e minicursos assim que o painel abre
  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    const carregarDados = async () => {
      try {
        const resEventos = await fetch("https://projeto-congresso.onrender.com/eventos", { headers });
        if (resEventos.ok) setEventos(await resEventos.json());

        const resMinicursos = await fetch("https://projeto-congresso.onrender.com/miniCurso", { headers });
        if (resMinicursos.ok) setMinicursos(await resMinicursos.json());
      } catch (err) {
        console.error("Erro ao carregar eventos/minicursos:", err);
      }
    };

    carregarDados();
  }, []);

  // Minicursos filtrados pelo evento escolhido
  const minicursosDoEvento = minicursos.filter(
    (m) => String(m.eventoId) === String(eventoSelecionado)
  );

  // Envia o token lido para o back-end
  const validarPresenca = useCallback(
    async (tokenLido) => {
      try {
        setEstado("PROCESSANDO");
        const token = localStorage.getItem("token");

        const body = {
          token: tokenLido,
          minicursoId: modo === "MINICURSO" ? Number(minicursoSelecionado) : null,
        };

        const response = await fetch("https://projeto-congresso.onrender.com/presenca/qrcode", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        const dados = await response.json();

        if (!response.ok) {
          throw new Error(dados.erro || "Não foi possível validar a presença.");
        }

        setMensagem(
          modo === "MINICURSO"
            ? "Presença no minicurso confirmada com sucesso!"
            : "Presença no evento confirmada com sucesso!"
        );
        setEstado("SUCESSO");
      } catch (err) {
        setMensagem(err.message);
        setEstado("ERRO");
      } finally {
        // libera para o próximo scan depois de um pequeno intervalo,
        // pra dar tempo do colaborador ler o resultado na tela
        setTimeout(() => {
          travaLeituraRef.current = false;
        }, 1500);
      }
    },
    [modo, minicursoSelecionado]
  );

  // Inicia a câmera
  const iniciarLeitura = async () => {
    if (modo === "MINICURSO" && !minicursoSelecionado) {
      alert("Selecione o minicurso antes de iniciar a leitura.");
      return;
    }

    setEstado("LENDO");
    setMensagem("");

    try {
      const instancia = new Html5Qrcode(ID_LEITOR_DOM);
      leitorRef.current = instancia;

      await instancia.start(
        { facingMode: "environment" }, // usa a câmera traseira em celulares
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (textoDecodificado) => {
          if (travaLeituraRef.current) return; // já está processando um scan
          travaLeituraRef.current = true;
          validarPresenca(textoDecodificado);
        },
        () => {
          // erro de leitura de frame — ignorado silenciosamente (acontece o tempo todo)
        }
      );
    } catch (err) {
      setEstado("ERRO");
      setMensagem("Não foi possível acessar a câmera. Verifique as permissões do navegador.");
    }
  };

  // Para a câmera com segurança
  const pararLeitura = useCallback(async () => {
    if (leitorRef.current) {
      try {
        await leitorRef.current.stop();
        await leitorRef.current.clear();
      } catch (err) {
        // câmera já parada, ignora
      }
      leitorRef.current = null;
    }
  }, []);

  const reiniciarLeitura = async () => {
    await pararLeitura();
    setEstado("PARADO");
    setMensagem("");
    travaLeituraRef.current = false;
  };

  // Garante que a câmera é desligada se o componente for desmontado
  useEffect(() => {
    return () => {
      pararLeitura();
    };
  }, [pararLeitura]);

  return (
    <div style={estilos.container}>
      <div style={estilos.cabecalho}>
        <div style={estilos.iconeCabecalho}>
          <QrCode size={22} color="#2563eb" />
        </div>
        <div>
          <h2 style={estilos.titulo}>Leitor de Presença</h2>
          <p style={estilos.subtitulo}>
            Escaneie o QR Code do comprovante do participante para validar a entrada.
          </p>
        </div>
      </div>

      {/* SELEÇÃO DE CONTEXTO — só aparece antes de iniciar a câmera */}
      {estado === "PARADO" && (
        <div style={estilos.painelSelecao}>
          <div style={estilos.campo}>
            <label style={estilos.label}>
              <Calendar size={14} style={{ marginRight: "6px", verticalAlign: "middle" }} />
              Evento
            </label>
            <select
              style={estilos.select}
              value={eventoSelecionado}
              onChange={(e) => {
                setEventoSelecionado(e.target.value);
                setMinicursoSelecionado("");
              }}
            >
              <option value="">Selecione o evento</option>
              {eventos.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.nome || ev.titulo}
                </option>
              ))}
            </select>
          </div>

          <div style={estilos.campo}>
            <label style={estilos.label}>Tipo de presença</label>
            <div style={estilos.grupoBotoes}>
              <button
                type="button"
                onClick={() => setModo("EVENTO")}
                style={{
                  ...estilos.botaoModo,
                  ...(modo === "EVENTO" ? estilos.botaoModoAtivo : {}),
                }}
              >
                <Calendar size={14} /> Evento
              </button>
              <button
                type="button"
                onClick={() => setModo("MINICURSO")}
                style={{
                  ...estilos.botaoModo,
                  ...(modo === "MINICURSO" ? estilos.botaoModoAtivo : {}),
                }}
              >
                <BookOpen size={14} /> Minicurso
              </button>
            </div>
          </div>

          {modo === "MINICURSO" && (
            <div style={estilos.campo}>
              <label style={estilos.label}>Minicurso</label>
              <select
                style={estilos.select}
                value={minicursoSelecionado}
                onChange={(e) => setMinicursoSelecionado(e.target.value)}
                disabled={!eventoSelecionado}
              >
                <option value="">
                  {eventoSelecionado ? "Selecione o minicurso" : "Selecione um evento primeiro"}
                </option>
                {minicursosDoEvento.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.titulo}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button style={estilos.botaoIniciar} onClick={iniciarLeitura} className="btn-primario">
            <Camera size={16} /> Iniciar Leitura da Câmera
          </button>
        </div>
      )}

      {/* ÁREA DA CÂMERA — precisa existir sempre que estado !== PARADO para o html5-qrcode montar */}
      {(estado === "LENDO" || estado === "PROCESSANDO") && (
        <div style={estilos.areaCamera}>
          <div id={ID_LEITOR_DOM} style={estilos.caixaCamera} />

          {estado === "PROCESSANDO" && (
            <div style={estilos.overlayProcessando}>
              <Loader2 size={28} color="#2563eb" className="girando" />
              <span>Validando presença...</span>
            </div>
          )}

          <button style={estilos.botaoCancelar} onClick={reiniciarLeitura}>
            Cancelar Leitura
          </button>
        </div>
      )}

      {/* RESULTADO */}
      {estado === "SUCESSO" && (
        <div style={{ ...estilos.resultado, ...estilos.resultadoSucesso }}>
          <CheckCircle2 size={40} color="#059669" />
          <p style={estilos.resultadoTexto}>{mensagem}</p>
          <button style={estilos.botaoNovaLeitura} onClick={reiniciarLeitura} className="btn-primario">
            <RefreshCw size={15} /> Ler Próximo Participante
          </button>
        </div>
      )}

      {estado === "ERRO" && (
        <div style={{ ...estilos.resultado, ...estilos.resultadoErro }}>
          <XCircle size={40} color="#ef4444" />
          <p style={estilos.resultadoTexto}>{mensagem}</p>
          <button style={estilos.botaoNovaLeitura} onClick={reiniciarLeitura} className="btn-primario">
            <RefreshCw size={15} /> Tentar Novamente
          </button>
        </div>
      )}

      <style>{`
        .girando { animation: girar 1s linear infinite; }
        @keyframes girar { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        #${ID_LEITOR_DOM} video { border-radius: 14px; }
      `}</style>
    </div>
  );
}

const estilos = {
  container: {
    fontFamily: "'Inter', sans-serif",
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "28px",
    maxWidth: "480px",
    margin: "0 auto",
  },
  cabecalho: { display: "flex", gap: "14px", marginBottom: "22px" },
  iconeCabecalho: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    backgroundColor: "#eff6ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  titulo: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: "18px",
    fontWeight: 700,
    margin: 0,
    color: "#0f172a",
  },
  subtitulo: { fontSize: "13px", color: "#64748b", margin: "4px 0 0 0", lineHeight: 1.5 },

  painelSelecao: { display: "flex", flexDirection: "column", gap: "16px" },
  campo: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "13px", fontWeight: 600, color: "#334155" },
  select: {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    fontSize: "14px",
    color: "#0f172a",
    backgroundColor: "#f8fafc",
  },
  grupoBotoes: { display: "flex", gap: "10px" },
  botaoModo: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc",
    color: "#475569",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
  },
  botaoModoAtivo: {
    backgroundColor: "#eff6ff",
    borderColor: "#2563eb",
    color: "#2563eb",
  },
  botaoIniciar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "13px",
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontWeight: 600,
    fontSize: "14px",
    cursor: "pointer",
    marginTop: "6px",
  },

  areaCamera: { display: "flex", flexDirection: "column", gap: "14px", alignItems: "center" },
  caixaCamera: {
    width: "100%",
    borderRadius: "14px",
    overflow: "hidden",
    backgroundColor: "#0f1729",
    position: "relative",
    minHeight: "260px",
  },
  overlayProcessando: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(15, 23, 41, 0.75)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    color: "#f8fafc",
    fontSize: "13px",
    fontWeight: 600,
  },
  botaoCancelar: {
    padding: "9px 18px",
    backgroundColor: "transparent",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    color: "#64748b",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
  },

  resultado: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    padding: "32px 20px",
    borderRadius: "14px",
    textAlign: "center",
  },
  resultadoSucesso: { backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0" },
  resultadoErro: { backgroundColor: "#fef2f2", border: "1px solid #fecaca" },
  resultadoTexto: { fontSize: "14px", color: "#0f172a", fontWeight: 500, margin: 0 },
  botaoNovaLeitura: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 20px",
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    marginTop: "4px",
  },
};

export default LeitorPresenca;
