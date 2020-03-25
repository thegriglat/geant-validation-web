import { Component, OnInit } from '@angular/core';
import { GVPAPIService } from '../services/gvpapi.service';
import { distinct, versionSorter, unstableVersionFilter } from '../utils';
import { GvpMctoolNameVersion, GvpTest } from '../classes/gvp-plot';
import { isNull, isUndefined } from 'util';

@Component({
  selector: 'app-test-summary',
  templateUrl: './test-summary.component.html',
  styleUrls: ['./test-summary.component.css']
})
export class TestSummaryComponent implements OnInit {

  constructor(private api: GVPAPIService) { }

  // testname,version -> existence
  public data = new Map<[string, number], boolean>();
  private _versionCache: GvpMctoolNameVersion[] = [];
  public progressValue: number = 0;
  private ntests: number = 0;

  ngOnInit() {
    this.api.mctool_name_version().subscribe(versions => {
      this._versionCache = versions.slice();
    });
    this.api.test().subscribe(tests => {
      this.ntests = tests.length;
      for (const test of tests) {
        this.api.uniqlookup_version(test.test_id).subscribe(vnumbers => {
          for (const versionId of vnumbers) {
            this.set(test.test_name, versionId);
          }
          this.progressValue++;
        })
      }
    })
  }

  getProgressMax(): number {
    return this.ntests;
  }
  private set(test: string, version: number): void {
    this.data.set([test, version], true);
  }

  hasV(test: string, version: number): boolean {
    return Array.from(this.data.keys()).filter(e => e[0] === test && e[1] === version).length !== 0;
  }

  tests(): string[] {
    return Array.from(this.data.keys()).map(e => e[0]).filter(distinct).filter(e => e !== "experiment").sort();
  }

  versions(): number[] {
    const r = Array.from(this.data.keys()).map(e => e[1]).filter(distinct).filter(e => e > 0);
    let r0 = r.map(e => this.getVersionC(e)).filter(e => !isUndefined(e)).sort(versionSorter).reverse();
    r0 = r0.filter(unstableVersionFilter);
    return r0.map(e => e.mctool_name_version_id);
  }

  // TODO: can return undefined!!!
  getVersionC(v: number): GvpMctoolNameVersion {
    const idx = this._versionCache.map(e => e.mctool_name_version_id).indexOf(v);
    return this._versionCache[idx];
  }
  getVersion(v: number): string {
    const r = this.getVersionC(v);
    if (!isNull(r)) return r.version;
    return "";
  }
}
