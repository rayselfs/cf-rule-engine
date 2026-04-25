import { CriteriaFn } from '../core/types.js';

declare function countryIs(...codes: string[]): CriteriaFn;

export { countryIs };
