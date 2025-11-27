/** @type {import('next').NextConfig} */

// Validar variáveis de ambiente obrigatórias
const requiredEnvVars = ['NEXT_PUBLIC_API_URL'];

requiredEnvVars.forEach((name) => {
  if (!process.env[name]) {
    console.warn(`[next.config.js] Variável de ambiente ausente: ${name}`);
  }
});

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Disable image optimization for deployment
  images: {
    unoptimized: true,
  },

  // Trailing slash for compatibility
  trailingSlash: true,

  // Ignore ESLint and TypeScript errors during build (temporary)
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Environment variables - SEM FALLBACK PARA LOCALHOST:3001
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_FIBONACCI_API_BASE_URL: process.env.NEXT_PUBLIC_FIBONACCI_API_BASE_URL,
    NEXT_PUBLIC_NIGREDO_API_BASE_URL: process.env.NEXT_PUBLIC_NIGREDO_API_BASE_URL,
  },

  // Webpack configuration
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    return config;
  },
};

module.exports = nextConfig;
