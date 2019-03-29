import { Component, OnInit, ViewChildren, QueryList, ViewChild } from '@angular/core';
import { LayoutService } from '../layout.service';
import { Observable } from 'rxjs';
import { GvpPlot, GvpTest, GvpTestRequest, GvpExpData, GvpUniq, GvpMctoolNameVersion, GvpMctoolName } from '../gvp-plot';
import { PlotComponent } from '../plot/plot.component';
import { GVPAPIService } from '../gvpapi.service';
import { MatSidenav } from '@angular/material';


@Component({
  selector: 'app-gvplayout',
  templateUrl: './gvplayout.component.html',
  styleUrls: ['./gvplayout.component.css']
})
export class GvplayoutComponent implements OnInit {

  constructor(private layoutService: LayoutService, private api: GVPAPIService) {
  }

  // Bindings
  versionDropDowns = [
    {
      name: 'Version',
      JSONAttr: 'mctool.version',
      table: 'mctool_name_version',
      onplot: 'mctool_name_version_id',
      ontable: 'mctool_name_version_id',
      namefield: 'mctool_name_version_id',
      values: [],
      valSel: [],
      maxSel: 999
    }
  ];

  modelDropDowns = {
    name: 'Physics List/Model',
    JSONAttr: 'mctool.version',
    values: [],
    valSel: [],
    tests: [],
    maxSel: 999
  };

  selected = '';
  pTemplates = new Array();

  // Components
  @ViewChildren(PlotComponent) plotList: QueryList<PlotComponent>;
  @ViewChild(MatSidenav) sidenav: MatSidenav;

