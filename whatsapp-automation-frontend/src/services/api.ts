const API_BASE_URL = 'http://localhost:3000/api/v1';

export const API = {
  // --- WhatsApp / Chat Endpoints ---
  getConversations: async (tenantId: string = 'golden-cafe') => {
    const res = await fetch(`${API_BASE_URL}/whatsapp/conversations/${tenantId}`);
    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(err.message || 'Failed to fetch conversations');
    }
    const json = await res.json();
    return json.data || [];
  },

  getChatHistory: async (tenantId: string, phone: string) => {
    const res = await fetch(`${API_BASE_URL}/whatsapp/chat-history/${tenantId}/${phone}`);
    if (!res.ok) throw new Error('Failed to fetch chat history');
    const json = await res.json();
    return json.data || [];
  },

  getConnectionStatus: async () => {
    const res = await fetch(`${API_BASE_URL}/whatsapp/status`);
    if (!res.ok) throw new Error('Failed to fetch status');
    const json = await res.json();
    return json.data || {};
  },

  // --- Catalog Endpoints ---
  getProducts: async (tenantId: string = 'golden-cafe') => {
    const res = await fetch(`${API_BASE_URL}/catalog/products/${tenantId}`);
    if (!res.ok) throw new Error('Failed to fetch products');
    const json = await res.json();
    return json.data || [];
  },

  getCategories: async (tenantId: string = 'golden-cafe') => {
    const res = await fetch(`${API_BASE_URL}/catalog/categories/${tenantId}`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    const json = await res.json();
    return json.data || [];
  },

  sendMessage: async (phone: string, content: string, tenantId: string = 'golden-cafe') => {
    const res = await fetch(`${API_BASE_URL}/whatsapp/test-send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, content, tenantId })
    });
    if (!res.ok) throw new Error('Failed to send message');
    return res.json();
  }
};


