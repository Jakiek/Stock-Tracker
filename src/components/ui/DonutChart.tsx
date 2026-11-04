import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { persen, rp } from '../../domain/money'

export type SegmenDonat = { label: string; nilai: number; porsi: number; lainnya: boolean }

const KATEGORI = ['--cat-1', '--cat-2', '--cat-3', '--cat-4', '--cat-5', '--cat-6', '--cat-7']

function warna(s: SegmenDonat, i: number): string {
  if (s.lainnya) return 'var(--cat-8)'
  return `var(${KATEGORI[i % KATEGORI.length]})`
}

/**
 * Donat komposisi: tengah berisi total, legenda SELALU ada dan membawa nilai.
 * Ketebalan cincin 22% dari jari-jari. Segmen < 3% sudah digabung di domain.
 */
export function DonutChart({ data, total }: { data: SegmenDonat[]; total: number }) {
  const ringkasan = data.map((s) => `${s.label} ${persen(s.porsi)}`).join(', ')
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative h-[200px] w-[200px]" role="img" aria-label={`Komposisi portofolio: ${ringkasan}`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="nilai"
              nameKey="label"
              innerRadius="78%"
              outerRadius="100%"
              paddingAngle={data.length > 1 ? 1.5 : 0}
              stroke="var(--surface)"
              strokeWidth={2}
              startAngle={90}
              endAngle={-270}
              isAnimationActive
              animationDuration={500}
            >
              {data.map((s, i) => (
                <Cell key={s.label} fill={warna(s, i)} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => rp(Number(v))}
              contentStyle={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                fontSize: 13,
                color: 'var(--text)',
              }}
              itemStyle={{ color: 'var(--text)' }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] font-semibold tracking-[.08em] text-muted uppercase">Total</span>
          <span className="tnum text-[17px] font-bold">{rp(total, { ringkas: true })}</span>
        </div>
      </div>

      <ul className="w-full space-y-1.5 text-[13px]">
        {data.map((s, i) => (
          <li key={s.label} className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: warna(s, i) }} aria-hidden />
            <span className={s.lainnya ? 'text-muted' : 'font-mono font-semibold'}>{s.label}</span>
            <span className="tnum ml-auto text-muted">{persen(s.porsi)}</span>
            <span className="tnum w-[104px] text-right font-medium">{rp(s.nilai)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
