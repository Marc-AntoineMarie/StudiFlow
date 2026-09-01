import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Évite que Next remonte par erreur jusqu'à ~/package-lock.json (projet non lié).
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
