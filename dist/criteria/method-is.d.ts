import { CriteriaFn } from '../core/types.js';

declare function methodIs(...methods: string[]): CriteriaFn;

export { methodIs };
