import { Component, OnInit } from '@angular/core';
import { LayoutService } from '../services/layout.service';
import { GvpTest, GvpPlot, GvpMctoolNameVersion, GvpLayout, GvpInspire, GvpPngRequest, GvpPlotIdRequest, GvpPlotType, Nullable, GvpMctoolName, GvpModel } from '../classes/gvp-plot';
import { GVPAPIService } from '../services/gvpapi.service';
import { map, tap } from 'rxjs/operators';
import { forkJoin, Observable } from 'rxjs';
import { unroll, versionSorter, unstableVersionFilter, getColumnWide, distinct, getDefault, filterData, distinctJSON, getIdPlot, capitalize } from './../utils';
import { PlotEmitType } from '../plot/plot.component';
import { RatioDiffEstimator } from '../plot/ratiofunctions';
import { trigger, transition, style, animate } from '@angular/animations';

type VersionModel = { version: string, model: string };

type TestDescription = {
  header: string,
  authors: string[],
  content: string
};

/**
 * Shows [plots]{@link PlotComponent} for a given version(s) and model(s) using a predefined or custom template
 */

@Component({
  selector: 'app-gvplayout',
  templateUrl: './gvplayout.component.html',
  styleUrls: ['./gvplayout.component.css'],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateX(-100%)' }),
        animate('500ms ease-in', style({ transform: 'translateX(0%)' }))
      ]),
      transition(':leave', [
        animate('500ms ease-in', style({ transform: 'translateX(-100%)' }))
      ])
    ])
  ]
})
export class GvplayoutComponent implements OnInit {

  constructor(private layoutService: LayoutService, private api: GVPAPIService) {
  }

  /**
   * List of MC tool versions selected for plotting
   * (value of Version dropdown)
   */
  versionsSel: GvpMctoolNameVersion[] = [];

  /** List of available models/physics lists */
  models: GvpModel[] = [];
  /** List of selected models */
  modelsSel: GvpModel[] = [];
  /** Binding: 2D array representing the layout */
  plots: GvpPlot[][] = [];
  /** Binding: contents of Layout dropdown; also used for creating tag filter */
  pTemplates: [string, GvpLayout][] = [];
  currentLayout: Nullable<GvpLayout> = null;
  /** Binding: "Use Markers" checkbox */
  useMarkers = true;
  /** Binding: selected tags (used for filtering layouts list) */
  checkedTags: string[] = [];
  /** Binding: selected experimental data (inspireId-s) */
  checkedExp: GvpInspire[] = [];

  // Internal variables
  /** List of all tests in selected layout */
  tests: string[] = [];
  /** Binding: can display layout */
  magicPressed = false;
  /** Default options for constructing [GvpPlotXML]{@link GvpPlotXML} */
  DefaultBlock = new Map<string, string>();
  /** List of available tests */
  ALLTESTS: GvpTest[] = [];
  /** Maps test name to test information; TODO: remove ALLTESTS in favour of this? */
  TESTMAP = new Map<string, GvpTest>();
  /** WIP: Experimental data */
  availableExpDataforTest: GvpInspire[] = [];
  /** Cache of MC tool versions, popuated on page load
   * key: database ID (used in API requests)
   * release_date field not used
   */
  MCToolNameVersionCache = new Map<number, { version: string, mctool_name_id: number, release_date: string }>();
  // *del* versionHumanName = {};
  // *del* releaseDate = {};

  selectedVersions: GvpMctoolNameVersion[] = [];
  menuVersions: GvpMctoolNameVersion[] = [];
  menuProjects: GvpMctoolName[] = [];
  projectsSel: GvpMctoolName[] = [];
  isMenuCollapsed = false;
  // progress of plotting
  progressValue: number = 0;
  showUnstableVersions = false;
  // for coloring ratio diff
  _maxRatio = 0;
  _minRatio = 0;
  _uniqVersionModel: VersionModel[] = [];
  currentVersionModelRatio: Nullable<VersionModel> = null;
  testDescriptions: TestDescription[] = [];

