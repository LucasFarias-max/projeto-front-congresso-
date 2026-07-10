//const API_URL = "http://localhost:3000"; // Ajuste a porta se o seu Express rodar em outra
// Removemos todas as barras do final das URLs para padronizar
//const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  //? "http://localhost:3000" 
 // : "https://projeto-congresso.onrender.com";
 const API_URL = "https://projeto-congresso.onrender.com";

export const api = {
  // GET genérico
  async get(endpoint) {
    const token = localStorage.getItem("token");
    
    // Forçamos uma barra '/' entre a API_URL e o endpoint para nunca grudar
    const url = `${API_URL}/${endpoint.replace(/^\//, "")}`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    if (!response.ok) throw new Error("Erro na requisição GET");
    return response.json();
  },

  // POST genérico
  async post(endpoint, dados) {
    const token = localStorage.getItem("token");
    
    // Forçamos uma barra '/' entre a API_URL e o endpoint para nunca grudar
    const url = `${API_URL}/${endpoint.replace(/^\//, "")}`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(dados),
    });
    
    const json = await response.json();
    if (!response.ok) throw new Error(json.erro || json.error || "Erro na requisição POST");
    return json;
  }
};