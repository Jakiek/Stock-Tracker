import { describe, expect, it } from 'vitest'
import { normalkanTanggal } from '../ApiRepository'

describe('ApiRepository', () => {
  it("tanggal dari server selalu dinormalkan ke 'YYYY-MM-DD'", () => {
    expect(normalkanTanggal('2026-01-05')).toBe('2026-01-05')
    expect(normalkanTanggal('2026-01-05T00:00:00.000Z')).toBe('2026-01-05')
    expect(() => normalkanTanggal('05/01/2026')).toThrow()
  })
})
