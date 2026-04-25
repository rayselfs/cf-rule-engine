import { CriteriaFn } from '../core/types.js';

declare function hostnameIs(...hostnames: string[]): CriteriaFn;

export { hostnameIs };
