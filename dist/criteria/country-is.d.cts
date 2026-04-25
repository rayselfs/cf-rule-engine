import { CriteriaFn } from '../core/types.cjs';

declare function countryIs(...codes: string[]): CriteriaFn;

export { countryIs };
