/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://dphjkdjlusqvflizmxns.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwaGprZGpsdXNxdmZsaXpteG5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4OTU3NTAsImV4cCI6MjA2MjQ3MTc1MH0.Iwrzi9G3CKaEViBPW75ktuJpXr4d2BTtA8-f6AwjkDY",
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['dphjkdjlusqvflizmxns.supabase.co'],
    unoptimized: true,
  },
};

export default nextConfig;
