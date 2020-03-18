import { GvpMctoolNameVersion, GvpPlotXML, GvpJSON, GvpHistogram, ParametersList, GvpParameter } from './classes/gvp-plot';

export function unroll<T>(arr: T[][]): T[] {
    return arr.reduce((res, e) => (res = res.concat(...e)));
}

//  wrap spaces to proper view in katex
export function s2KaTeX(str: string): string {
    return str.replace(/ /g, " \\space ");
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
        && e.version.indexOf("test") === -1
        && e.version.indexOf("beta") === -1
        && e.version.indexOf("_") === -1
        && e.version.indexOf("branch") === -1;
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
export function distinct<T>(value: T, index: number, arr: T[]): boolean {
    return arr.indexOf(value) === index;
}
export function distinctJSON(value: GvpJSON, index: number, arr: GvpJSON[]): boolean {
    const unq_ids = arr.map(e => e.id);
    return unq_ids.indexOf(value.id) === index;
}

export function getDefault<K, V>(map: Map<K, V>, key: K, def: V): V {
    const v = map.get(key);
    return (v !== undefined) ? v : def;
}

export function getParametersList(parameters: GvpParameter[]): ParametersList {
    let p: ParametersList = [];
    for (const i of parameters) {
        const idx = p.map(e => e[0]).indexOf(i.names);
        if (idx === -1) {
            // add
            p.push([i.names, [i.values]]);
        } else {
            // append
            p[idx][1].push(i.values);
        }
    }
    return p;
}

function _ParametersListEq(p1: ParametersList, p2: ParametersList): boolean {
    for (const i of p1) {
        const idx = p2.map(e => e[0]).indexOf(i[0]);
        if (idx === -1) return false;
        const p3 = p2[idx];
        // check values
        for (const v1 of i[1]) {
            if (p3[1].indexOf(v1) === -1) return false;
        }
    }
    return true;
}

export function GvpJSONMetadataMatch(a: GvpJSON, b: GvpJSON): boolean {
    if (a.metadata.beamParticle === b.metadata.beamParticle &&
        a.metadata.observableName === b.metadata.observableName &&
        a.testName === b.testName &&
        a.mctool.model === b.mctool.model &&
        a.metadata.secondaryParticle === b.metadata.secondaryParticle &&
        a.metadata.targetName === b.metadata.targetName &&
        a.metadata.beam_energy_str === b.metadata.beam_energy_str
    ) {
        // check params
        return _ParametersListEq(getParametersList(a.metadata.parameters), getParametersList(b.metadata.parameters));
    }
    return false;
}

export function filterData(data: GvpJSON[], q: GvpPlotXML): GvpJSON[] {
    return data.filter(j => {
        if (j.metadata.beamParticle === q.beam &&
            j.metadata.observableName === q.observable &&
            j.testName === q.test &&
            j.metadata.secondaryParticle === q.secondary &&
            j.metadata.targetName === q.target &&
            j.metadata.beam_energy_str === q.energy
        ) {
            // check params
            return _ParametersListEq(getParametersList(j.metadata.parameters), q.getParametersList());
        }
        return false;
    })
}