  // Internal variables
  plots =  new Array<Array<GvpPlot>>();
  spans = new Array<number>();
  contents = '';
  tests = new Array<string>();
  magicPressed = false;
  loadComplete = false;
  opened = true;
  DefaultBlock = {};
  ALLTESTS = new Array<GvpTest>();
  showPhysListSelection = false;
  TESTMAP = new Map<string, GvpTest>();
  testObject: GvpTestRequest;
  selectedItem: GvpTest;
  availableExpDataforTest = new Array<GvpExpData>();
  getMCToolNameVersionCache = {};
  getMCToolNameCache = {};
  versionHumanName = {};
  releaseDate = {};

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
    this.api.get<GvpMctoolNameVersion[]>('api/mctool_name_version', {}).subscribe(response => {
      for (const elem of response) {
        this.getMCToolNameVersionCache[elem.mctool_name_version_id] = {
          version: elem.version,
          mctool_name_id: elem.mctool_name_id,
          release_date: elem.release_date
        };
      }
    });
    this.api.get<GvpMctoolName[]>('api/mctool_name', {}).subscribe(response => {
      for (const elem of response) {
        this.getMCToolNameCache[elem.mctool_name_id] = elem.mctool_name_name;
      }
    });
  }

  downloadLayout(file: string): Observable<Document|null> {
    console.log(`download layout ${file}`);
    return this.layoutService.getLayout(file);
  }

  readDefaultBlock(node: Element) {
    for (const i of Array.from(node.attributes)) {
      this.DefaultBlock[i.name] = i.value;
    }
  }

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
    }
    return obj;
  }

  private filltests(o: GvpPlot) {
    if (o.type === 'plot' && o.test) {
      console.log('filltest', o.test);
      this.tests.push(o.test);
      console.log('tests3', this.tests);
    }
  }

  private waitForTest(): Promise<any> {
    this.ALLTESTS.length = 0;
    return new Promise((resolve) => {
      this.api.get<GvpTest[]>('api/test', {}).subscribe(data => {
          this.ALLTESTS = data.filter(elem => elem.test_name !== 'experiment');
          resolve();
        });
    });
  }

  private updateExpDescription(testId: number) {
    this.api.get<GvpExpData[]>('api/getexperimentsinspirefortest', {test_id: testId}).subscribe((result) => {
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

  private getMCToolNameVersion(mctoolNameId: number) {
    return this.getMCToolNameVersionCache[mctoolNameId];
  }

  private getMCToolName(mctoolNameId: number) {
    return this.getMCToolNameCache[mctoolNameId];
  }

  private getVersionsByTest(testname: string) {
    this.magicPressed = false;
    this.selected = '1';
    const testlist = this.ALLTESTS.filter(ele => ele.test_name === testname);
    if (testlist.length === 0) {
      return;
    }

    const test = testlist[0];
    this.TESTMAP[testname] = test;

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

    const elem = this.versionDropDowns[0];
    const config = {
        test_id: test.test_id,
        table: elem.table,
        onplot: elem.onplot,
        ontable: elem.ontable,
        namefield: elem.namefield,
        JSONAttr: elem.JSONAttr
    };
    this.api.get<GvpUniq>('api/uniqlookup', config).subscribe((response) => {
      for (const i of response.values) {
        if (this.versionDropDowns[0].values.indexOf(i) === -1) {
          this.versionDropDowns[0].values.push(i);
        }
      }
      this.versionDropDowns[0].values.sort();
      for (const i of this.versionDropDowns[0].values) {
        const result = this.getMCToolNameVersion(i);
        const version = result.version;
        const mctoolNameId = result.mctool_name_id;
        const mctoolNameVersionId = i;
        const release_date = result.release_date;
        const name = this.getMCToolName(mctoolNameId);
        this.versionHumanName[mctoolNameVersionId] = `${name}: ${version}`;
        this.releaseDate[mctoolNameVersionId] = release_date;
      }
      if (this.versionDropDowns[0].values.length === 1) {
        this.versionDropDowns[0].valSel = this.versionDropDowns[0].values.slice();
      }
    });
    console.log(this.versionDropDowns[0]);
}

getModelsByTest(testname: string) {
/*
    const testlist = th.ALLTESTS.filter(elem => elem.test_name === testname);
    if (testlist.length === 0) return;
    const test = testlist[0];
    const config = {
      params: {
        test_id: test.test_id,
        JSONAttr: 'mctool.model'
      }
    };
    $http.get('/api/uniqlookup', config).success(response => {
      const responce_values = response.values.slice();
      responce_values.sort();
      for (const v of responce_values) {
        if (th.modelDropDowns.values.indexOf(v) === -1) {
          th.modelDropDowns.values.push(v);
          th.modelDropDowns.tests.push(testname);
        }
      }
      if (responce_values.length === 1) {
        th.modelDropDowns.valSel.push(responce_values[0]);
      }
      // check default values
      if (default_block.hasOwnProperty('model')) {
        for (const i of default_block.model.split('|')) {
          if (
            th.modelDropDowns.values.indexOf(i) !== -1 &&
            th.modelDropDowns.valSel.indexOf(i) === -1
          ) {
            th.modelDropDowns.valSel.push(i);
          }
        }
      }
    });
*/
  }

  updateMenu(xml: Document | null) {
    console.log('updateMenu start');
    // Empty the arrays
    this.spans.length = 0;

    if (xml === null) {
      console.log('xml is null');
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

    const distinct = (value, index, arr) => {
      console.log(`value ${value}, index ${index}, self ${arr}`);
      return arr.indexOf(value) === index;
    };

    console.log('tests1', this.tests);

    this.tests = this.tests.filter(distinct);
    // console.log(plots);

    this.waitForTest().then(() => {
      console.log('waitForTest then');
      console.log('tests', this.tests);
      for (const testname of this.tests) {
        this.getVersionsByTest(testname);
        if (this.showPhysListSelection) {
          this.getModelsByTest(testname);
        }
      }
      this.plots = plots;
    });

    for (const row of plots) {
      this.spans.push(row.map((e) => e.colspan).reduce((a, b) => isNaN(b) ? a - -1 : (a - -b), 0));
    }
    this.plots = plots;
    console.log('updateMenu end');
  }

  public onLoad() {
    console.log('onLoad start');
    this.downloadLayout('AttenuationTest.xml').subscribe((results) => {this.updateMenu(results);
                                                                       console.log('onLoad end');
                                                                       this.loadComplete = true; });
  }

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

  magic() {
    this.plotList.forEach((aplot) => {aplot.resizeImage(this.getImageSize()); aplot.draw(); });
    this.sidenav.close();
  }
}
