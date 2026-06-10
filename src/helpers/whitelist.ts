import type { Rule, CriteriaFn } from '../core/types.js'
import { rule, all, any, not } from '../core/rule.js'
import { ipExact } from '../criteria/ip-exact.js'
import { uaContains } from '../criteria/user-agent-contains.js'
import { pathEquals } from '../criteria/path-equals.js'
import { pathPrefix } from '../criteria/path-prefix.js'
import { redirect } from '../behaviors/redirect.js'

export type WhitelistOptions = {
  ips?: string[]
  uaKeywords?: string[]
  redirectUrl: string
  bypassPaths?: string[]
  bypassCriteria?: CriteriaFn
}

function buildBypassCriteria(paths: string[]): CriteriaFn {
  const exactPaths: string[] = []
  const prefixPaths: string[] = []

  for (let i = 0; i < paths.length; i++) {
    const p = paths[i]
    const hasWildcard = p.indexOf('*') !== -1 || p.indexOf('?') !== -1
    const isTrailingSlashStar =
      p.charAt(p.length - 1) === '*' &&
      p.charAt(p.length - 2) === '/' &&
      p.indexOf('*') === p.length - 1 &&
      p.indexOf('?') === -1

    if (!hasWildcard) {
      exactPaths.push(p)
    } else if (isTrailingSlashStar) {
      prefixPaths.push(p.slice(0, p.length - 1))
    }
  }

  const criteria: CriteriaFn[] = []
  if (exactPaths.length > 0) criteria.push(pathEquals(exactPaths))
  if (prefixPaths.length > 0) criteria.push(pathPrefix(prefixPaths))

  if (criteria.length === 1) return criteria[0]
  return any(criteria)
}

export function whitelist(options: WhitelistOptions): Rule {
  const ips = options.ips ?? []
  const uaKeywords = options.uaKeywords ?? []
  const bypassPaths = options.bypassPaths ?? []

  const blockIp: CriteriaFn = ips.length === 0 ? () => true : not(ipExact(ips))
  const blockUa: CriteriaFn = uaKeywords.length === 0 ? () => true : not(uaContains(uaKeywords))

  const criteria: CriteriaFn[] = [blockIp, blockUa]

  if (bypassPaths.length > 0) {
    criteria.push(not(buildBypassCriteria(bypassPaths)))
  }

  if (options.bypassCriteria !== undefined) {
    criteria.push(not(options.bypassCriteria))
  }

  return rule(all(criteria), redirect(302, options.redirectUrl))
}
