
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
      '@genkit-ai/google-genai',
      '@genkit-ai/ai',
      '@genkit-ai/flow',
      '@genkit-ai/dotprompt',
      'openai',
      'zod'
    ],
    allowedDevOrigins: ['*.cloudworkstations.dev', 'localhost:3000'],
  },
};

export default nextConfig;
