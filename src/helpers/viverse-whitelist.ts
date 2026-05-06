import type { Rule } from '../core/types.js'
import { rule, all, not } from '../core/rule.js'
import { ipCidr } from '../criteria/ip-cidr.js'
import { userAgentMatches } from '../criteria/user-agent-matches.js'
import { pathMatches } from '../criteria/path-matches.js'
import { redirect } from '../behaviors/redirect.js'

const DEFAULT_CIDRS = [
  '61.218.44.76/32',
  '122.147.213.24/32',
  '60.251.61.121/32',
  '162.120.184.42/32',
  '175.98.157.254/32',
  '122.147.173.254/32',
  '52.33.9.56/32',
  '52.35.160.39/32',
  '50.112.203.191/32',
]

const DEFAULT_USER_AGENTS = ['*HTCVRSDET*', '*Prerender*', '*HTC3PARTY*']

export interface ViverseWhitelistOptions {
  redirectUrl: string
  additionalCidrs?: string[]
  additionalUAs?: string[]
  bypassPaths?: string[]
}

export function viverseWhitelist(options: ViverseWhitelistOptions): Rule {
  const additionalCidrs = options.additionalCidrs ?? []
  const additionalUAs = options.additionalUAs ?? []
  const bypassPaths = options.bypassPaths ?? []

  const allCidrs = DEFAULT_CIDRS.concat(additionalCidrs)
  const allUAs = DEFAULT_USER_AGENTS.concat(additionalUAs)

  const criteria = [not(ipCidr(allCidrs)), not(userAgentMatches(allUAs))]

  if (bypassPaths.length > 0) {
    criteria.push(not(pathMatches(bypassPaths)))
  }

  return rule(all(criteria), redirect(302, options.redirectUrl))
}
