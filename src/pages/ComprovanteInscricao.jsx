import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function ComprovanteInscricao() {
  const { id } = useParams(); // Pega o ID da inscrição da URL
  const navigate = useNavigate();
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const buscarComprovante = async () => {
      try {
        setCarregando(true);
        // Busca os dados da inscrição pelo ID
        const res = await fetch(`https://projeto-congresso.onrender.com/inscricao/${id}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (!res.ok) throw new Error("Não foi possível carregar o comprovante.");
        const data = await res.json();
        setDados(data);
      } catch (err) {
        setErro(err.message);
      } finally {
        setCarregando(false);
      }
    };

    buscarComprovante();
  }, [id, navigate]);

  if (carregando) return <div style={styles.aviso}>Carregando seu comprovante...</div>;
  if (erro) return <div style={styles.erroBox}>{erro}</div>;
  if (!dados) return <div style={styles.aviso}>Inscrição não encontrada.</div>;

  return (
    <div style={styles.container}>
      <div style={styles.ticket}>
        {/* Cabeçalho do Ticket */}
        <div style={styles.ticketHeader}>
          <h2 style={styles.eventoNome}>{dados.evento?.nome}</h2>
          <span style={styles.badgeStatus}>{dados.status}</span>
        </div>

        {/* Corpo com Infos */}
        <div style={styles.ticketBody}>
          <div style={styles.infoGrupo}>
            <p style={styles.label}>Participante</p>
            <p style={styles.valor}>{dados.usuario?.nome}</p>
          </div>

          <div style={styles.infoGrupo}>
            <p style={styles.label}>📍 Local</p>
            <p style={styles.valor}>{dados.evento?.local}</p>
          </div>

          <div style={styles.infoGrid}>
            <div>
              <p style={styles.label}>📅 Data</p>
              <p style={styles.valor}>{dados.evento?.dataInicio || "Ver na Home"}</p>
            </div>
            <div>
              <p style={styles.label}>🔑 Código</p>
              <p style={styles.valor}>#{dados.id}</p>
            </div>
          </div>
        </div>

        {/* Linha serrilhada de ingresso */}
        <div style={styles.divisor}></div>

        {/* Área do QR Code */}
        <div style={styles.qrSecao}>
          {/* Como o backend retorna em Base64, passamos direto no src */}
          <img 
            src={dados.qrCode} 
            alt="QR Code de Entrada" 
            style={styles.qrCodeImg} 
          />
          <p style={styles.qrDica}>Apresente este QR Code na entrada do evento para realizar seu check-in.</p>
        </div>
      </div>

      <button onClick={() => navigate(-1)} style={styles.botaoVoltar}>
        ← Voltar para o Painel
      </button>
    </div>
  );
}

const styles = {
  container: { width: "100%", minHeight: "100vh", backgroundColor: "#111317", color: "#fff", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "20px" },
  ticket: { width: "100%", maxWidth: "400px", backgroundColor: "#1a1d24", borderRadius: "16px", border: "1px solid #2a2f3a", overflow: "hidden", boxShadow: "0 10px 25px rgba(0,0,0,0.3)" },
  ticketHeader: { padding: "24px", borderBottom: "1px dashed #2a2f3a", position: "relative" },
  eventoNome: { fontSize: "20px", fontWeight: "700", color: "#fff", margin: "0 0 8px 0", textAlign: "left" },
  badgeStatus: { backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#34d399", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "600" },
  ticketBody: { padding: "24px", display: "flex", flexDirection: "column", gap: "16px", textAlign: "left" },
  infoGrupo: { display: "flex", flexDirection: "column", gap: "4px" },
  infoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  label: { fontSize: "12px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", margin: 0 },
  valor: { fontSize: "15px", color: "#f3f4f6", fontWeight: "500", margin: 0 },
  divisor: { height: "1px", borderTop: "2px dashed #2a2f3a", margin: "0 12px" },
  qrSecao: { padding: "32px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" },
  qrCodeImg: { width: "180px", height: "180px", backgroundColor: "#fff", padding: "8px", borderRadius: "8px" },
  qrDica: { fontSize: "13px", color: "#9ca3af", textAlign: "center", margin: 0, lineHeight: "1.4" },
  botaoVoltar: { marginTop: "24px", padding: "10px 20px", backgroundColor: "transparent", color: "#9ca3af", border: "1px solid #374151", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "500", transition: "all 0.2s" },
  aviso: { color: "#9ca3af", padding: "40px", fontSize: "16px" },
  erroBox: { backgroundColor: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", color: "#f87171", padding: "16px", borderRadius: "6px" }
};

export default ComprovanteInscricao;