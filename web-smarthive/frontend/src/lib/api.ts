const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function authHeader(): HeadersInit {
  const token = localStorage.getItem("token");
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

interface ApiOptions {
  method?: string;
  body?: any;
  headers?: HeadersInit;
}

export async function api(path: string, options: ApiOptions = {}) {
  const { method = "GET", body, headers = {} } = options;

  const config: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
      ...headers,
    },
  };

  if (body) {
    try {
      config.body = JSON.stringify(body);
      console.log('Request Config:', {
        url: `${API_BASE_URL}${path}`,
        method,
        headers: config.headers,
        body: config.body
      });
    } catch (error) {
      console.error('Erro ao serializar body:', error);
      throw new Error('Erro ao processar dados da requisição');
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, config);
    
    let data;
    const contentType = response.headers.get("content-type");
    
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      throw new Error(data.message || data || "Erro na requisição");
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Erro desconhecido na requisição");
  }
}

export { API_BASE_URL };
