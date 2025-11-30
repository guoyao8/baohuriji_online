import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
// import { VitePWA } from 'vite-plugin-pwa' // 需要时取消注释并安装: npm install -D vite-plugin-pwa

export default defineConfig({
  plugins: [
    react(),
    // 启用 PWA（需要安装 vite-plugin-pwa）
    // VitePWA({
    //   registerType: 'autoUpdate',
    //   includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
    //   manifest: {
    //     name: '宝贝日记',
    //     short_name: '宝贝日记',
    //     description: '婴儿喂养记录与数据统计应用',
    //     theme_color: '#6366f1',
    //     background_color: '#ffffff',
    //     display: 'standalone',
    //     icons: [
    //       {
    //         src: 'pwa-192x192.png',
    //         sizes: '192x192',
    //         type: 'image/png'
    //       },
    //       {
    //         src: 'pwa-512x512.png',
    //         sizes: '512x512',
    //         type: 'image/png',
    //         purpose: 'any maskable'
    //       }
    //     ]
    //   },
    //   workbox: {
    //     runtimeCaching: [
    //       {
    //         urlPattern: /^https:\/\/.*\/api\/.*/i,
    //         handler: 'NetworkFirst',
    //         options: {
    //           cacheName: 'api-cache',
    //           expiration: {
    //             maxEntries: 50,
    //             maxAgeSeconds: 60 * 60 * 24
    //           }
    //         }
    //       }
    //     ]
    //   }
    // })
  ],
  publicDir: 'public', // 确保 public 目录中的文件被复制
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  build: {
    // 代码分割优化
    rollupOptions: {
      output: {
        manualChunks: {
          // React 相关
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // 状态管理
          'store': ['zustand'],
          // UI 库
          'date-utils': ['date-fns'],
          // HTTP 请求
          'http': ['axios'],
        },
      },
    },
    // 使用 esbuild 压缩（更快）
    minify: 'esbuild',
    // 警告阈值设置
    chunkSizeWarningLimit: 1000,
    // 开启 CSS 代码分割
    cssCodeSplit: true,
    // 生成 source map 用于调试（仅开发环境）
    sourcemap: false,
    // 优化依赖预构建
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
  },
})
