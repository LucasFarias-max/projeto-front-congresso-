import { BrowserRouter, Routes, Route } from "react-router-dom";

// Importações seguindo rigorosamente a sua estrutura de arquivos
import Home from "./pages/home";
import Login from "./pages/login";
import Cadastrar from "./pages/cadastrar";
import DashboardAdmin from "./pages/dashboardAdmin";
import DashboardColaborador from "./pages/dashboardColaborador";
import DashboardParticipante from "./pages/dashboardParticipante";
import ComprovanteInscricao from "./pages/ComprovanteInscricao";
import VisualizarCertificado from "./pages/VisualizarCertificado";
import DetalhesEvento from "./pages/DetalhesEvento";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota Pública Inicial */}
        <Route path="/" element={<Home />} />
        
        {/* Rotas de Autenticação */}
        <Route path="/login" element={<Login />} />
        <Route path="/cadastrar" element={<Cadastrar />} />
        
        {/* Painéis das Dashboards Específicas */}
        <Route path="/dashboard-admin" element={<DashboardAdmin />} />
        <Route path="/dashboard-colaborador" element={<DashboardColaborador />} />
        <Route path="/dashboard-participante" element={<DashboardParticipante />} />
        <Route path="/comprovante/:id" element={<ComprovanteInscricao />} />
        <Route path="/visualizar-certificado/:id" element={<VisualizarCertificado />} />
        <Route path="/eventos/:id" element={<DetalhesEvento />} />
        
        {/* Rota 404 - Caso digitem algo errado */}
        <Route path="*" element={<div style={{ padding: "20px" }}><h2>Página não encontrada!</h2></div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;