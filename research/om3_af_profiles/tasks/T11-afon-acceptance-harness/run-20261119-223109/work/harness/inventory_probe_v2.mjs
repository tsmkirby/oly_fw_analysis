import { same } from './compare_v2.mjs';

if (!same([1], [1])) throw new Error('probe');
