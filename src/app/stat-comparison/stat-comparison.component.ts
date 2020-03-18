import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { switchMap, map } from 'rxjs/operators';
import { Nullable, GvpTest, GvpMctoolNameVersion, GvpInspire, ParametersList } from '../classes/gvp-plot';
import { GVPAPIService } from '../services/gvpapi.service';
import { Observable } from 'rxjs';
import { unstableVersionFilter, versionSorter, s2KaTeX } from '../utils';

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
  public menuObservable: string[] = [];
  public observableSel: string[] = [];
  public menuParameters: ParametersList = [];
  public parametersSel: ParametersList = [];
  public parametersUpdating = false;

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
      this.updateObservableMenu(test);
      this.updateParametersMenu(test);
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

  updateObservableMenu(test: GvpTest): void {
    this.api.uniqlookup_observableName(test.test_id).subscribe(observables => {
      this.menuObservable = observables;
      if (this.menuObservable.length === 1) this.observableSel = this.menuObservable.slice();
    })
  }

  updateParametersMenu(test: GvpTest): void {
    this.parametersUpdating = true;
    this.api.uniqlookup_parametersList(test.test_id).subscribe(parameters => {
      this.menuParameters = parameters;
      for (let i of this.menuParameters) {
        this.parametersSel.push([i[0], []]);
      }
      this.parametersUpdating = false;
    })
  }

  updateExp(e: GvpInspire) {
    if (this.checkedExp.indexOf(e) === -1) {
      this.checkedExp.push(e);
    } else {
      this.checkedExp.splice(this.checkedExp.indexOf(e), 1);
    }
  }

  updateObservable(observable: string): void {
    if (this.observableSel.indexOf(observable) === -1) {
      this.observableSel.push(observable);
    } else {
      this.observableSel.splice(this.observableSel.indexOf(observable), 1);
    }
  }

  updateParam(pgroup: string, pvalue: string): void {
    const pelem = this.parametersSel.filter(e => e[0] === pgroup)[0];
    if (pelem[1].indexOf(pvalue) === -1)
      pelem[1].push(pvalue);
    else
      pelem[1].splice(pelem[1].indexOf(pvalue), 1);
  }

  katex(s: string): string {
    return s2KaTeX(s);
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
