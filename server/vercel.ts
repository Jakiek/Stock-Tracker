// Titik masuk Vercel Function. Dibundel esbuild menjadi server/dist/vercel.mjs saat build
// (npm run build:api), lalu diekspor ulang oleh api/index.js. Lihat ADR 002.
import { buatAppDariEnv } from './produksi'

export default buatAppDariEnv()
