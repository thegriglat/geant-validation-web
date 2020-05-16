import { GvpPngRequest, GvpJSON } from './../classes/gvp-plot';
import { getCommonXY } from '../utils';

interface RatioFunctions {
    // in LaTeX
    description: string;
    fn: { (base: GvpJSON, ref: GvpJSON): number };
}

const RatioMaxDiff: RatioFunctions = {
    description: "\\sum \\frac{\\Delta y}{y_{ref}}",
    fn: (base: GvpJSON, ref: GvpJSON) => {
        const [rx1, ry1, ry1err, rx2, ry2, ry2err] = getCommonXY(base, ref);
        let diff = 0;
        for (let i = 0; i < ry2.length; i++) {
            diff += Math.abs((ry1[i] - ry2[i]) / ry1[i]);
        }
        return diff;
    }
}

export const RatioDiffEstimator = RatioMaxDiff;