  ngOnInit() {
    this.layoutService.getAllLayouts().subscribe((data) => {
      this.pTemplates = [];
      Object.keys(data).forEach((key, idx) => {
        this.pTemplates.push([key, data[key]]);
      })
      this.pTemplates.sort((a, b) => {
        const s1 = a[1].title.toUpperCase();
        const s2 = b[1].title.toUpperCase();
        if (s1 > s2) {
          return 1;
        }
        if (s1 < s2) {
          return -1;
        }
        return 0;
      });
    });
    this.api.mctool_name().subscribe(projs => {
      this.menuProjects = projs.filter(e => e.mctool_name_name !== "experiment");
      if (this.menuProjects.map(e => e.mctool_name_name.toLowerCase()).includes("geant4")) {
        this.projectsSel = [this.menuProjects.find(e => e.mctool_name_name.toLowerCase() === "geant4") as GvpMctoolName];
      }
      if (this.menuProjects.length === 1) {
        this.projectsSel = this.menuProjects.slice();
      }
      // Populate caches
      for (const p of this.menuProjects) {
        this.api.mctool_name_version(undefined, p.mctool_name_name).subscribe(response => {
          for (const elem of response) {
            this.MCToolNameVersionCache.set(elem.mctool_name_version_id, {
              version: elem.version,
              mctool_name_id: elem.mctool_name_id,
              release_date: elem.release_date
            });
          }
        });
      }
    })
  }

  /** Load default values from XML node */
  private readDefaultBlock(node: Element) {
    for (const i of Array.from(node.attributes)) {
      this.DefaultBlock.set(i.name, i.value);
    }
  }

  private updateElementAttributes(main: Element, ref: Element): void {
    const ref_attr = Array.from(ref.attributes).map(e => e.name);
    for (const i of Array.from(main.attributes)) {
      if (ref_attr.indexOf(i.name) !== -1) continue;
      ref.setAttribute(i.name, i.value);
    };
    // TODO: dirty hack )
    if (ref.getAttribute('test') === "experiment") ref.setAttribute('model', 'experiment');
  }

  /** Create [GvpPlot]{@link GvpPlot} object from XML node */
  private convertXMLPlot2Object(plot: Element): Nullable<GvpPlot> {
    let obj: Nullable<GvpPlot> = null;
    if (plot.nodeName === 'plot') {
      obj = new GvpPlot();
      obj.type = GvpPlotType.Plot;
      for (const i of Array.from(plot.attributes)) {
        // TODO: set()
        if (obj.has(i.name)) obj.set(i.name, i.value);
      }
      obj.colspan = obj.colspan || 1;

      for (const key of Object.keys(this.DefaultBlock)) {
        obj.set(key, obj.has(key) ? obj.get(key) : getDefault(this.DefaultBlock, key, ""));
      }
    }
    if (plot.nodeName === 'ratio') {
      const dataplot = plot.children[0];
      const refplot = plot.children[1];
      obj = this.convertXMLPlot2Object(dataplot);
      this.updateElementAttributes(dataplot, refplot);
      if (obj) {
        obj.reference = this.convertXMLPlot2Object(refplot) || undefined;
        obj.type = GvpPlotType.Ratio;
      }
    }
    if (plot.nodeName === 'label') {
      obj = new GvpPlot();
      obj.type = GvpPlotType.Text;
      for (const i of Array.from(plot.attributes)) {
        obj.set(i.name, i.value);
      }
      if (obj.text)
        obj.text = '\\mathrm{' + obj.text.replace(/ /g, ' \\space ') + '}';
    }
    return obj;
  }

  /** Populate list of available tests */
  private waitForTest(): Observable<GvpTest[]> {
    this.ALLTESTS.length = 0;
    return this.api.test().pipe(
      tap(e => this.ALLTESTS = e.filter(elem => elem.test_name !== 'experiment'))
    )
  }

