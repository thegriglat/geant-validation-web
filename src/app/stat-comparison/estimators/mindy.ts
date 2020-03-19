import { GvpJSON } from './../../classes/gvp-plot';
import { getCommonXY, zip } from 'src/app/utils';


export function mindy(a: GvpJSON, b: GvpJSON): number {
    const [, y1, , , y2,] = getCommonXY(a, b);
    return Math.min(
        ...(zip([y1, y2]).map(e => Math.abs((e[1] - e[0]) * 100 / e[0])))
    );
}