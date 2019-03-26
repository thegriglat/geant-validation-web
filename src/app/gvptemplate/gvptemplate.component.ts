import { Component, OnInit, ViewChildren, QueryList } from '@angular/core';
import { TemplateService } from '../template.service';
import { Observable } from 'rxjs';
import { GvpPlot } from '../gvp-plot';
import { PlotComponent } from '../plot/plot.component';


@Component({
  selector: 'app-gvptemplate',
  templateUrl: './gvptemplate.component.html',
  styleUrls: ['./gvptemplate.component.css']
})
export class GvptemplateComponent implements OnInit {

  plots: Array<Array<GvpPlot>>;
  spans: Array<number>;
  contents: string;
  tests: Array<string>;
  magicPressed: boolean;
  loadComplete: boolean;

  DefaultBlock = {};

  @ViewChildren(PlotComponent) plotList: QueryList<PlotComponent>;

  constructor(private templateService: TemplateService) {
    this.tests = new Array<string>();
    this.loadComplete = false;
    this.spans = new Array<number>();
  }

  ngOnInit() {
    this.plots = null;
    this.magicPressed = false;
  }

  downloadFromGitLab(file: string): Observable<Document|null> {
    console.log('download template');
    return this.templateService.getTemplate(file);
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
      this.tests.push(o.test);
    }
  }

  updateMenu(xml: Document | null) {
    console.log('updateMenu start');
    // Empty the arrays
    // this.plots.length = 0;
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
    let tests: string[] = [];
    for (const row of rows) {
      if (row.nodeName === 'default') {
        this.readDefaultBlock(row);
        continue;
      }
      plots.push([]);
      const plotsLast = plots[plots.length - 1];
      // console.log(plotsLast);
      for (const j of Array.from(row.children)) {

        const obj: GvpPlot = this.convertXMLPlot2Object(j) as GvpPlot;
        if (obj.type === 'plot' && (!obj.model || obj.model.length === 0)) {
          // th.showPhysListSelection = true;
          obj.isModelCanChange = true;
        }
        if (obj.type === 'ratio' && (!obj.plot.model || obj.plot.model.length === 0)) {
          // th.showPhysListSelection = true;
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

    const distinct = (value, index, self) => {
      return self.indexOf(value) === index;
    };

    tests = tests.filter(distinct);
    console.log(plots);
    // TODO: do this
    /*
    waitForTest().then(() => {
      for (const testname of tests) {
        getVersionsByTest(testname);
        if (th.showPhysListSelection) {
          getModelsByTest(testname);
        }
      }
      this.plots = plots;
    });
*/
    for (const row of plots) {
      this.spans.push(row.map((e) => e.colspan).reduce((a, b) => isNaN(b) ? a - -1 : (a - -b), 0));
    }
    this.plots = plots;
    console.log('updateMenu end');
  }

  public onLoad() {
    console.log('onLoad start');
    this.downloadFromGitLab('AttenuationTest.xml').subscribe((results) => {this.updateMenu(results);
                                                                           console.log('onLoad end');
                                                                           this.loadComplete = true; });
  }

  magic() {
    this.plotList.forEach((aplot) => aplot.draw());
  }
}
