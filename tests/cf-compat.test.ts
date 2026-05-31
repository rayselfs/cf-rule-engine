import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const SRC_DIR = join(process.cwd(), 'src')

const LAMBDA_ONLY = new Set([join(SRC_DIR, 'adapters', 'lambda-edge.ts')])

function collectTsFiles(dir: string): string[] {
  const result: string[] = []
  const entries = readdirSync(dir)
  for (let i = 0; i < entries.length; i++) {
    const full = join(dir, entries[i])
    if (statSync(full).isDirectory()) {
      const nested = collectTsFiles(full)
      for (let j = 0; j < nested.length; j++) result.push(nested[j])
    } else if (entries[i].endsWith('.ts')) {
      result.push(full)
    }
  }
  return result
}

function stripNonCode(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/.*/g, '')
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/`(?:[^`\\]|\\.)*`/g, '``')
}

const CHECKS: Array<{ name: string; re: RegExp; fix: string }> = [
  {
    name: 'for...of loop',
    re: /\bfor\b.*\bof\b/,
    fix: 'Use indexed for loop: for (let i = 0; i < arr.length; i++)',
  },
  {
    name: 'new Map()',
    re: /\bnew\s+Map\s*[<(]/,
    fix: 'Use plain object Record<K, V> instead',
  },
  {
    name: 'new Set()',
    re: /\bnew\s+Set\s*[<(]/,
    fix: 'Use array + indexOf instead',
  },
  {
    name: 'Object.fromEntries()',
    re: /\bObject\.fromEntries\b/,
    fix: 'Build object manually with a for loop',
  },
  {
    name: 'object spread { ...x }',
    re: /[{,]\s*\.\.\.[a-zA-Z_$]/,
    fix: 'Use Object.assign() instead',
  },
  {
    name: 'array spread [ ...x ]',
    re: /\[\s*\.\.\.[a-zA-Z_$]/,
    fix: 'Use .concat() or push in a loop instead',
  },
  {
    name: 'variable destructuring (const/let/var { } or [ ])',
    re: /\b(?:const|let|var)\s+[\[{]/,
    fix: 'Destructure manually: const foo = obj.foo',
  },
  {
    name: 'rest parameter (...args)',
    re: /\(\s*\.\.\.[a-zA-Z_$]/,
    fix: 'Use arguments object or explicit named params instead',
  },
]

const cfFiles = collectTsFiles(SRC_DIR).filter(f => !LAMBDA_ONLY.has(f))

describe('CF Function JS 2.0 compatibility', () => {
  for (const file of cfFiles) {
    const rel = file.slice(process.cwd().length + 1)
    const lines = stripNonCode(readFileSync(file, 'utf-8')).split('\n')

    for (const { name, re, fix } of CHECKS) {
      it(`${rel}: no ${name}`, () => {
        const violations: string[] = []
        for (let i = 0; i < lines.length; i++) {
          if (re.test(lines[i])) {
            violations.push(`  line ${i + 1}: ${lines[i].trim()}`)
          }
        }
        expect(
          violations,
          violations.length > 0 ? `Fix: ${fix}\n${violations.join('\n')}` : '',
        ).toHaveLength(0)
      })
    }
  }
})
