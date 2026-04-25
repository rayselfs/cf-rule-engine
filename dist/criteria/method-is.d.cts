import { CriteriaFn } from '../core/types.cjs';

declare function methodIs(...methods: string[]): CriteriaFn;

export { methodIs };
