export function unroll<T>(arr: T[][]): T[] {
    return arr.reduce((res, e) => (res = res.concat(...e)));
}