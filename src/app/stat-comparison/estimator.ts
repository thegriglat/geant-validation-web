import { GvpJSON } from './../classes/gvp-plot';

import { mindy } from './estimators/mindy';

export type EstimatorFn = (p1: GvpJSON, p2: GvpJSON) => number;

export type Estimator = { name: string, fn: EstimatorFn };

interface EstimatorI {
    [key: string]: Estimator
}

export const estimators: EstimatorI = {
    'chi2': {
        name: "Chi2 test",
        fn: (p1: GvpJSON, p2: GvpJSON) => { return 0.0; }
    },
    'mindy': {
        name: "Minimal relative difference, %",
        fn: mindy
    }
};

export function estimatorsNames(): string[] {
    return Object.keys(estimators);
}

export function estimatorFullName(name?: string) {
    const est = getEstimator(name);
    return est.name;
}

export function getEstimator(name?: string) {
    if (!name) return estimators[estimatorsNames()[0]];
    return estimators[name];
}