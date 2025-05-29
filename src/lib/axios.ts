import axios, { type AxiosRequestConfig } from 'axios';

const aiHttpInstance = () => {
  const axiosInstance = axios.create();
  axiosInstance.defaults.baseURL =
    process.env.AI_URL || 'http://localhost:8000';

  return axiosInstance;
};

const ai = (endpoint: string, config?: AxiosRequestConfig) => {
  const axiosInstance = aiHttpInstance();
  return axiosInstance(endpoint, { ...config });
};

export default ai;
