import { useLocation, useNavigate } from "react-router-dom";

function VisualizarCertificado() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Pega os dados do certificado que passamos através do 'navigate'
  const certificado = location.state?.certificado;

  if (!certificado) {
    return (
      <div style={{ color: "#fff", padding: "40px", textAlign: "center" }}>
        <p>Dados do certificado não encontrados.</p>
        <button onClick={() => navigate(-1)} style={{ color: "#eab308" }}>Voltar</button>
      </div>
    );
  }

  // Atalho para disparar a impressão nativa do navegador (Salvar como PDF)
  const imprimir = () => {
    window.print();
  };

  return (
    <div className="tela-certificado" style={styles.container}>
      {/* Botões de Controle (Somente aparecem na tela, somem na impressão) */}
      <div className="ocultar-na-impressao" style={styles.barraAcoes}>
        <button onClick={() => navigate(-1)} style={styles.btnVoltar}>← Voltar</button>
        <button onClick={imprimir} style={styles.btnImprimir}>🖨️ Imprimir / Salvar PDF</button>
      </div>

      {/* 📜 BORDAS E DESIGN DO CERTIFICADO OFICIAL */}
      <div style={styles.certificadoPapel}>
        <div style={styles.bordaInterna}>
          <div style={styles.selo}>🏅</div>
          <h1 style={styles.titulo}>CERTIFICADO DE PARTICIPAÇÃO</h1>
          
          <p style={styles.textoPrincipal}>
            Certificamos para os devidos fins que o(a) participante <br />
            <strong style={styles.destaque}>{certificado.usuario?.nome}</strong> <br />
            concluiu com êxito sua participação no 
            {certificado.minicurso ? " minicurso " : " evento "} 
            <strong style={styles.destaque}>
              {certificado.minicurso ? certificado.minicurso.nome : certificado.evento?.nome}
            </strong>, 
            realizado na modalidade {certificado.evento?.modalidade || "Presencial"}.
          </p>

          <div style={styles.rodape}>
            <div>
              <p style={styles.linhaAssinatura}>_____________________________________</p>
              <p style={styles.subTexto}>Organização do Congresso</p>
            </div>
          </div>

          <div style={styles.autenticacao}>
            <p style={styles.codigo}>Código de Autenticidade: {certificado.codigoValidacao}</p>
          </div>
        </div>
      </div>

      {/* CSS Injetado rápido para garantir que os botões sumam ao salvar o PDF */}
      <style>{`
        @media print {
          .ocultar-na-impressao { display: none !important; }
          body { background-color: #fff !important; color: #000 !important; }
          .tela-certificado { padding: 0 !important; background: none !important; min-height: auto !important; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", backgroundColor: "#111317", padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" },
  barraAcoes: { display: "flex", gap: "15px", width: "100%", maxWidth: "842px" },
  btnVoltar: { padding: "10px 20px", backgroundColor: "#2a2f3a", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" },
  btnImprimir: { padding: "10px 20px", backgroundColor: "#eab308", color: "#111317", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" },
  
  // Medidas proporcionais ao formato A4 Paisagem para impressão perfeita
  certificadoPapel: { width: "100%", maxWidth: "842px", minHeight: "595px", backgroundColor: "#fff", color: "#222", padding: "30px", borderRadius: "8px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)", boxSizing: "border-box", display: "flex", flexDirection: "column" },
  bordaInterna: { border: "4px double #eab308", flex: 1, padding: "40px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", position: "relative" },
  selo: { fontSize: "50px", marginBottom: "10px" },
  titulo: { fontFamily: "Georgia, serif", fontSize: "36px", color: "#111", margin: "0 0 30px 0", letterSpacing: "1px" },
  textoPrincipal: { fontSize: "18px", lineHeight: "1.8", color: "#444", maxWidth: "650px", margin: "0 0 40px 0" },
  destaque: { color: "#111", fontSize: "22px", fontWeight: "bold" },
  rodape: { marginTop: "auto", width: "100%", display: "flex", justifyContent: "center" },
  linhaAssinatura: { margin: "0 0 5px 0", color: "#888" },
  subTexto: { fontSize: "14px", color: "#666", margin: 0 },
  autenticacao: { marginTop: "30px", fontSize: "11px", color: "#999" }
};

export default VisualizarCertificado;