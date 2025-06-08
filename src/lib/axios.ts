import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from 'axios';
import http from 'http';

let singletonAiInstance: AxiosInstance | null = null;

const getAiHttpInstance = (): AxiosInstance => {
  if (singletonAiInstance) {
    return singletonAiInstance;
  }

  const keepAliveAgent = new http.Agent({
    keepAlive: true,
    keepAliveMsecs: 120_000,
    maxSockets: Infinity,
  });

  const instance = axios.create({
    baseURL: process.env.AI_URL ?? 'http://dispatchai-ai:8000/api',
    timeout: 60_000,
    httpAgent: keepAliveAgent,
  });

  singletonAiInstance = instance;
  return instance;
};

const ai = (
  endpoint: string,
  config?: AxiosRequestConfig,
): Promise<AxiosResponse> => {
  const axiosInstance = getAiHttpInstance();
  return axiosInstance(endpoint, { ...config });
};

export default ai;
