import { GvpMctoolNameVersion, GvpPlotXML, GvpJSON, ParametersList, GvpParameter, GvpPlot } from './classes/gvp-plot';

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

export function _versionSorterComparator(a: string, b: string): number {
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

export function ParametersListEq(p1: ParametersList, p2: ParametersList): boolean {
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

export function GvpJSONExpMetadataMatch(a: GvpJSON, b: GvpJSON): boolean {
    if (a.metadata.beamParticle === b.metadata.beamParticle &&
        a.metadata.observableName === b.metadata.observableName &&
        a.metadata.secondaryParticle === b.metadata.secondaryParticle &&
        a.metadata.targetName === b.metadata.targetName &&
        a.metadata.beam_energy_str === b.metadata.beam_energy_str
    ) {
        // check params
        return ParametersListEq(getParametersList(a.metadata.parameters), getParametersList(b.metadata.parameters));
    }
    return false;
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
        return ParametersListEq(getParametersList(a.metadata.parameters), getParametersList(b.metadata.parameters));
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
            return ParametersListEq(getParametersList(j.metadata.parameters), q.getParametersList());
        }
        return false;
    })
}

export function zip(rows: any[][]): any[][] {
    return rows[0].map((_, c) => rows.map(row => row[c]));
}

// plot data utils

export function getX(plot: GvpJSON): number[] {
    if (plot.chart) {
        return plot.chart.xValues;
    } else if (plot.histogram) {
        const x = [];
        for (let i = 0; i < plot.histogram.binEdgeLow.length; i++) {
            x.push(0.5 * (plot.histogram.binEdgeLow[i] + plot.histogram.binEdgeHigh[i]));
        }
        return x;
    }
    return [];
}

export function getY(plot: GvpJSON): number[] {
    if (plot.chart) {
        return plot.chart.yValues;
    } else if (plot.histogram) {
        return plot.histogram.binContent;
    }
    return [];
}

export function getYerrors(plot: GvpJSON): number[] {
    const p = (plot.chart) ? plot.chart : plot.histogram;
    const res = [];
    for (let i = 0; p && i < p.yStatErrorsPlus.length; i++) {
        // merge errors
        const statavg = 0.5 * ((p.yStatErrorsPlus[i] || 0) + (p.yStatErrorsMinus[i] || 0));
        const sysavg = 0.5 * ((p.ySysErrorsPlus[i] || 0) + (p.ySysErrorsMinus[i] || 0));
        res.push(Math.sqrt(statavg * statavg + sysavg * sysavg));
    }
    return res;
}

// get common points for two plots
export function getCommonXY(plot1: GvpJSON, plot2: GvpJSON): number[][] {
    const x1 = getX(plot1);
    const x2 = getX(plot2);
    const y1 = getY(plot1);
    const y2 = getY(plot2);
    const yerr1 = getYerrors(plot1);
    const yerr2 = getYerrors(plot2);
    const rx1: number[] = [];
    const rx2: number[] = [];
    const ry1: number[] = [];
    const ry2: number[] = [];
    const ry1err: number[] = [];
    const ry2err: number[] = [];
    for (let i1 = 0; i1 < x1.length; i1++) {
        for (let i2 = 0; i2 < x2.length; i2++) {
            if (x1[i1] === x2[i2]) {
                rx1.push(x1[i1]);
                rx2.push(x2[i2]);
                ry1.push(y1[i1]);
                ry2.push(y2[i2]);
                ry1err.push(yerr1[i1]);
                ry2err.push(yerr2[i2]);
            }
        }
    }
    return [rx1, ry1, ry1err, rx2, ry2, ry2err];
}

export function hashCode(s: string) {
    var h = 0, l = s.length, i = 0;
    if (l > 0)
        while (i < l)
            h = (h << 5) - h + s.charCodeAt(i++) | 0;
    return h;
};

export function getIdPlot(plot: GvpPlot): string {
    return String(Math.abs(hashCode(JSON.stringify(plot))));
}