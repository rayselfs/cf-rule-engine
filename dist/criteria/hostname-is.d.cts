import { CriteriaFn } from '../core/types.cjs';

declare function hostnameIs(...hostnames: string[]): CriteriaFn;

export { hostnameIs };
