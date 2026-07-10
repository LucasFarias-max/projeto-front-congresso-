import { useState } from "react";
import { useNavigate } from "react-router-dom";
// Importação dos ícones do Lucide
import { User, ArrowLeft, ChevronRight } from "lucide-react";

function Cadastrar() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [perfilId, setPerfilId] = useState(3); // 🔄 Começa como Participante (3) por padrão
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(false);

  const navigate = useNavigate();

  const handleCadastro = async (e) => {
    e.preventDefault();
    setErro("");
    setSucesso("");

    if (!nome || !email || !cpf || !telefone || !senha || !perfilId) {
      setErro("Por favor, preencha todos os campos.");
      return;
    }

    try {
      setCarregando(true);

      const response = await fetch("https://projeto-congresso.onrender.com/usuario", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome,
          email,
          cpf,
          telefone,
          senha,
          perfilId: Number(perfilId) // 🚀 Garante que vai como número inteiro para o backend
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro ao criar conta. Verifique os dados.");
      }

      setSucesso("Conta criada com sucesso! Redirecionando...");
      setTimeout(() => navigate("/login"), 2000);

    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .btn-primario-cadastro:hover:not(:disabled) { background-color: #059669 !important; }
        .btn-ghost-cadastro:hover { background-color: #f1f5f9 !important; }
        .btn-ghost-cadastro:hover svg { transform: translateX(-2px); } /* Efeito de recuo no ícone de voltar */
        .input-cadastro:focus { outline: none; border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
        .link-login:hover { color: #1d4ed8 !important; }
      `}</style>

      {/* HEADER — mesmo padrão das outras telas */}
      <header style={styles.header}>
        <div style={styles.logoBox} onClick={() => navigate("/")}>
          <div style={styles.logoIcone}>◆</div>
          <div>
            <div style={styles.logoTexto}>CONECTA</div>
            <div style={styles.logoSubtexto}>EVENTOS</div>
          </div>
        </div>
        <button onClick={() => navigate("/")} style={styles.botaoVoltarHome} className="btn-ghost-cadastro">
          <ArrowLeft size={16} style={{ transition: "transform 0.2s" }} />
          Voltar para o início
        </button>
      </header>

      {/* CONTEÚDO */}
      <div style={styles.conteudo}>
        <div style={styles.card}>
          <div style={styles.cardIconeBox}>
            <User size={24} color="#2563eb" />
          </div>
          <h2 style={styles.titulo}>Criar Conta</h2>
          <p style={styles.subtitulo}>Preencha seus dados para participar dos eventos.</p>

          {erro && <div style={styles.erro}>{erro}</div>}
          {sucesso && <div style={styles.sucesso}>{sucesso}</div>}

          <form onSubmit={handleCadastro} style={styles.form}>

            {/* Seleção de Tipo de Perfil */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Quero me cadastrar como</label>
              <select
                value={perfilId}
                onChange={(e) => setPerfilId(e.target.value)}
                style={styles.input}
                className="input-cadastro"
              >
                <option value={3}>Participante</option>
                <option value={2}>Colaborador</option>
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Nome Completo</label>
              <input
                type="text"
                placeholder="Seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                style={styles.input}
                className="input-cadastro"
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>E-mail</label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                className="input-cadastro"
              />
            </div>

            <div style={styles.linhaDupla}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>CPF</label>
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  style={styles.input}
                  className="input-cadastro"
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Telefone</label>
                <input
                  type="text"
                  placeholder="(00) 00000-0000"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  style={styles.input}
                  className="input-cadastro"
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Senha</label>
              <input
                type="password"
                placeholder="Crie uma senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                style={styles.input}
                className="input-cadastro"
              />
            </div>

            <button type="submit" disabled={carregando} style={styles.botao} className="btn-primario-cadastro">
              {carregando ? (
                "Cadastrando..."
              ) : (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  Criar minha conta <ChevronRight size={16} />
                </span>
              )}
            </button>
          </form>

          <p style={styles.rodape}>
            Já tem uma conta?{" "}
            <span onClick={() => navigate("/login")} style={styles.link} className="link-login">
              Faça login
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    fontFamily: "'Inter', sans-serif",
    backgroundColor: "#ffffff",
    color: "#0f172a",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  },

  // HEADER
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 48px",
    borderBottom: "1px solid #e2e8f0",
  },
  logoBox: { display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" },
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
  botaoVoltarHome: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "9px 16px",
    backgroundColor: "transparent",
    color: "#334155",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
  },

  // CONTEÚDO
  conteudo: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 20px",
    background: "linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)",
  },
  card: {
    width: "100%",
    maxWidth: "460px",
    padding: "40px",
    borderRadius: "20px",
    backgroundColor: "#ffffff",
    boxShadow: "0 20px 60px rgba(15, 23, 41, 0.08)",
    border: "1px solid #e2e8f0",
    textAlign: "center",
  },
  cardIconeBox: {
    width: "56px",
    height: "56px",
    borderRadius: "16px",
    backgroundColor: "#eff6ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
  },
  titulo: {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 700,
    fontSize: "24px",
    margin: "0 0 6px 0",
    color: "#0f172a",
  },
  subtitulo: {
    fontSize: "14px",
    color: "#64748b",
    margin: "0 0 28px 0",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  linhaDupla: {
    display: "flex",
    gap: "14px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    textAlign: "left",
    flex: 1,
  },
  label: {
    fontSize: "13px",
    color: "#334155",
    fontWeight: 500,
  },
  input: {
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    backgroundColor: "#ffffff",
    color: "#0f172a",
    fontSize: "15px",
    fontFamily: "'Inter', sans-serif",
    width: "100%",
    boxSizing: "border-box",
  },
  botao: {
    padding: "13px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#10b981",
    color: "#fff",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
    marginTop: "6px",
  },
  erro: {
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    border: "1px solid #fecaca",
    color: "#dc2626",
    padding: "12px 14px",
    borderRadius: "10px",
    fontSize: "13.5px",
    marginBottom: "20px",
    textAlign: "left",
  },
  sucesso: {
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    border: "1px solid #a7f3d0",
    color: "#059669",
    padding: "12px 14px",
    borderRadius: "10px",
    fontSize: "13.5px",
    marginBottom: "20px",
    textAlign: "left",
  },
  rodape: {
    textAlign: "center",
    marginTop: "26px",
    fontSize: "14px",
    color: "#64748b",
  },
  link: {
    color: "#2563eb",
    cursor: "pointer",
    fontWeight: 600,
    textDecoration: "none",
  },
};

export default Cadastrar;