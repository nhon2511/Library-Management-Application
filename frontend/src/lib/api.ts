import axios from 'axios';
import type { ApiResponse } from './types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  withCredentials: true,
});
let accessToken = sessionStorage.getItem('lms_access_token');
let refreshing: Promise<string | null> | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  token
    ? sessionStorage.setItem('lms_access_token', token)
    : sessionStorage.removeItem('lms_access_token');
};
export const getAccessToken = () => accessToken;

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (
      error.response?.status !== 401 ||
      original?._retry ||
      original?.url?.includes('/auth/refresh')
    )
      return Promise.reject(error);
    original._retry = true;
    refreshing ||= api
      .post('/auth/refresh')
      .then(({ data }) => {
        setAccessToken(data.data.accessToken);
        return data.data.accessToken;
      })
      .catch(() => {
        setAccessToken(null);
        return null;
      })
      .finally(() => {
        refreshing = null;
      });
    const token = await refreshing;
    if (!token) return Promise.reject(error);
    original.headers.Authorization = `Bearer ${token}`;
    return api(original);
  },
);

export const unwrap = <T>(request: Promise<{ data: ApiResponse<T> }>) =>
  request.then((response) => response.data);
export default api;
