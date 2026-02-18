import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:0/api/v1";
const api = axios.create({
  baseURL: API_URL,
  // headers: {
  //   'Content-Type': 'application/json',
  // },
});
api.interceptors.request.use((config) => {
  if (
    !(config.data instanceof FormData) &&
    config.headers["Content-Type"] !== "application/x-www-form-urlencoded"
  ) {
    config.headers["Content-Type"] = "application/json";
  }
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('isAuthenticated');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const ProductAPI = {
  upsert: async (data: any) => {
    const response = await api.post("/products/upsert", data);
    return response.data;
  },
  getAll: async (skip = 0, limit = 100, filters = {}) => {
    const response = await api.get("/products/", {
      params: { skip, limit, ...filters },
    });
    return response.data;
  },
  getOne: async (code: string) => {
    const response = await api.get(`/products/${code}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post("/products/", data);
    return response.data;
  },
  update: async (code: string, data: any) => {
    const response = await api.put(`/products/${code}`, data);
    return response.data;
  },
  delete: async (code: string) => {
    const response = await api.delete(`/products/${code}`);
    return response.data;
  },
};
export const EnrichmentAPI = {
  enrich: async (productCode: string) => {
    const response = await api.post(`/enrichment/run/${productCode}`);
    return response.data;
  },
  standardize: async (productCode: string) => {
    const response = await api.post(`/standardization/run/${productCode}`);
    return response.data;
  },
  approve: async (id: string) => {
    return await api.post(`/hitl/${id}/approve`);
  },
  reject: async (id: string) => {
    return await api.post(`/hitl/${id}/reject`);
  },
  override: async (id: string, newValue: string) => {
    return await api.post(`/hitl/${id}/override`, null, {
      params: { new_value: newValue },
    });
  },
  calculateScore: async (productCode: string) => {
    const response = await api.post(`/enrichment/score/${productCode}`);
    return response.data;
  },
  getStatus: async (id: string) => {
    const response = await api.get(`/enrichment/${id}`);
    return response.data;
  },
  getHistory: async (productCode: string) => {
    const response = await api.get(`/enrichment/history/${productCode}`);
    return response.data;
  },
  getSuggestions: async (productCode: string) => {
    const url = productCode
      ? `/enrichment/suggestions?product_id=${productCode}`
      : `/enrichment/suggestions`;
    const response = await api.get(url);
    return response.data;
  },
};

type DigitalAssetFilters = {
  search: string;
  brand_name: string | null;
  category: string | null;
}
export const DigitalAssetAPI = {
  getAll: async (filters: DigitalAssetFilters) => {
    const response = await api.get(`/assets/`, {params: filters});
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post("/assets/", data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/assets/${id}`);
    return response.data;
  },
  archive: async (id: string) => {
    const response = await api.patch(`/assets/${id}`);
    return response.data;
  }
};

export const UserAPI = {
  getAll: async () => {
    const response = await api.get("/users/");
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post("/users/", data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
  getActivityLogs: async () => {
    const response = await api.get("/users/activity-logs");
    return response.data;
  },
};

export const RoleAPI = {
  getAll: async () => {
    const response = await api.get("/roles/");
    return response.data;
  },
  getPermissions: async () => {
    const response = await api.get("/roles/permissions");
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post("/roles/", data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await api.put(`/roles/${id}`, data);
    return response.data;
  },
  updatePermissions: async (roleId: string, permissions: any[]) => {
    const response = await api.put(`/roles/${roleId}/permissions`, permissions);
    return response.data;
  },
};
export const ChannelAPI = {
  getAll: async () => {
    const response = await api.get("/channels/");
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post("/channels/", data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/channels/${id}`);
    return response.data;
  },
  getMappings: async (channelId: string) => {
    const response = await api.get(`/channels/${channelId}/mappings`);
    return response.data;
  },
  saveMappings: async (channelId: string, mappings: any[]) => {
    const response = await api.put(`/channels/${channelId}/mappings`, mappings);
    return response.data;
  },
  exportFeed: async (channelId: string, filters: any) => {
    const response = await api.post(
      `/channels/${channelId}/export`,
      { filters },
      {
        responseType: "blob",
      },
    );
    return response.data;
  },
};
export const MasterAPI = {
  getBrands: async () => {
    const response = await api.get("/master/brands");
    return response.data;
  },
  getBrandMeta: async () => {
    const response = await api.get("/master/brands/meta");
    return response.data;
  },
  getCategorymeta: async () => {
    const response =await api.get("/master/categories/meta");
    return response.data;
  },
  getProductMPNMeta: async () => {
    const response =await api.get("/products/mpn/meta");
    return response.data;
  },
  getVendors: async () => {
    const response = await api.get("/master/vendors");
    return response.data;
  },
  getAttributes: async () => {
    const response = await api.get("/master/attributes");
    return response.data;
  },
  update: async (
    type: "brands" | "categories" | "industries" | "vendors" | "attributes",
    code: string,
    data: any,
  ) => {
    const response = await api.put(`/master/${type}/${code}`, data);
    return response.data;
  },
  delete: async (
    type: "brands" | "categories" | "industries" | "vendors" | "attributes",
    code: string,
  ) => {
    const response = await api.delete(`/master/${type}/${code}`);
    return response.data;
  },
  getCategories: async () => {
    const response = await api.get("/master/categories");
    return response.data;
  },
  getIndustries: async () => {
    const response = await api.get("/master/industries/");
    return response.data;
  },
  create: async (type: "brands" | "vendors" | "categories" | "industries" | "attributes",data: any,) => {
    const response = await api.post(`/master/${type}`, data);
    return response.data;
  },
};
export const AuthAPI = {
  login: async (params: URLSearchParams) => {
    const response = await api.post(
      "/auth/login/access-token",
      params.toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      },
    );
    return response.data;
  },
};
export default api;
