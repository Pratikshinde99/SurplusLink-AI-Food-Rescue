import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const API = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const getAuthToken = () => localStorage.getItem('authToken');

const getUserData = () => {
  try {
    return JSON.parse(localStorage.getItem('userData') || '{}');
  } catch {
    return {};
  }
};

const saveAuthToken = (token, userData) => {
  localStorage.setItem('authToken', token);
  localStorage.setItem('userData', JSON.stringify(userData));
};

const clearAuthToken = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userData');
};

API.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.debug(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('[API] Unauthorized - clearing auth token');
      clearAuthToken();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        const next = encodeURIComponent(window.location.pathname || '/ngo');
        window.location.href = `/login?next=${next}`;
      }
    } else if (error.response?.status === 403) {
      console.error('[API] Forbidden');
    } else if (error.response?.status === 429) {
      console.error('[API] Rate limited - please try again later');
    } else if (error.response?.status >= 500) {
      console.error('[API] Server error:', error.response?.data);
    } else if (!error.response) {
      console.error('[API] Network error - unable to reach server');
    }

    return Promise.reject(error);
  }
);

export const api = {
  getListings: (status, supplierId) =>
    API.get('/listings', { params: { 
      ...(status && { status }), 
      ...(supplierId && { supplier_id: supplierId }) 
    } }).then((response) => response.data),

  createListing: (data) =>
    API.post('/listings', data).then((response) => response.data),

  deleteListing: (id) =>
    API.delete(`/listings/${id}`).then((response) => response.data),

  claimListing: (id) =>
    API.put(`/listings/${id}/claim`).then((response) => response.data),

  verifyPickup: (id, token) =>
    API.put(`/listings/${id}/verify`, null, { params: { token } }).then((response) => response.data),

  getScore: (id) =>
    API.get(`/listings/${id}/score`).then((response) => response.data),

  predictImpact: (data) =>
    API.post('/listings/predict-impact', data).then((response) => response.data),

  getStats: () =>
    API.get('/stats').then((response) => response.data),

  healthCheck: () =>
    API.get('/health')
      .then(() => true)
      .catch(() => false),

  register: (email, password, organizationName, role = 'supplier') =>
    API.post('/auth/register', {
      email,
      password,
      organization_name: organizationName,
      role,
    }).then((response) => {
      saveAuthToken(response.data.access_token, {
        user_id: response.data.user_id,
        email: response.data.email,
        role: response.data.role,
      });
      return response.data;
    }),

  login: (email, password) =>
    API.post('/auth/login', { email, password }).then((response) => {
      saveAuthToken(response.data.access_token, {
        user_id: response.data.user_id,
        email: response.data.email,
        role: response.data.role,
      });
      return response.data;
    }),

  logout: () => {
    clearAuthToken();
  },

  getCurrentUser: () => API.get('/auth/me').then((response) => response.data),

  getBaseUrl: () => API_URL,
  getAuthToken,
  getUserData,
  clearAuthToken,
};

export default API;
