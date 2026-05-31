import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'

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
]

const cfFiles = collectTsFiles(SRC_DIR).filter(f => !LAMBDA_ONLY.has(f))

const tsProgram = ts.createProgram(cfFiles, {
  target: ts.ScriptTarget.ES2020,
  skipLibCheck: true,
  noEmit: true,
})

function walkAst(node: ts.Node, visitor: (n: ts.Node) => void): void {
  visitor(node)
  ts.forEachChild(node, child => walkAst(child, visitor))
}

const RUNTIME_FN_KINDS = new Set([
  ts.SyntaxKind.FunctionDeclaration,
  ts.SyntaxKind.FunctionExpression,
  ts.SyntaxKind.ArrowFunction,
  ts.SyntaxKind.MethodDeclaration,
  ts.SyntaxKind.Constructor,
  ts.SyntaxKind.GetAccessor,
  ts.SyntaxKind.SetAccessor,
])

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

describe('CF Function JS 2.0 compatibility (AST)', () => {
  for (const file of cfFiles) {
    const sourceFile = tsProgram.getSourceFile(file)
    if (!sourceFile) continue
    const rel = file.slice(process.cwd().length + 1)

    it(`${rel}: no default parameters f(x=1)`, () => {
      const violations: string[] = []
      walkAst(sourceFile, node => {
        if (ts.isParameter(node) && node.initializer) {
          const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart())
          violations.push(`  line ${line + 1}: ${node.getText(sourceFile).trim()}`)
        }
      })
      expect(
        violations,
        violations.length > 0 ? `Fix: Set default inside function body instead\n${violations.join('\n')}` : '',
      ).toHaveLength(0)
    })

    it(`${rel}: no rest parameters (...args) in runtime functions`, () => {
      const violations: string[] = []
      walkAst(sourceFile, node => {
        if (ts.isParameter(node) && node.dotDotDotToken && RUNTIME_FN_KINDS.has(node.parent.kind)) {
          const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart())
          violations.push(`  line ${line + 1}: ${node.getText(sourceFile).trim()}`)
        }
      })
      expect(
        violations,
        violations.length > 0 ? `Fix: Use explicit named params instead\n${violations.join('\n')}` : '',
      ).toHaveLength(0)
    })
  }
})
