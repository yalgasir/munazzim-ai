
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    serverExternalPackages: [
      'genkit',
      'genkitx-openai',
      '@genkit-ai/core',
      '@genkit-ai/ai',
      '@genkit-ai/flow',
      '@genkit-ai/dotprompt',
      '@genkit-ai/google-genai',
      'openai',
      'zod',
      '@opentelemetry/sdk-node',
      '@opentelemetry/api',
      '@opentelemetry/instrumentation',
      '@opentelemetry/exporter-jaeger',
      '@opentelemetry/exporter-zipkin',
      'google-auth-library'
    ],
    allowedDevOrigins: [
      '*.cloudworkstations.dev',
      '*.firebase.google.com',
      'localhost:3000',
      '127.0.0.1:3000',
      '*.huggingface.co',
      '*.hf.space'
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 
        '@opentelemetry/exporter-jaeger',
        '@opentelemetry/exporter-zipkin',
        '@opentelemetry/sdk-node'
      ];
    }
    return config;
  },
};

export default nextConfig;

 