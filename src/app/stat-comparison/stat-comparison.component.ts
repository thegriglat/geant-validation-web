import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { switchMap, map } from 'rxjs/operators';
import { Nullable, GvpTest, GvpMctoolNameVersion, GvpInspire } from '../classes/gvp-plot';
import { GVPAPIService } from '../services/gvpapi.service';
import { Observable } from 'rxjs';
import { unstableVersionFilter, versionSorter } from '../utils';

@Component({
  selector: 'app-stat-comparison',
  templateUrl: './stat-comparison.component.html',
  styleUrls: ['./stat-comparison.component.css']
})
export class StatComparisonComponent implements OnInit {

  public test: Observable<GvpTest> = new Observable<GvpTest>();
  public menuVersions: GvpMctoolNameVersion[] = [];
  public versionsSel: GvpMctoolNameVersion[] = [];
  public showUnstableVersions = false;
  public availableExpDataforTest: GvpInspire[] = [];
  public checkedExp: GvpInspire[] = [];
  public menuBeams: string[] = [];
  public beamsSel: string[] = [];

  private MCToolNameCache = new Map<number, string>();
  /** Cache of MC tool versions, popuated on page load
   * key: database ID (used in API requests)
   * release_date field not used
   */
  private MCToolNameVersionCache = new Map<number, { version: string, mctool_name_id: number, release_date: string }>();

  constructor(private route: ActivatedRoute, private router: Router, private api: GVPAPIService) { }

  ngOnInit() {
    // Populate caches
    this.api.mctool_name_version().subscribe(response => {
      for (const elem of response) {
        this.MCToolNameVersionCache.set(elem.mctool_name_version_id, {
          version: elem.version,
          mctool_name_id: elem.mctool_name_id,
          release_date: elem.release_date
        });
      }
    });

    this.api.mctool_name().subscribe(response => {
      for (const elem of response) {
        this.MCToolNameCache.set(elem.mctool_name_id, elem.mctool_name_name);
      }
    });
    this.test = this.route.paramMap.pipe(
      switchMap((params: ParamMap) =>
        this.api.testById(Number(params.get('id')))
      ));
    this.test.subscribe(test => {
      this.updateVersionMenu(test);
      this.updateExpDescription(test.test_id);
      this.updateBeamMenu(test);
    })
  }

  unstableFilter(v: GvpMctoolNameVersion[]): GvpMctoolNameVersion[] {
    if (this.showUnstableVersions)
      return v;
    return v.filter(unstableVersionFilter);
  }


  filterVersionSel() {
    if (!this.showUnstableVersions) return;
    this.versionsSel = this.versionsSel.filter(unstableVersionFilter)
  }

  versionSelectFilter(items: GvpMctoolNameVersion[], query: string): GvpMctoolNameVersion[] {
    return items.filter(e => e.version.indexOf(query) !== -1);
  }

  versionFormatter(item: GvpMctoolNameVersion, query?: string): string {
    return item.version;
  }

  updateVersionMenu(test: GvpTest): void {
    this.api.uniqlookup_version(test.test_id).subscribe((response) => {
      this.menuVersions = [];
      const versions = new Map<number, string>();
      for (const i of response) {
        if (this.menuVersions.map(e => e.mctool_name_version_id).indexOf(i) === -1) {
          const result = this.MCToolNameVersionCache.get(i);
          if (result === undefined) {
            console.log(`mctool.version ${i} not found!`);
            continue;
          }
          const version = result.version;
          const mctoolNameId = result.mctool_name_id;
          const name = this.MCToolNameCache.get(mctoolNameId);
          versions.set(i, `${name}: ${version}`);
          this.menuVersions.push(
            {
              mctool_name_version_id: i,
              version: result.version,
              mctool_name_id: result.mctool_name_id,
              release_date: result.release_date
            }
          );
        }
      }
      this.menuVersions.sort(versionSorter).reverse();
      if (this.menuVersions.length === 1) {
        this.versionsSel = this.menuVersions.slice();
      }
    });
  }

  updateBeamMenu(test: GvpTest): void {
    this.api.uniqlookup_beamParticle(test.test_id).subscribe(beams => {
      this.menuBeams = beams;
      if (this.menuBeams.length === 1) this.beamsSel = this.menuBeams.slice();
    })
  }


  updateExp(e: GvpInspire) {
    if (this.checkedExp.indexOf(e) === -1) {
      this.checkedExp.push(e);
    } else {
      this.checkedExp.splice(this.checkedExp.indexOf(e), 1);
    }
  }

  private updateExpDescription(testId: number) {
    this.availableExpDataforTest = [];
    this.checkedExp = [];
    this.api.getExperimentsInspireForTest(testId).subscribe((result) => {
      const rmod = result.map(e => {
        e.expname = e.expname ? e.expname : 'exp. data';
        return e;
      });
      for (const r of rmod) {
        if (this.availableExpDataforTest.indexOf(r) === -1 &&
          this.availableExpDataforTest.map(e => e.inspire_id).indexOf(r.inspire_id) === -1) {
          this.availableExpDataforTest.push(r);
        }
      }
    });
  }
}
