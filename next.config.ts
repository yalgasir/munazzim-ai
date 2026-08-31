import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',

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

  // Stable top-level Next.js options in Next 15.
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
    'google-auth-library',
  ],

  allowedDevOrigins: [
    '*.cloudworkstations.dev',
    '*.firebase.google.com',
    'localhost:3001',
    '127.0.0.1:3001',
    '*.huggingface.co',
    '*.hf.space',
  ],

  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...(config.externals || []),
        '@opentelemetry/exporter-jaeger',
        '@opentelemetry/exporter-zipkin',
        '@opentelemetry/sdk-node',
      ];
    }
    return config;
  },
};

export default nextConfig;
