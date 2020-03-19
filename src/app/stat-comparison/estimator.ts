import { GvpJSON } from './../classes/gvp-plot';

import { getCommonXY, zip } from 'src/app/utils';

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
        name: "Maximal relative difference, %",
        fn: maxdy
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

// simple esimators


function maxdy(a: GvpJSON, b: GvpJSON): number {
    const [, y1, , , y2,] = getCommonXY(a, b);
    return Math.max(
        ...(zip([y1, y2]).map(e => Math.abs((e[1] - e[0]) * 100 / e[0])))
    );
}