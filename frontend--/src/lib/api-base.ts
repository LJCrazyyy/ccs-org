const LOCAL_API_BASE = 'http://localhost:8080';

export const getApiBase = () => {
  const configuredBase = import.meta.env.VITE_API_BASE_URL?.trim();

  if (configuredBase) {
    return configuredBase;
  }

  return import.meta.env.DEV ? LOCAL_API_BASE : '';
};