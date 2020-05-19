import { GvpPngRequest, GvpJSON } from './../classes/gvp-plot';
import { getCommonXY } from '../utils';

interface RatioFunctions {
    // in LaTeX
    description: string;
    fn: { (base: GvpJSON, ref: GvpJSON): number };
}

const RatioSum: RatioFunctions = {
    description: "\\sum \\frac{\\Delta y}{y_{ref}}",
    fn: (base: GvpJSON, ref: GvpJSON) => {
        const [rx1, ry1, ry1err, rx2, ry2, ry2err] = getCommonXY(base, ref);
        let diff = 0;
        for (let i = 0; i < ry2.length; i++) {
            diff += ry2[i] !== 0 ? Math.abs((ry1[i] - ry2[i]) / ry2[i]) : 0;
        }
        return diff;
    }
}

const RatioMaxDiff: RatioFunctions = {
    description: "max(\\frac{\\Delta y}{y_{ref}})",
    fn: (base: GvpJSON, ref: GvpJSON) => {
        const [rx1, ry1, ry1err, rx2, ry2, ry2err] = getCommonXY(base, ref);
        let diff = 0;
        for (let i = 0; i < ry2.length; i++) {
            const t = ry2[i] !== 0 ? Math.abs((ry1[i] - ry2[i]) / ry2[i]) : 0;
            if (t > diff) diff = t;
        }
        return diff;
    }
}

export const RatioDiffEstimator = RatioMaxDiff;