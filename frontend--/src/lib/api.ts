import { getApiBase } from './api-base';

export const API_BASE = getApiBase();

export const apiUrl = (path: string) => {
  if (path.startsWith('http')) return path;
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
};
