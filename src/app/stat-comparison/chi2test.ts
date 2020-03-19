import { getCommonXY } from './../utils';
import { GvpJSON } from '../classes/gvp-plot';

/*
import { chisquared_cdf_c } from 'static/JS/statistics/JSRootMath.js';

function Prob(chi2, ndf) {
    if (ndf <= 0) return 0; // Set CL to zero in case ndf<=0

    if (chi2 <= 0) {
        if (chi2 < 0) return 0;
        else return 1;
    }
    return chisquared_cdf_c(chi2, ndf);
}
*/
function chi2test(y1: number[], yerr1: number[], y2: number[], yerr2: number[]): number[] {
    const ndof = y1.length - 1;
    let chi2 = 0;
    const sum1 = y1.reduce((a, b) => a + b, 0);
    const sum2 = y2.reduce((a, b) => a + b, 0);
    y1.forEach((val1, bin) => {
        const val2 = y2[bin];
        let errval1 = yerr1[bin];
        let errval2 = yerr2[bin];
        if (errval1 === 0 && errval2 === 0) {
            errval1 = Math.sqrt(Math.abs(val1));
            errval2 = Math.sqrt(Math.abs(val2));
        }
        const e2sq = errval2 * errval2;
        const e1sq = errval1 * errval1;
        const nomin = sum2 * val1 - sum1 * val2;
        const denom = sum1 * sum1 * e2sq + sum2 * sum2 * e1sq;
        if (denom !== 0)
            chi2 += nomin * nomin / denom;
    });
    return ndof <= 0 ? [0, ndof] : [chi2 / ndof, ndof];
}

export function Chi2Test(plot1: GvpJSON, plot2: GvpJSON): number {
    const [, y1, yerr1, , y2, yerr2] = getCommonXY(plot1, plot2);
    if (y1.length === 0) return NaN;
    const [chi2value, /*ndf*/] = chi2test(y1, yerr1, y2, yerr2);
    //   return [Prob(chi2value * ndf, ndf), chi2value];
    return chi2value;

}
