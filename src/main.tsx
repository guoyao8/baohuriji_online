import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// 隐藏 loading 动画
const hideLoading = () => {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.style.opacity = '0';
    loading.style.transition = 'opacity 0.3s';
    setTimeout(() => {
      loading.style.display = 'none';
    }, 300);
  }
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// React 渲染后隐藏 loading
setTimeout(hideLoading, 100);
