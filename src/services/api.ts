import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787/api';

// 重试配置
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 增加到30秒，适应移动网络
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

console.log('API Base URL:', API_BASE_URL);

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const config = error.config;
    
    // 处理超时错误
    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      console.error('请求超时，请检查网络连接');
      
      // 自动重试
      if (!config.__retryCount) {
        config.__retryCount = 0;
      }
      
      if (config.__retryCount < MAX_RETRIES) {
        config.__retryCount++;
        console.log(`重试第 ${config.__retryCount} 次...`);
        
        // 延迟后重试
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return api.request(config);
      }
      
      error.message = '网络请求超时，请检查网络连接后重试';
    }
    
    // 处理网络错误
    if (error.message === 'Network Error') {
      console.error('网络错误，请检查网络连接');
      
      // 自动重试
      if (!config.__retryCount) {
        config.__retryCount = 0;
      }
      
      if (config.__retryCount < MAX_RETRIES) {
        config.__retryCount++;
        console.log(`重试第 ${config.__retryCount} 次...`);
        
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return api.request(config);
      }
      
      error.message = '网络连接失败，请检查网络后重试';
    }
    
    // 处理401未授权
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;
