import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    // Configuración para producción
    base: mode === 'production' ? '/' : '/',
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
          },
        },
      },
    },
    // Configuración para desarrollo - CORREGIDA para acceso móvil
    server: {
      port: 5173, // Puerto correcto que coincide con CORS
      host: '0.0.0.0', // Permite acceso desde cualquier IP en la red local
      strictPort: true, // Falla si el puerto no está disponible
      // Configuración para SPA routing
      historyApiFallback: true,
      // Configuración para hot reload en dispositivos móviles
      hmr: {
        port: 5173,
        host: '0.0.0.0'
      },
      // Configuración adicional para dispositivos móviles
      fs: {
        strict: false
      }
    },
    // Configuración para preview
    preview: {
      port: 4173,
      host: '0.0.0.0', // También para preview
      strictPort: true,
      // Configuración para SPA routing en preview
      historyApiFallback: true,
      // Configuración para hot reload en dispositivos móviles
      hmr: {
        port: 4173,
        host: '0.0.0.0'
      }
    }
  }
})
