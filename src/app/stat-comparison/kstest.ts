import { getCommonXY } from './../utils';
import { GvpJSON } from '../classes/gvp-plot';

function KolmogorovProb(z: number) {
    const fj = [-2, -8, -18, -32],
        r = [0, 0, 0, 0];
    const w = 2.50662827;
    // c1 - -pi**2/8, c2 = 9*c1, c3 = 25*c1
    const c1 = -1.2337005501361697;
    const c2 = -11.103304951225528;
    const c3 = -30.842513753404244;

    const u = Math.abs(z);
    let p;
    if (u < 0.2) {
        p = 1;
    } else if (u < 0.755) {
        const v = 1.0 / (u * u);
        p = 1 - (w * (Math.exp(c1 * v) + Math.exp(c2 * v) + Math.exp(c3 * v))) / u;
    } else if (u < 6.8116) {
        r[1] = 0;
        r[2] = 0;
        r[3] = 0;
        const v = u * u;
        const maxj = Math.max(1, Math.trunc(3.0 / u));
        for (let j = 0; j < maxj; j++) {
            r[j] = Math.exp(fj[j] * v);
        }
        p = 2 * (r[0] - r[1] + r[2] - r[3]);
    } else {
        p = 0;
    }
    return p;
}

// function GetBinError(h, herr, bin) {
//   if (!herr || herr.length === 0) {
//     return Math.sqrt(h[bin]);
//   } else if (bin < herr.length) return herr[bin];
//   else return 0;
// }

// from https://root.cern.ch/doc/v608/TH1_8cxx_source.html#l07359
// function KS(h1, h2, h1errors, h2errors) {
//   let sum1 = 0;
//   let sum2 = 0;
//   let ew1;
//   let ew2;
//   let w1 = 0;
//   let w2 = 0;
//   // integral of all bins (use underflow/overflow if option)
//   for (let bin = 0; bin < h1.length; bin++) {
//     sum1 += h1[bin];
//     sum2 += h2[bin];
//     ew1 = GetBinError(h1, h1errors, bin);
//     ew2 = GetBinError(h2, h2errors, bin);
//     w1 += ew1 * ew1;
//     w2 += ew2 * ew2;
//   }
//   if (sum1 === 0 || sum2 === 0) {
//     console.log('KolmogorovTest', 'One of histogram integral is zero');
//     return [NaN, NaN];
//   }
//   let esum1 = 0;
//   let esum2 = 0;

//   if (w1 > 0) esum1 = (sum1 * sum1) / w1;
//   if (w2 > 0) esum2 = (sum2 * sum2) / w2;

//   const s1 = 1 / sum1;
//   const s2 = 1 / sum2;

//   let dfmax = 0;
//   let rsum1 = 0;
//   let rsum2 = 0;
//   for (let bin = 0; bin < h1.length; bin++) {
//     rsum1 += s1 * h1[bin];
//     rsum2 += s2 * h2[bin];
//     dfmax = Math.max(dfmax, Math.abs(rsum1 - rsum2));
//   }
//   let z;
//   if (esum1 + esum2 !== 0) {
//     z = dfmax * Math.sqrt((esum1 * esum2) / (esum1 + esum2));
//   } else if (esum1 === 0) z = dfmax * Math.sqrt(esum2);
//   else z = dfmax * Math.sqrt(esum1);

//   if (Math.abs(rsum1 - 1) > 0.002) console.log('KolmogorovTest: Numerical problems with h1');
//   if (Math.abs(rsum2 - 1) > 0.002) console.log('KolmogorovTest: Numerical problems with h2');
//   return [KolmogorovProb(z), dfmax];
// }

// https://root.cern.ch/root/html524/TMath.html#TMath:KolmogorovTest
function KSTMath(y1: number[], y2: number[]): number[] {
    if (y1.length <= 2 || y2.length <= 2) {
        console.log("KolmogorovTest: sets must have more than 2 points");
        return [0, 0];
    }
    //     Constants needed
    const na = y1.length;
    const nb = y2.length;
    const rna = y1.length;
    const rnb = y2.length;
    const sa = 1.0 / rna;
    const sb = 1.0 / rnb;
    let rdiff = 0;
    let rdmax = 0;
    let ia = 0;
    let ib = 0;

    //    Main loop over point sets to find max distance
    //    rdiff is the running difference, and rdmax the max.
    let ok = false;
    for (let i = 0; i < na + nb; i++) {
        if (y1[ia] < y2[ib]) {
            rdiff -= sa;
            ia++;
            if (ia >= na) { ok = true; break; }
        } else if (y1[ia] > y2[ib]) {
            rdiff += sb;
            ib++;
            if (ib >= nb) { ok = true; break; }
        } else {
            // special cases for the ties
            const x = y1[ia];
            while (y1[ia] === x && ia < na) {
                rdiff -= sa;
                ia++;
            }
            while (y2[ib] === x && ib < nb) {
                rdiff += sb;
                ib++;
            }
            if (ia >= na) { ok = true; break; }
            if (ib >= nb) { ok = true; break; }
        }
        rdmax = Math.max(rdmax, Math.abs(rdiff));
    }
    if (ok) {
        rdmax = Math.max(rdmax, Math.abs(rdiff));
        const z = rdmax * Math.sqrt(rna * rnb / (rna + rnb));
        const prob = KolmogorovProb(z);
        return [prob, rdmax];
    } else {
        console.log("OK is not true. Check KS test.");
        return [0, 0];
    }
}

export function KolmogorovTest(plot1: GvpJSON, plot2: GvpJSON): number {
    const [, y1, , , y2,] = getCommonXY(plot1, plot2);
    // distributions should be sorted
    y1.sort();
    y2.sort();
    // use rdmax, not p-value
    return KSTMath(y1, y2)[1];
}
