import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
// Importação dos ícones do Lucide
import { Lock, ArrowLeft, ChevronRight } from "lucide-react";




function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // 🔙 Se veio de alguma página específica (ex: DetalhesEvento), guarda pra onde voltar
  const from = location.state?.from || null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    if (!email || !senha) {
      setErro("Preencha todos os campos.");
      setCarregando(false);
      return;
    }

    try {
      const response = await fetch("https://projeto-congresso.onrender.com/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, senha }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "E-mail ou senha incorretos.");
      }

      // 🔍 INSPEÇÃO DE BACKEND: Abre o F12 no navegador para ver o formato exato que chegou
      console.log("Resposta bruta do Backend no Login:", data);

      // Mapeamento inteligente extraindo o token
      const token = data.token || data.tokenAcesso || data.accessToken;

      // Mapeamento extraindo o cargo/role
      // O backend retorna em data.usuario.perfil (confirmado no service)
      const roleRaw = data.usuario?.perfil || data.perfil || data.role || "PARTICIPANTE";
      const roleLimpa = String(roleRaw).toUpperCase().trim();

      // Mapeamento do nome
      const nome = data.usuario?.nome || data.nome || data.name || "Participante";

      // Mapeamento do ID do usuário (necessário pra criar inscrições depois)
      const userId = data.usuario?.id || data.id || null;

      if (!token) {
        throw new Error("O servidor não retornou um token de autenticação válido.");
      }

      // 💾 Salvando no LocalStorage
      localStorage.setItem("token", token);
      localStorage.setItem("userRole", roleLimpa);
      localStorage.setItem("userName", nome);
      if (userId) localStorage.setItem("userId", userId);

      console.log("Role identificada e limpa:", roleLimpa);

      // 🔀 Se veio de uma página específica (ex: quis se inscrever em um evento), volta pra lá.
      // A própria página de destino (DetalhesEvento) vai completar a ação pendente.
      if (from) {
        navigate(from, { replace: true });
        return;
      }

      // Caso contrário, comportamento padrão: manda pro dashboard da role
      // Aceita variações como "ADMIN", "ADMINISTRADOR", "ADMINISTRADORA"
      if (roleLimpa.includes("ADMIN")) {
        console.log("Direcionando para o painel do Admin...");
        navigate("/dashboard-admin");
      } else if (roleLimpa === "COLABORADOR" || roleLimpa === "ORGANIZADOR") {
        navigate("/dashboard-colaborador");
      } else {
        navigate("/dashboard-participante");
      }

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
        .btn-primario-login:hover:not(:disabled) { background-color: #1d4ed8 !important; }
        .btn-ghost-login:hover { background-color: #f1f5f9 !important; }
        .btn-ghost-login:hover svg { transform: translateX(-2px); } /* Efeito suave no ícone de voltar */
        .input-login:focus { outline: none; border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
        .link-cadastro:hover { color: #1d4ed8 !important; }
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
        <button onClick={() => navigate("/")} style={styles.botaoVoltarHome} className="btn-ghost-login">
          <ArrowLeft size={16} style={{ transition: "transform 0.2s" }} />
          Voltar para o início
        </button>
      </header>

      {/* CONTEÚDO */}
      <div style={styles.conteudo}>
        <div style={styles.card}>
          <div style={styles.cardIconeBox}>
            <Lock size={24} color="#2563eb" />
          </div>
          <h2 style={styles.titulo}>Entrar no Congresso</h2>
          <p style={styles.subtitulo}>Acesse sua conta para gerenciar suas inscrições.</p>

          {erro && <div style={styles.erro}>{erro}</div>}

          <form onSubmit={handleLogin} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>E-mail</label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                className="input-login"
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Senha</label>
              <input
                type="password"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                style={styles.input}
                className="input-login"
              />
            </div>

            <button type="submit" disabled={carregando} style={styles.botao} className="btn-primario-login">
              {carregando ? (
                "Carregando..."
              ) : (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  Entrar <ChevronRight size={16} />
                </span>
              )}
            </button>
          </form>

          <p style={styles.rodape}>
            Não tem uma conta?{" "}
            <span onClick={() => navigate("/cadastrar")} style={styles.link} className="link-cadastro">
              Cadastre-se
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
    maxWidth: "420px",
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
    gap: "18px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    textAlign: "left",
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
  },
  botao: {
    padding: "13px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#2563eb",
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

export default Login;