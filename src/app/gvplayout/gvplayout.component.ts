import { Component, OnInit } from '@angular/core';
import { LayoutService } from '../services/layout.service';
import { GvpPlot, GvpTest, GvpExpData, GvpMctoolNameVersion, GvpLayout, GvpPlotConfig } from '../classes/gvp-plot';
import { GVPAPIService } from '../services/gvpapi.service';
import { HttpParams } from '@angular/common/http';

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
  models = new Array<string>();
  /** List of selected models */
  modelsSel = new Array<string>();
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
  checkedExp: GvpExpData[] = [];
  /** Binding: disabled state of "Plot" button */
  cantPlot: boolean;

  // Internal variables
  /** List of all tests in selected layout */
  tests = new Array<string>();
  /** Binding: can display layout */
  magicPressed = false;
  /** Default options for constructing [GvpPlotXML]{@link GvpPlotXML} */
  DefaultBlock = new Map<string, any>();
  /** List of available tests */
  ALLTESTS = new Array<GvpTest>();
  /** Maps test name to test information; TODO: remove ALLTESTS in favour of this? */
  TESTMAP = new Map<string, GvpTest>();
  /** WIP: Experimental data */
  availableExpDataforTest = new Array<GvpExpData>();
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
  readDefaultBlock(node: Element) {
    for (const i of Array.from(node.attributes)) {
      this.DefaultBlock.set(i.name, i.value);
    }
  }

  /** Create [GvpPlot]{@link GvpPlot} object from XML node */
  convertXMLPlot2Object(plot: Element): GvpPlot {
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

  /** Populate list of tests used in a given layout */
  private filltests(o: GvpPlot) {
    if (o.type === 'plot' && o.test) {
      this.tests.push(o.test);
    }
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
    let httpParams = new HttpParams();
    httpParams = httpParams.set('test_id', String(testId));
    this.api._get<GvpExpData[]>('api/getexperimentsinspirefortest', httpParams).subscribe((result) => {
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
    // this.selected = '1';
    const testlist = this.ALLTESTS.filter(ele => ele.test_name === testname);
    if (testlist.length === 0) {
      return;
    }

    const test = testlist[0];
    this.TESTMAP.set(testname, test);

    this.updateExpDescription(test.test_id);
    // let config = new HttpParams();
    // config = config.set('test_id', String(test.test_id));
    // config = config.set('table', 'mctool_name_version');
    // config = config.set('onplot', 'mctool_name_version_id');
    // config = config.set('ontable', 'mctool_name_version_id');
    // config = config.set('namefield', 'mctool_name_version_id');
    // config = config.set('JSONAttr', 'mctool.version');

    this.api.uniqlookup_version(test.test_id).subscribe((response) => {
      this.menuVersions = [];
      const versions = new Map<number, string>();
      for (const i of response) {
        if (this.menuVersions.map(e => e.mctool_name_version_id).indexOf(i) === -1) {
          // this.versionDropDowns[0].values.push(i);
          const result = this.MCToolNameVersionCache.get(i);
          if (result === undefined) {
            console.log(`mctool.version ${i} not found!`);
            continue;
          }
          const version = result.version;
          const mctoolNameId = result.mctool_name_id;
          // const mctoolNameVersionId = i;
          // const release_date = result.release_date;
          const name = this.MCToolNameCache.get(mctoolNameId);
          // this.versionHumanName[mctoolNameVersionId] = `${name}: ${version}`;
          // this.releaseDate[mctoolNameVersionId] = release_date;
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

  getModelsByTest(testname: string) {
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
        for (const i of this.DefaultBlock.get('model').split('|')) {
          if (
            this.models.indexOf(i) !== -1 &&
            this.modelsSel.indexOf(i) === -1
          ) {
            this.modelsSel.push(i);
          }
        }
      }
      console.log(this.models);
    });
  }

  /** Operator for Array.filter returning only unique items */
  private distinct(value, index: number, arr: any[]) {
    return arr.indexOf(value) === index;
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

  updateExp(e: GvpExpData) {
    if (this.checkedExp.indexOf(e) === -1) {
      this.checkedExp.push(e);
    } else {
      this.checkedExp.splice(this.checkedExp.indexOf(e), 1);
    }
    console.log(this.checkedExp)
  }

  updateTags(tag: string) {
    if (this.checkedTags.indexOf(tag) === -1) {
      this.checkedTags.push(tag);
    } else {
      this.checkedTags.splice(this.checkedTags.indexOf(tag), 1);
    }
  }
  /** Event handler for tag filter */
  // checkTag(tag: string) {
  //   if (this.checkedTags.has(tag)) {
  //     this.checkedTags.delete(tag);
  //   } else {
  //     this.checkedTags.add(tag);
  //   }
  // }

  /** Model -> View binding for tag filter */
  // isTagChecked(tag: string) {
  //   return this.checkedTags.has(tag);
  // }

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
      this.updateCantPlot();
      this.menuLoaded = true;
    });
  }

  /** Controls if 'Plot' button is disabled
   *  Is a separate function to avoid ExpressionChangedAfterItHasBeenCheckedError
   */
  updateCantPlot() {
    if (!this.currentLayout) {
      // console.log('Can\'t plot: no layout selected');
      return true;
    }

    if (this.versionsSel.length * this.modelsSel.length === 0) {
      // console.log('Can\'t plot: no versions selected');
      return true;
    }

    return false;
  }

  /** Calculates plot sizes; TODO: call this when opening/closing the menu */
  getImageSize(bootstrapColumn?: number) {
    const imageprop = 1500 / 1100;

    if (!bootstrapColumn) {
      bootstrapColumn = 12;
    }

    const plots = this.plots;
    const wpadding = 0.025; // width padding in percents
    const hpadding = 0.025; // width padding in percents
    const maxwidth = ((window.innerWidth * bootstrapColumn) / 12) * (1 - wpadding * 2); // bootstrap col-lg-9
    const maxheight = window.innerHeight * (1 - hpadding * 2);
    if (plots.length === 0) {
      return { width: 0, height: 0 };
    }
    const nrows = plots.length;
    const ncols = 2; // WIP: fix Math.max(...plots.map(e => e.length));
    const w = maxwidth / ncols;
    let h = maxheight / (nrows === 1 ? 2 : nrows);

    if (h < w / imageprop) {
      h = w / imageprop;
    }
    return {
      width: w,
      height: h
    };
  }

  /** Event handler: 'Plot' button clicked */
  magic() {
    /*
    this.magicPressed = true;
    this.plotList.forEach((aplot) => {
      if (aplot.config.test === 'experiment') {
        aplot.testId = 102;
        aplot.versionId = [-1];
        // aplot.config.model = 'experiment';
      } else {
        const test = this.TESTMAP.get(aplot.config.test);
        if (test === undefined) {
          console.log(`Test ${aplot.config.test} not found!`);
          return;
        }
        aplot.testId = test.test_id;
        aplot.versionId = this.versionsSel.map(e => e.mctool_name_version_id);
        // aplot.config.model = this.modelsSel.join('|');
      }

      aplot.useMarkers = this.useMarkers;
      aplot.status = '';
      aplot.expData = this.checkedExp.map(e => e.inspire_id);
      aplot.model = this.modelsSel.join('|');
      aplot.resizeImage(this.getImageSize());
      aplot.draw();
    });
    */
  }

  getPlotConfig(plot: GvpPlot): GvpPlotConfig {
    return null;
  }
}
