import { Component, OnInit, ViewChildren, QueryList, ViewChild } from '@angular/core';
import { LayoutService } from '../layout.service';
import { Observable } from 'rxjs';
import { GvpPlot, GvpTest, GvpTestRequest, GvpExpData, GvpUniq, GvpMctoolNameVersion, GvpMctoolName } from '../gvp-plot';
import { PlotComponent } from '../plot/plot.component';
import { GVPAPIService } from '../gvpapi.service';
import { MatSidenav } from '@angular/material';
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

  // Bindings
  /** List of available MC tool versions: depends on test(s) included in layout;
   *
   * key: version_id (used in API requests)
   *
   * value: human-readable version (Name: version)
   *
   */
  versions = new Map<number, string>();
  /**
   * List of MC tool versions selected for plotting
   * (value of Version dropdown)
   */
  versionsSel = new Array<number>();

  /** List of available models/physics lists */
  models = new Map<string, string>();
  /** Maps model to test; unused */
  modelsTests = new Map<string, string>();
  /** List of selected models
   * (value of Model dropdown)
   */
  modelsSel = new Array<string>();

  /** Value of layout dropdown */
  selectedLayout = '';
  pTemplates = new Array();

  // Components
  /** list of all [plots]{@link PlotComponent} in a layout */
  @ViewChildren(PlotComponent) plotList: QueryList<PlotComponent>;
  /** [menu]{@link MatSidenav} object */
  @ViewChild(MatSidenav) sidenav: MatSidenav;

  // Internal variables
  /** 2D array of [plots]{@link GvpPlot} in selected layout */
  plots =  new Array<Array<GvpPlot>>();
  /** Array contating row-sums of [span]{@link GvpPlot.span} values in [plots]{@link this.plots} array */
  spans = new Array<number>();
  // contents = '';
  /** List of all tests in selected layout */
  tests = new Array<string>();
  /** TODO: use this to hide plots when selection is changed */
  magicPressed = false;
  /** TODO: unused? */
  loadComplete = false;
  /** State of the menu */
  opened = true;
  /** Default options for constructing [GvpPlotXML]{@link GvpPlotXML} */
  DefaultBlock = new Map<string, any>();
  /** */
  ALLTESTS = new Array<GvpTest>();
  /** WIP */
  showPhysListSelection = false;
  /** */
  TESTMAP = new Map<string, GvpTest>();
  /** TODO: unused? */
  testObject: GvpTestRequest;
  /** TODO: unused? */
  selectedItem: GvpTest;
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
  MCToolNameVersionCache = new Map<number, {version: string, mctool_name_id: number, release_date: string}>();
  // *del* versionHumanName = {};
  // *del* releaseDate = {};
  /** List of selected tags (used for filtering layouts list) */
  checkedTags = new Set<string>();

  ngOnInit() {
    this.layoutService.getAllLayouts().subscribe((data) => {
      Object.keys(data).map((e) => this.pTemplates.push([e, data[e].title, data[e].tags]));
      this.pTemplates.sort((a, b) => {
        const s1 = a[1].toUpperCase();
        const s2 = b[1].toUpperCase();
        if (s1 > s2) {
          return 1;
        } else {
          if (s1 < s2) {
            return -1;
          }
          return 0;
      }});
    });

    // Populate caches
    this.api.get<GvpMctoolNameVersion[]>('api/mctool_name_version').subscribe(response => {
      for (const elem of response) {
        this.MCToolNameVersionCache.set(elem.mctool_name_version_id, {
          version: elem.version,
          mctool_name_id: elem.mctool_name_id,
          release_date: elem.release_date
        });
      }
    });

    this.api.get<GvpMctoolName[]>('api/mctool_name').subscribe(response => {
      for (const elem of response) {
        this.MCToolNameCache.set(elem.mctool_name_id, elem.mctool_name_name);
      }
    });
  }

  /** Wrapper for [layoutService.getLayout]{@link layoutService.getLayout} */
  downloadLayout(file: string): Observable<Document|null> {
    return this.layoutService.getLayout(file);
  }

  /** Load default values from XML */
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
      obj = {
        type: 'ratio',
        empty: false,
        plot: this.convertXMLPlot2Object(dataplot),
        reference: this.convertXMLPlot2Object(refplot)
      } as GvpPlot;
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
      this.api.get<GvpTest[]>('api/test').subscribe(data => {
          this.ALLTESTS = data.filter(elem => elem.test_name !== 'experiment');
          resolve();
        });
    });
  }

  /** Set human-readable experimental data names */
  private updateExpDescription(testId: number) {
    let httpParams = new HttpParams();
    httpParams = httpParams.set('test_id', String(testId));
    this.api.get<GvpExpData[]>('api/getexperimentsinspirefortest', httpParams).subscribe((result) => {
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

    this.testObject = {
      id: '',
      versiontag: '',
      model: '',
      calorimeter: '',
      pname: '',
      oname: ''
    } as GvpTestRequest;

    this.selectedItem = test;
    this.updateExpDescription(test.test_id);
    let config = new HttpParams();
    config = config.set('test_id', String(test.test_id));
    config = config.set('table', 'mctool_name_version');
    config = config.set('onplot', 'mctool_name_version_id');
    config = config.set('ontable', 'mctool_name_version_id');
    config = config.set('namefield', 'mctool_name_version_id');
    config = config.set('JSONAttr', 'mctool.version');

    this.api.get<GvpUniq<number>>('api/uniqlookup', config).subscribe((response) => {
      const versions = new Map<number, string>();
      for (const i of response.values) {
        if (!this.versions.has(i)) {
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
        }
      }

      this.versions = new Map<number, string>(Array.from(versions.entries()).sort((a, b) => (a[1].localeCompare(b[1]))));

      if (this.versions.size === 1) {
        this.versionsSel = [this.versions.entries[0][0]];
      }
    });
  }

  /** WIP: Populate list of models (phys. lists) used in a given test */
  getModelsByTest(testname: string) {
    const testlist = this.ALLTESTS.filter(elem => elem.test_name === testname);
    if (testlist.length === 0) { return; }
    const test = testlist[0];
    let config = new HttpParams();
    config = config.set('test_id', String(test.test_id));
    config = config.set('JSONAttr', 'mctool.model');
    this.api.get<GvpUniq<string>>('/api/uniqlookup', config).subscribe(response => {
      const responceValues = response.values.slice();
      responceValues.sort();
      for (const v of responceValues) {
        if (!this.models.has(v)) {
          this.models.set(v, v);
          this.modelsTests.set(v, testname);
        }
      }

      if (responceValues.length === 1) {
        this.modelsSel.push(responceValues[0]);
      }

      // check default values
      if (this.DefaultBlock.has('model')) {
        for (const i of this.DefaultBlock.get('model').split('|')) {
          if (
            this.models.has(i) &&
            this.modelsSel.indexOf(i) === -1
          ) {
            this.modelsSel.push(i);
          }
        }
      }
    });
  }

  /** Operator for [Array.filter]{@link Array.filter} returning only unique items */
  private distinct(value, index, arr) {
    return arr.indexOf(value) === index;
  }

  /** Parse layout file and populate GUI elements */
  updateMenu(xml: Document | null) {
    // Empty the arrays
    this.spans.length = 0;

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
          this.showPhysListSelection = true;
          obj.isModelCanChange = true;
        }
        if (obj.type === 'ratio' && (!obj.plot.model || obj.plot.model.length === 0)) {
          this.showPhysListSelection = true;
          obj.plot.isModelCanChange = true;
          obj.reference.isModelCanChange = true;
        }

        plotsLast.push(obj);

        if (obj.type === 'plot') {
          this.filltests(obj);
        }

        if (obj.type === 'ratio') {
          this.filltests(obj.plot);
          this.filltests(obj.reference);
        }
      }
    }

    this.tests = this.tests.filter(this.distinct);

    this.waitForTest().then(() => {
      for (const testname of this.tests) {
        this.getVersionsByTest(testname);
        if (this.showPhysListSelection) {
          this.getModelsByTest(testname);
        }
      }
      this.plots = plots;
    });

    // Calculates per-row sum of colspans in a layout
    for (const row of plots) {
      this.spans.push(row.map((e) => e.colspan).reduce((a, b) => isNaN(b) ? a - -1 : (a - -b), 0));
    }
    this.plots = plots;
  }

  /** Ununsed? */
  uniqueTags(list: Array<any>) {
    return list.map(t => t[2]).reduce((p, c) => p.concat(c), []).filter(this.distinct);
  }

  /** Event handler for tag filter */
  checkTag(tag: string) {
    if (this.checkedTags.has(tag)) {
      this.checkedTags.delete(tag);
    } else {
      this.checkedTags.add(tag);
    }
  }

  /** Model -> View binding for tag filter */
  isTagChecked(tag: string) {
    return this.checkedTags.has(tag);
  }

  /** Model <-> View binding to filter layouts based on tags */
  isLayoutShown(tags: Array<string>): boolean {
    if (this.checkedTags.size !== 0) {
      for (const tag of tags) {
        if (this.checkedTags.has(tag)) {
          return true;
        }

        return false;
      }
    } else {
      return true;
    }
  }

  /** Event handler: layout selected */
  onSelectLayout() {
    // console.log(this.selectedLayout);
    this.downloadLayout(this.selectedLayout).subscribe((results) => {
      this.models = new Map<string, string>();
      this.modelsTests = new Map<string, string>();
      this.modelsSel = [];
      this.versions = new Map<number, string>();
      this.versionsSel = [];
      this.availableExpDataforTest = [];
      this.updateMenu(results);
      this.loadComplete = true;
    });
  }

  /** Controls if 'Plot' button is disabled */
  cantPlot() {
    if (this.selectedLayout === '' || this.selectedLayout === undefined) {
      // console.log('Can\'t plot: no layout selected');
      return true;
    }

    if (this.versionsSel.length === 0 && this.versions.size !== 0) {
      // console.log('Can\'t plot: no versions selected');
      return true;
    }

    if (this.modelsSel.length === 0) {
      // console.log('Can\'t plot: no models selected');
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
    const ncols = Math.max(...plots.map(e => e.length));
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
    this.plotList.forEach((aplot) => {
      aplot.resizeImage(this.getImageSize());
      aplot.versionId = this.versionsSel;
      aplot.config.model = this.modelsSel.join('|');
      const test = this.TESTMAP.get(aplot.config.test);
      if (test === undefined) {
        console.log(`Test ${aplot.config.test} not found!`);
        return;
      }
      aplot.testId = test.test_id;
      aplot.status = '';
      aplot.draw();
    });
    this.sidenav.close();
  }

  /** WIP: called when removing a [chip]{@link MatChip} containing a version is removed */
  removeV(vs: number) {
    if (this.versionsSel.indexOf(vs) !== -1) {
      this.versionsSel.splice(this.versionsSel.indexOf(vs), 1);
    }
  }
}