  /** Set human-readable experimental data names */
  private updateExpDescription(testId: number) {
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

  /** WIP: Populate list of MC Tool versions for which data exists for a given test */
  private getVersionsByTest(testname: string) {
    this.magicPressed = false;
    const testlist = this.ALLTESTS.filter(ele => ele.test_name === testname);
    if (testlist.length === 0) {
      return;
    }
    const test = testlist[0];
    this.TESTMAP.set(testname, test);

    this.updateExpDescription(test.test_id);
    const particles = unroll(this.plots).reduce((list: string[], item: GvpPlot) => list = list.includes(item.beam) ? list : list.concat(item.beam), []).filter(e => e.length !== 0);
    forkJoin([this.api.uniqlookup_version(test.test_id), this.api.testVersionParticles(test.test_id, particles)]).pipe(
      map(e => {
        const unv = e[0];
        const wdata = e[1];
        return unv.filter(v => wdata.includes(v));
      })
    ).subscribe((response) => {
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
          const name = this.menuProjects.find(e => e.mctool_name_id === mctoolNameId)?.mctool_name_name;
          versions.set(i, `${name}: ${version}`);
          this.menuVersions.push(
            {
              mctool_name_version_id: i,
              version: result.version,
              mctool_name_id: result.mctool_name_id,
              release_date: result.release_date
            }
          );
          if (this.DefaultBlock.has('version')) {
            this.versionsSel = this.versionsSel.slice();
            const version_names = this.menuVersions.map(e => e.version);
            for (const v of getDefault(this.DefaultBlock, 'version', "").split('|')) {
              if (version_names.indexOf(v) !== -1 && this.versionsSel.map(e => e.version).indexOf(v) === -1) {
                const tmp = this.menuVersions.find(e => e.version === v)
                // always true, for compiler
                if (tmp)
                  this.versionsSel.push(tmp);
              }
            }
          }
        }
      }
      this.menuVersions.sort(versionSorter).reverse();
      if (this.menuVersions.length === 1) {
        this.versionsSel = this.menuVersions.slice();
      }
      this.versionChanged(this.versionsSel);
    });
  }

  versionOptionsFilter(v: GvpMctoolNameVersion[]): GvpMctoolNameVersion[] {
    let unst_f = unstableVersionFilter;
    if (this.showUnstableVersions)
      unst_f = (e: GvpMctoolNameVersion) => true;
    const p_ids = this.projectsSel.map(e => e.mctool_name_id) || [];
    const proj_f = (e: GvpMctoolNameVersion) => p_ids.includes(e.mctool_name_id);
    return v.filter(unst_f).filter(proj_f);
  }

  modelOptionsFilter(m: GvpModel[]): GvpModel[] {
    const p_ids = this.projectsSel.map(e => e.mctool_name_id) || [];
    return m
      .filter(e => p_ids.includes(e.mctool_name_id))
      .sort((a, b) => a.mctool_model_name.localeCompare(b.mctool_model_name));
  }

  projectFilter(items: GvpMctoolName[]): GvpMctoolName[] {
    return items.filter(p => this.menuVersions.some(v => v.mctool_name_id === p.mctool_name_id));
  }

  filterVersionSel() {
    if (!this.showUnstableVersions) return;
    this.versionsSel = this.versionsSel.filter(unstableVersionFilter)
  }

  versionSelectFilter(items: GvpMctoolNameVersion[], query: string): GvpMctoolNameVersion[] {
    return items.filter(e => e.version.indexOf(query) !== -1);
  }

  projectSelectFilter(items: GvpMctoolName[], query: string): GvpMctoolName[] {
    return items.filter(e => e.mctool_name_name.includes(query));
  }

  /** Populate list of models (phys. lists) used in a given test */

  private getModelsByTest(testname: string) {
    const testlist = this.ALLTESTS.filter(elem => elem.test_name === testname);
    if (testlist.length === 0) { return; }
    const test = testlist[0];
    this.api.uniqlookup_model(test.test_id).subscribe(response => {
      this.models = this.models.slice();
      const responceValues = response.slice();
      responceValues.sort();
      for (const v of responceValues) {
        if (!this.models.map(e => e.mctool_model_id).includes(v.mctool_model_id)) {
          this.models.push(v);
        }
      }

      if (responceValues.length === 1) {
        this.modelsSel.push(responceValues[0]);
      }

      // check default values
      if (this.DefaultBlock.has('model')) {
        this.modelsSel = this.modelsSel.slice();
        for (const i of getDefault(this.DefaultBlock, 'model', "").split('|')) {
          if (
            this.models.map(e => e.mctool_model_name).includes(i) &&
            !this.modelsSel.map(e => e.mctool_model_name).includes(i)
          ) {
            this.modelsSel.push(this.models.find(e => e.mctool_model_name === i) as GvpModel);
          }
        }
      }
      this.modelChanged(this.modelsSel);
    });
  }

  collapseMenu() {
    this.isMenuCollapsed = !this.isMenuCollapsed;
    const c = this.isMenuCollapsed;
  }

  columnWidth(rowlen: number): string {
    const w = 100 / rowlen - 2;
    return `${w}%`;
  }

  /** Parse layout file and populate GUI elements */
  updateMenu(xml: Document | null) {

    if (xml === null) {
      return;
    }

    const layout: Element = xml.documentElement;
    if (layout.nodeName !== 'layout') {
      return;
    }

    const rows = Array.from(layout.children);
    if (rows.length === 0) {
      return;
    }
    const plots = new Array<Array<GvpPlot>>();

    for (const row of rows) {
      if (row.nodeName === 'default') {
        this.readDefaultBlock(row);
        continue;
      }
      plots.push([]);
      const plotsLast = plots[plots.length - 1];

      for (const j of Array.from(row.children)) {
        const obj = this.convertXMLPlot2Object(j);
        if (!obj) continue;
        plotsLast.push(obj);
        if (obj.isPlot() && obj.test) {
          this.tests.push(obj.test);
        }
        if (obj.isRatio()) {
          if (obj.test) {
            this.tests.push(obj.test);
          }
          if (obj.reference && obj.reference.isPlot() && obj.reference.test) {
            this.tests.push(obj.reference.test);
          }
        }
      }
    }

    this.tests = this.tests.filter(distinct);

    this.waitForTest().subscribe(data => {
      this.testDescriptions = data.filter(e => this.tests.includes(e.test_name) && e.test_name !== "experiment").map(e => {
        return {
          header: capitalize(e.test_name),
          content: e.description,
          authors: e.responsible
        } as TestDescription;
      });
      for (const testname of this.tests) {
        this.getVersionsByTest(testname);
        this.getModelsByTest(testname);
      }
      this.plots = plots;
    });
    this.plots = plots;
  }

  /** Binding: Creates a list of unique tags for tag filter */
  uniqueTags(list: [string, GvpLayout][]): string[] {
    return list.map(t => t[1].tags).reduce((p, c) => p.concat(c), []).filter(distinct);
  }

  updateExp(e: GvpInspire) {
    if (this.checkedExp.indexOf(e) === -1) {
      this.checkedExp.push(e);
    } else {
      this.checkedExp.splice(this.checkedExp.indexOf(e), 1);
    }
    // update reference select
    const vm = this._uniqVersionModel.find(e => e.model === "experiment" && e.version === "experiment");
    if (vm) {
      // present in menu
      if (this.checkedExp.length === 0) {
        // but not should
        const idx = this._uniqVersionModel.indexOf(vm);
        this._uniqVersionModel.splice(idx, 1);
      }
    } else {
      // not present in menu
      if (this.checkedExp.length !== 0) {
        // but should
        this._uniqVersionModel.push({ version: "experiment", model: "experiment" })
      }
    }
  }

  updateTags(tag: string) {
    if (this.checkedTags.indexOf(tag) === -1) {
      this.checkedTags.push(tag);
    } else {
      this.checkedTags.splice(this.checkedTags.indexOf(tag), 1);
    }
  }

  /** Model <-> View binding to filter layouts based on tags */
  isLayoutShown(tags: string[]): boolean {
    if (this.checkedTags.length !== 0) {
      // console.log(this.checkedTags);
      for (const tag of tags) {
        if (this.checkedTags.indexOf(tag) !== -1) {
          return true;
        }
        return false;
      }
    }
    return true;
  }

  versionFormatter(item: GvpMctoolNameVersion, query?: string): string {
    return item.version;
  }

  modelFormatter(item: GvpModel, q?: string): string {
    return item.mctool_model_name;
  }

  projectFormatter(item: GvpMctoolName, q?: string): string {
    return item.mctool_name_name;
  }

  layoutFormatter(item: [string, GvpLayout], query?: string): string {
    return item[1].title;
  }

  layoutFilter(items: [string, GvpLayout][], query: string): [string, GvpLayout][] | false {
    query = query.trim().toLowerCase();
    if (query.length === 0) return items;
    return items.filter(i => i[1].title.toLowerCase().includes(query));
  }
  /** Event handler: layout selected */
  onSelectLayout(layout: [string, GvpLayout]) {
    this.layoutService.getLayout(layout[0]).subscribe((results) => {
      this.tests = [];
      this.models = [];
      this.modelsSel = [];
      this.versionsSel = [];
      this.availableExpDataforTest = [];
      this.checkedExp = [];
      this.progressValue = 0;
      this.currentVersionModelRatio = null;
      this._uniqVersionModel = [];
      this.updateMenu(results);
    });
  }

  /** Controls if 'Plot' button is disabled
   *  Is a separate function to avoid ExpressionChangedAfterItHasBeenCheckedError
   */
  updateCantPlot() {
    if (!this.currentLayout) {
      return true;
    }

    if (this.versionsSel.length * this.modelsSel.length === 0) {
      return true;
    }

    return false;
  }

  /** Event handler: 'Plot' button clicked */
  magic() {
    const div = document.getElementById("headerblk");
    if (div) div.scrollIntoView();
    this.magicPressed = true;
    this.progressValue = 0;
    this._maxRatio = 0;
    this._minRatio = 0;
    // dirty hack to update plots
    // and then angular cache for getPlotConfig will be invalidated
    // and new Observable from getPlotConfig will be generated
    // TODO: fix this stupid hack
    let plots: GvpPlot[][] = [];
    for (let p of this.plots)
      plots.push(p.slice());
    this.plots = plots;
  }

  getPlotConfig(p: GvpPlot) {
    // request
    let r: GvpPngRequest = new GvpPngRequest([]);
    r.markerSize = this.useMarkers ? p.markerSize : 0;
    r.onlyratio = p.onlyratio;
    r.xaxis = p.xaxis;
    r.yaxis = p.yaxis;
    r.xmin = p.xmin;
    r.xmax = p.xmax;
    r.ymin = p.ymin;
    r.ymax = p.ymax;
    r.plotStyle = p.plotStyle;

    // query
    const tests = this.ALLTESTS.filter(e => e.test_name === p.test);
    const test_ids = tests.map(e => e.test_id);
    // convert parameters

    const par = p.getParametersList();
    const query: GvpPlotIdRequest = new GvpPlotIdRequest(
      test_ids,
      [p.target],
      this.versionsSel.map(e => e.mctool_name_version_id),
      this.modelsSel.map(e => e.mctool_model_name),
      [p.secondary],
      [p.beam],
      [p.observable],
      par,
      [p.energy]
    );
    const plots = this.api.getPlotJSON(query);
    const exps = this.checkedExp.map(exp => this.api.getExpMatchPlotInspire(query, exp.inspire_id));

    let listHttp = [plots, ...exps];
    if (p.reference) {
      const par_ref = p.reference.getParametersList();
      const query_ref: GvpPlotIdRequest = new GvpPlotIdRequest(
        test_ids,
        [p.reference.target],
        this.versionsSel.map(e => e.mctool_name_version_id),
        this.modelsSel.map(e => e.mctool_model_name),
        [p.reference.secondary],
        [p.reference.beam],
        [p.reference.observable],
        par_ref,
        [p.reference.energy]
      );
      const refs = this.api.getPlotJSON(query_ref);
      listHttp.unshift(refs);
    }
    let all = forkJoin(listHttp).pipe(
      map(e => {
        r.data = unroll(e).filter(distinctJSON);
        if (p.reference) {
          const rp = filterData(r.data, p.reference);
          if (rp.length !== 0) {
            r.refid = r.data.indexOf(rp[0]);
          }
        }
        if (this.currentVersionModelRatio) {
          // force 'refid' value
          for (let i = 0; i < r.data.length; i++) {
            if (r.data[i].mctool.version === this.currentVersionModelRatio.version
              && r.data[i].mctool.model === this.currentVersionModelRatio.model) {
              r.refid = i;
              break;
            }
          }
        }
        return r;
      })
    )
    return all;
  }

  isProgressValueShown(progress: number): boolean {
    if (progress === this.getProgressMax()) return false;
    return true;
  }

  getProgressMax(): number {
    return unroll(this.plots).filter(e => !e.isText()).length;
  }

  incrementProgress(event: PlotEmitType) {
    this.progressValue += 1;
    const rd = event.ratiodiff;
    // update min/max
    if (isFinite(rd)) {
      if (rd < this._minRatio) this._minRatio = rd;
      if (rd > this._maxRatio) this._maxRatio = rd;
    }
  }

  _uniqVersionModelFormatter(item: VersionModel, query?: string): string {
    if (item.version === "experiment") return "experimental data";
    return `${item.version} ${item.model}`
  }

  isCenteredRow(row: GvpPlot[]): boolean {
    return row.filter(e => e.isPlot() || e.isRatio()).length === 0;
  }

  rowsWithPlots(plots: GvpPlot[][]): GvpPlot[][] {
    // filters rows so they contains at least one plot/ratio plot
    return plots.filter(pl =>
      pl.map(e => e.isPlot() || e.isRatio()).indexOf(true) !== -1
    )
  }

  getMaxColumns(plots: GvpPlot[][]): number {
    return Math.max(...plots.map(e => e.length));
  }

  versionChanged(svers: GvpMctoolNameVersion[]) {
    this._uniqVersionModel = [];
    for (let m of this.modelsSel)
      for (let v of svers)
        if (m.mctool_name_id === v.mctool_name_id)
          this._uniqVersionModel.push({ version: v.version, model: m.mctool_model_name });
  }

  projectChanged(projs: GvpMctoolName[]) {
    const pp = projs.map(e => e.mctool_name_id);
    this.versionsSel = this.versionsSel.filter(e => pp.includes(e.mctool_name_id));
    this.modelsSel = this.modelsSel.filter(e => pp.includes(e.mctool_name_id));
  }

  modelChanged(smod: GvpModel[]) {
    this._uniqVersionModel = [];
    for (let v of this.versionsSel)
      for (let m of smod)
        if (m.mctool_name_id === v.mctool_name_id)
          this._uniqVersionModel.push({ version: v.version, model: m.mctool_model_name });
  }

  getSUIGridClass(cols: number): string {
    return `${getColumnWide(cols)} column grid`;
  }

  getSUIGridSize(state: boolean) {
    return (state) ? "sixteen wide column leftpad" : "twelve wide column";
  }

  isText(p: GvpPlot): boolean {
    return p.isText();
  }

  formatRatioDiff(ratio: number): string {
    const est = RatioDiffEstimator;
    const precision = 5;
    return `${est.description} = ${ratio.toPrecision(precision)}`;
  }

  ratioColor(ratio: number): string {
    // L in HSL color

    const GREEN_L = 25;
    const RED_L = 44;
    const l1 = this._maxRatio - this._minRatio;
    // if not finite -- red
    const l2 = isFinite(ratio) ? ratio - this._minRatio : l1;
    const prcnt = 100 - Math.round(100 * l2 / l1);
    const intensity = Math.round(RED_L - prcnt * (RED_L - GREEN_L) / 100);
    const color = `hsl(${prcnt}, 100%, ${intensity}%)`;
    return color;
  }

  getIdPlot(plot: GvpPlot): string {
    return getIdPlot(plot);
  }

  getPlotRatioColor(plot: GvpPlot): string {
    // need to find element by Id and get ratio and color
    const e = document.getElementById("ratio_" + this.getIdPlot(plot));
    if (!e) return "";
    if (!e.style.color) return "";
    return e.style.color;
  }

  private pulsatePlot(plot: GvpPlot) {
    const id = "plot_" + this.getIdPlot(plot);
    const e = document.getElementById(id);
    if (!e) return;
    const parent = e.parentElement;
    console.log(parent);
    if (parent) {
      parent.classList.add("border-pulse")
      setTimeout(() => {
        parent.classList.remove("border-pulse")
      }, 3000);
    }
  }

  scrollto(plot: GvpPlot): void {
    const id = "plot_" + this.getIdPlot(plot);
    const e = document.getElementById(id);
    if (!e) return;
    e.scrollIntoView();
    this.pulsatePlot(plot);
  }

}
