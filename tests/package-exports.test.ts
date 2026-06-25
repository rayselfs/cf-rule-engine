import { readFileSync } from 'fs'
import { describe, expect, it } from 'vitest'

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))

describe('package exports', () => {
  it('exports the behaviors barrel', () => {
    expect(pkg.exports['./behaviors']).toEqual({
      types: './dist/behaviors/index.d.ts',
      import: './dist/behaviors/index.js',
      require: './dist/behaviors/index.cjs',
    })
  })
})
