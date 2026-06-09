const regexCache: Record<string, RegExp> = Object.create(null)

/** Convert a wildcard pattern to a RegExp. `*` matches any chars, `?` matches one char. Case-insensitive. */
export function wildcardToRegex(pattern: string): RegExp {
  if (!(pattern in regexCache)) {
    const escaped = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')
    regexCache[pattern] = new RegExp(`^${escaped}$`, 'i')
  }
  return regexCache[pattern]
}

/** Returns true if `str` matches the given wildcard pattern */
export function matchesWildcard(str: string, pattern: string): boolean {
  if (pattern.indexOf('*') === -1 && pattern.indexOf('?') === -1) {
    return str.toLowerCase() === pattern.toLowerCase()
  }
  return wildcardToRegex(pattern).test(str)
}

/** Returns true if `str` matches ANY of the given wildcard patterns */
export function matchesAnyWildcard(str: string, patterns: string[]): boolean {
  return patterns.some(p => matchesWildcard(str, p))
}
