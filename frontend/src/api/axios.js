import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://hisabi-backend.up.railway.app' : 'http://localhost:5000');
const api = axios.create({
    baseURL: `${BASE_URL}/api`,
});

export const IMAGE_BASE_URL = BASE_URL;

export const getImageUrl = (path) => {
    if (!path) return null;
    if (typeof path === 'string' && (path.startsWith('data:') || path.startsWith('http://') || path.startsWith('https://'))) {
        return path;
    }
    const base = IMAGE_BASE_URL.endsWith('/') ? IMAGE_BASE_URL.slice(0, -1) : IMAGE_BASE_URL;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${normalizedPath}`;
};

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
    (config) => {
        // Use superAdminToken for internal admin routes, standard token for shop routes
        const isAdminRoute = config.url.startsWith('/super-admin') && !config.url.includes('/public/');
        const token = isAdminRoute
            ? localStorage.getItem('superAdminToken')
            : localStorage.getItem('token');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle 401 errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            const isAdminRoute = error.config.url.startsWith('/super-admin');

            if (isAdminRoute) {
                localStorage.removeItem('superAdminToken');
                if (window.location.pathname !== '/super-admin-login') {
                    window.location.href = '/super-admin-login';
                }
            } else {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
