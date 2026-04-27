import { describe, it, expect } from 'vitest'
import { matchesWildcard, matchesAnyWildcard, wildcardToRegex } from '../../src/shared/wildcard.js'

describe('wildcard', () => {
  describe('matchesWildcard', () => {
    it('matches path with asterisk wildcard', () => {
      expect(matchesWildcard('/assets/foo.js', '/assets/*')).toBe(true)
    })

    it('does not match when pattern does not match', () => {
      expect(matchesWildcard('/other/foo.js', '/assets/*')).toBe(false)
    })

    it('matches path with question mark wildcard', () => {
      expect(matchesWildcard('/api/v1', '/api/v?')).toBe(true)
    })

    it('does not match when question mark requires single char', () => {
      expect(matchesWildcard('/api/v10', '/api/v?')).toBe(false)
    })

    it('is case-insensitive', () => {
      expect(matchesWildcard('/Assets/Foo.js', '/assets/*')).toBe(true)
      expect(matchesWildcard('/ASSETS/FOO.JS', '/assets/*')).toBe(true)
    })
  })

  describe('matchesAnyWildcard', () => {
    it('returns true if string matches any pattern', () => {
      expect(matchesAnyWildcard('/foo/bar', ['/foo/*', '/baz/*'])).toBe(true)
    })

    it('returns false if string matches no patterns', () => {
      expect(matchesAnyWildcard('/qux', ['/foo/*'])).toBe(false)
    })

    it('matches multiple patterns correctly', () => {
      expect(matchesAnyWildcard('/api/v1', ['/other/*', '/api/v?', '/test/*'])).toBe(true)
    })
  })

  describe('wildcardToRegex', () => {
    it('caches regex patterns', () => {
      const regex1 = wildcardToRegex('/assets/*')
      const regex2 = wildcardToRegex('/assets/*')
      expect(regex1).toBe(regex2)
    })

    it('escapes special regex characters', () => {
      expect(matchesWildcard('/api+v1', '/api+v1')).toBe(true)
      expect(matchesWildcard('/api+v2', '/api+v1')).toBe(false)
    })

    it('handles asterisk as any chars', () => {
      const regex = wildcardToRegex('/assets/*')
      expect(regex.test('/assets/foo')).toBe(true)
      expect(regex.test('/assets/foo/bar')).toBe(true)
    })

    it('handles question mark as single char', () => {
      const regex = wildcardToRegex('/api/v?')
      expect(regex.test('/api/v1')).toBe(true)
      expect(regex.test('/api/v12')).toBe(false)
    })
  })
})
