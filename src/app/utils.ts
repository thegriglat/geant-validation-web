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