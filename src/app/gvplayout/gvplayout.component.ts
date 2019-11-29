import { Component, OnInit } from '@angular/core';
import { LayoutService } from '../services/layout.service';
import { GvpPlot, GvpTest, GvpMctoolNameVersion, GvpLayout, GvpInspire, GvpPngRequest, GvpPlotIdRequest, GvpJSON, GvpParameter } from '../classes/gvp-plot';
import { GVPAPIService } from '../services/gvpapi.service';
import { map, concatAll } from 'rxjs/operators';
import { from } from 'rxjs';

/**
 * Shows [plots]{@link PlotComponent} for a given version(s) and model(s) using a predefined or custom template
 */

@Component({
  selector: 'app-gvplayout',
  templateUrl: './gvplayout.component.html',
  styleUrls: ['./gvplayout.component.css']
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
  models: string[] = [];
  /** List of selected models */
  modelsSel: string[] = [];
  /** Binding: 2D array representing the layout */
  plots: GvpPlot[][] = [];
  /** Binding: contents of Layout dropdown; also used for creating tag filter */
  pTemplates: [string, GvpLayout][] = [];
  currentLayout: GvpLayout;
  /** Binding: "Use Markers" checkbox */
  useMarkers = true;
  /** Binding: selected tags (used for filtering layouts list) */
  checkedTags: string[] = [];
  /** Binding: selected experimental data (inspireId-s) */
  checkedExp: GvpInspire[] = [];
  /** Binding: disabled state of "Plot" button */
  cantPlot: boolean;

  // Internal variables
  /** List of all tests in selected layout */
  tests: string[] = [];
  /** Binding: can display layout */
  magicPressed = false;
  /** Default options for constructing [GvpPlotXML]{@link GvpPlotXML} */
  DefaultBlock = new Map<string, any>();
  /** List of available tests */
  ALLTESTS: GvpTest[] = [];
  /** Maps test name to test information; TODO: remove ALLTESTS in favour of this? */
  TESTMAP = new Map<string, GvpTest>();
  /** WIP: Experimental data */
  availableExpDataforTest: GvpInspire[] = [];
  /**
   * Cache of MC tool names, populated on page load
   * key: database ID (used in API requests)
   * value: tool name (e.g. 'Geant 4')
   */
  MCToolNameCache = new Map<number, string>();
  /** Cache of MC tool versions, popuated on page load
   * key: database ID (used in API requests)
   * release_date field not used
   */
  MCToolNameVersionCache = new Map<number, { version: string, mctool_name_id: number, release_date: string }>();
  // *del* versionHumanName = {};
  // *del* releaseDate = {};

  selectedVersions: GvpMctoolNameVersion[] = [];
  menuVersions: GvpMctoolNameVersion[] = [];
  menuLoaded = false;
  isMenuCollapsed = false;

  ngOnInit() {
    this.layoutService.getAllLayouts().subscribe((data) => {
      this.pTemplates = [];
      Object.keys(data).map((e) => this.pTemplates.push([e, data[e]]));
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
  }

  /** Load default values from XML node */
  private readDefaultBlock(node: Element) {
    for (const i of Array.from(node.attributes)) {
      this.DefaultBlock.set(i.name, i.value);
    }
  }

  /** Create [GvpPlot]{@link GvpPlot} object from XML node */
  private convertXMLPlot2Object(plot: Element): GvpPlot {
    let obj: GvpPlot;
    if (plot.nodeName === 'plot') {
      obj = {
        type: 'plot',
        isModelCanChange: false,
        empty: true
      } as GvpPlot;
      for (const i of Array.from(plot.attributes)) {
        obj[i.name] = i.value;
        obj.empty = false;
      }
      obj.colspan = obj.colspan || 1;

      for (const key of Object.keys(this.DefaultBlock)) {
        obj[key] = obj[key] || this.DefaultBlock[key];
      }
    }
    if (plot.nodeName === 'ratio') {
      const dataplot = plot.children[0];
      const refplot = plot.children[1];
      obj = this.convertXMLPlot2Object(dataplot);
      obj.reference = this.convertXMLPlot2Object(refplot);
      obj.type = 'ratio';
      obj.empty = false;
    }
    if (plot.nodeName === 'label') {
      obj = {
        type: 'text',
        empty: true
      } as GvpPlot;
      for (const i of Array.from(plot.attributes)) {
        obj[i.name] = i.value;
        obj.empty = false;
      }
      obj.text = '\\mathrm{' + obj.text.replace(/ /g, ' \\space ') + '}';
    }
    return obj;
  }

  /** Populate list of available tests */
  private waitForTest(): Promise<any> {
    this.ALLTESTS.length = 0;
    return new Promise((resolve) => {
      this.api.test().subscribe(data => {
        this.ALLTESTS = data.filter(elem => elem.test_name !== 'experiment');
        resolve();
      });
    });
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

      if (this.menuVersions.length === 1) {
        this.versionsSel = this.menuVersions.slice();
      }
    });
  }

  versionSelectFilter(items: GvpMctoolNameVersion[], query: string): GvpMctoolNameVersion[] {
    return items.filter(e => e.version.indexOf(query) !== -1);
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
        if (this.models.indexOf(v) === -1) {
          this.models.push(v);
        }
      }

      if (responceValues.length === 1) {
        this.modelsSel.push(responceValues[0]);
      }

      // check default values
      if (this.DefaultBlock.has('model')) {
        this.modelsSel = this.modelsSel.slice();
        for (const i of this.DefaultBlock.get('model').split('|')) {
          if (
            this.models.indexOf(i) !== -1 &&
            this.modelsSel.indexOf(i) === -1
          ) {
            this.modelsSel.push(i);
          }
        }
      }
    });
  }

  /** Operator for Array.filter returning only unique items */
  private distinct(value, index: number, arr: any[]) {
    return arr.indexOf(value) === index;
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
        const obj: GvpPlot = this.convertXMLPlot2Object(j) as GvpPlot;
        if (obj.type === 'plot' && (!obj.model || obj.model.length === 0)) {
          obj.isModelCanChange = true;
        }
        if (obj.type === 'ratio' && (!obj.model || obj.model.length === 0)) {
          obj.isModelCanChange = true;
          obj.reference.isModelCanChange = true;
        }
        plotsLast.push(obj);
        if (obj.type === 'plot' && obj.test) {
          this.tests.push(obj.test);
        }
        if (obj.type === 'ratio') {
          if (obj.test) {
            this.tests.push(obj.test);
          }
          if (obj.reference.type === 'plot' && obj.reference.test) {
            this.tests.push(obj.reference.test);
          }
        }
      }
    }

    this.tests = this.tests.filter(this.distinct);

    this.waitForTest().then(() => {
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
    return list.map(t => t[1].tags).reduce((p, c) => p.concat(c), []).filter(this.distinct);
  }

  updateExp(e: GvpInspire) {
    if (this.checkedExp.indexOf(e) === -1) {
      this.checkedExp.push(e);
    } else {
      this.checkedExp.splice(this.checkedExp.indexOf(e), 1);
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

  layoutFormatter(item: [string, GvpLayout], query?: string): string {
    return item[1].title;
  }
  /** Event handler: layout selected */
  onSelectLayout(layout: [string, GvpLayout]) {
    this.menuLoaded = false;
    this.layoutService.getLayout(layout[0]).subscribe((results) => {
      this.tests = [];
      this.models = [];
      this.modelsSel = [];
      this.versionsSel = [];
      this.availableExpDataforTest = [];
      this.checkedExp = [];
      this.updateMenu(results);
      this.menuLoaded = true;
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
    this.magicPressed = true;
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
    let r: GvpPngRequest = new GvpPngRequest();
    r.data = [];
    r.markerSize = p.markerSize;
    if (!this.useMarkers) r.markerSize = 0;
    r.onlyratio = p.onlyratio;
    r.xaxis = p.xaxis;
    r.yaxis = p.yaxis;
    r.xmin = p.xmin;
    r.xmax = p.xmax;
    r.ymin = p.ymin;
    r.ymax = p.ymax;
    r.plotStyle = p.plotStyle;

    let query: GvpPlotIdRequest = new GvpPlotIdRequest();
    query.beam_energy = [p.energy];
    query.beamparticle = [p.beam];
    query.model = this.modelsSel;
    query.observable = [p.observable];
    query.secondary = [p.secondary];
    query.target = p.target;
    query.version_id = this.versionsSel.map(e => e.mctool_name_version_id);
    // convert parameters
    let par: [string, string[]][] = [];
    if (p.parname && p.parvalue) {
      const pname = p.parname.split(',');
      const pval = p.parvalue.split(',');
      for (let i of pname) {
        par.push([i, [pval[pname.indexOf(i)]]]);
      }
    }
    query.parameters = par;
    const tests = this.ALLTESTS.filter(e => e.test_name === p.test);
    query.test_id = tests.map(e => e.test_id);
    const plots = this.api.getPlotJSON(query)
    const checkParams = (p1: GvpParameter[], p2: GvpParameter[]): boolean => {
      if (p1.length !== p2.length) return false;
      for (const i of p1) {
        // no key
        const idx = p2.map(e => e.names).indexOf(i.names);
        if (idx === -1) return false;
        if (p2[idx].values !== i.values) return false;
      }
      return true;
    }
    const exps = from(this.checkedExp.map(e => this.api.getExpPlotsByInspireId(e.inspire_id))).pipe(
      concatAll(),
      // filter by target, beam ...
      map(e => {
        let res: GvpJSON[] = [];
        let pa: GvpParameter[] = par.map(e => {
          return { names: e[0], values: e[1][0] }
        });
        for (let i of e) {
          if (i.metadata.beamParticle === p.beam &&
            i.metadata.observableName === p.observable &&
            i.metadata.secondaryParticle === p.secondary &&
            i.metadata.targetName === p.target &&
            checkParams(i.metadata.parameters, pa)
          ) res.push(i);
        }
        return res;
      })
    )
    const all = from([plots, exps]).pipe(
      concatAll(),
      map(e => {
        r.data = r.data.concat(...e);
        return r;
      })
    );
    return all;
  }
}
