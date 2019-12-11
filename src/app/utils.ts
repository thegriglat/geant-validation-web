import { GvpMctoolNameVersion, GvpPlotXML, GvpJSON } from './classes/gvp-plot';

export function unroll<T>(arr: T[][]): T[] {
    return arr.reduce((res, e) => (res = res.concat(...e)));
}

interface hasVersionField {
    version: string;
}

function _versionSorterComparator(a: string, b: string): number {
    if (a === b) {
        return 0;
    }
    const a_components = a.split('.');
    const b_components = b.split('.');
    const len = Math.min(a_components.length, b_components.length);
    // loop while the components are equal
    for (let i = 0; i < len; i++) {
        // A bigger than B
        if (!parseInt(a_components[i]) || !parseInt(b_components[i])) {
            if (a_components[i] === b_components[i]) return 0;
            return a_components[i] > b_components[i] ? 1 : -1;
        }
        if (parseInt(a_components[i]) > parseInt(b_components[i])) {
            return 1;
        }
        // B bigger than A
        if (parseInt(a_components[i]) < parseInt(b_components[i])) {
            return -1;
        }
    }
    // If one's a prefix of the other, the longer one is greater.
    if (a_components.length > b_components.length) {
        return -1;
    }
    if (a_components.length < b_components.length) {
        return 1;
    }
    // Otherwise they are the same.
    return 0;
}

export function versionSorter<T extends hasVersionField>(v1: T, v2: T): number {
    return _versionSorterComparator(v1.version, v2.version);
}

export function unstableVersionFilter(e: GvpMctoolNameVersion): boolean {
    return e.version.indexOf("ref") === -1
        && e.version.indexOf("cand") === -1
        && e.version.indexOf("test") === -1;
}

export function getColumnWide(cols: number): string {
    const arr = ["",
        "one", "two", "three", "four", "five",
        "six", "seven", "eight", "nine", "ten",
        "eleven", "twelve", "thirteen", "fourteen",
        "fifteen", "sixteen"
    ];
    if (cols < arr.length && cols > 0)
        return arr[cols];
    return "";
}

/** Operator for Array.filter returning only unique items */
export function distinct<T>(value: T, index: number, arr: T[]) {
    return arr.indexOf(value) === index;
}

export function getDefault<K, V>(map: Map<K, V>, key: K, def: V): V {
    const v = map.get(key);
    return (v !== undefined) ? v : def;
}

export function filterData(data: GvpJSON[], q: GvpPlotXML): GvpJSON[] {
    return data.filter(j => {
        if (j.metadata.beamParticle === q.beam &&
            j.metadata.observableName === q.observable &&
            j.testName === q.test &&
            j.metadata.secondaryParticle === q.secondary &&
            j.metadata.targetName === q.target &&
            j.metadata.beam_energy_str === q.energy
        ) return true;
        return false;
    })
}