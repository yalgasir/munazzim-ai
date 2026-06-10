
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
      '@opentelemetry/sdk-trace-base',
      '@opentelemetry/sdk-trace-node',
      '@opentelemetry/resources',
      '@opentelemetry/semantic-conventions',
      '@opentelemetry/exporter-jaeger',
      '@opentelemetry/exporter-zipkin',
      '@opentelemetry/instrumentation',
      'google-auth-library'
    ],
    allowedDevOrigins: [
      '*.cloudworkstations.dev',
      'localhost:3000',
      '127.0.0.1:3000'
    ],
  },
};

export default nextConfig;
