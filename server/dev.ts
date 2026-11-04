// Server API untuk pengembangan lokal: `npm run dev:server` (Vite mem-proxy /api ke sini).
try {
  process.loadEnvFile('.env')
} catch {
  /* .env opsional — variabel bisa juga datang dari shell */
}
const { buatAppDariEnv } = await import('./produksi')
const port = Number(process.env.PORT ?? 3001)
buatAppDariEnv().listen(port, () => console.log(`API di http://localhost:${port}`))
