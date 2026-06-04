/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: '/evenement', destination: '/agenda', permanent: true },
      { source: '/evenement.html', destination: '/agenda', permanent: true },
      { source: '/index.html', destination: '/', permanent: true },
    ];
  },
};

export default nextConfig;
