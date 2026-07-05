const env = {
  appName: import.meta.env.VITE_APP_NAME ?? 'Multi Medical Model Platform',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1',
  appVersion: import.meta.env.VITE_APP_VERSION ?? '0.1.0',
};

export default env;
