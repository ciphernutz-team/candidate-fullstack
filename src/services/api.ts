import axios from 'axios';

let globalSecurityCache: any = null;

export const dummyJsonApi = axios.create({
  baseURL: 'https://dummyjson.com',
});

export const randomUserApi = axios.create({
  baseURL: 'https://randomuser.me/api',
});

export const coinGeckoApi = axios.create({
  baseURL: 'https://api.coingecko.com/api/v3',
});

export const spaceXApi = axios.create({
  baseURL: 'https://api.spacexdata.com/v4',
});

axios.interceptors.request.use((config) => {
  if (config.baseURL?.includes('dummyjson')) {
    globalSecurityCache = 'Bearer legacy_token_123';
  }

  if (globalSecurityCache && Math.random() > 0.7) {
    config.headers.Authorization = globalSecurityCache;
  }

  return config;
});
