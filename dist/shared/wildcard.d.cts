/** Convert a wildcard pattern to a RegExp. `*` matches any chars, `?` matches one char. Case-insensitive. */
declare function wildcardToRegex(pattern: string): RegExp;
/** Returns true if `str` matches the given wildcard pattern */
declare function matchesWildcard(str: string, pattern: string): boolean;
/** Returns true if `str` matches ANY of the given wildcard patterns */
declare function matchesAnyWildcard(str: string, patterns: string[]): boolean;

export { matchesAnyWildcard, matchesWildcard, wildcardToRegex };
