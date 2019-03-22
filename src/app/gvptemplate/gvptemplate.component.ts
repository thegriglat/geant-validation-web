import { Component, OnInit } from '@angular/core';
import { TemplateService } from '../template.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-gvptemplate',
  templateUrl: './gvptemplate.component.html',
  styleUrls: ['./gvptemplate.component.css']
})
export class GvptemplateComponent implements OnInit {

  plots: Array<Array<string>>;
  contents: string;

  DefaultBlock = {};

  constructor(private templateService: TemplateService) { }

  ngOnInit() {
    this.plots = null;
  }

  downloadFromGitLab(file: string): Observable<Document|null> {
    console.log('download start');
    return this.templateService.getTemplate(file);
    console.log('download end');
  }

  readDefaultBlock(node: Element) {
    for (const i of Array.from(node.attributes)) {
      this.DefaultBlock[i.name] = i.value;
    }
  }

  convertXMLPlot2Object(plot: Element) {
    let obj;
    if (plot.nodeName === 'plot') {
      obj = {
        type: 'plot',
        isModelCanChange: false,
        empty: true
      };
      for (const i of Array.from(plot.attributes)) {
        obj[i.name] = i.value;
        obj.empty = false;
      }
      if (!obj.hasOwnProperty('colspan')) {
        obj.colspan = 1;
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
      };
    }
    if (plot.nodeName === 'label') {
      obj = {
        type: 'text',
        empty: true
      };
      for (const i of Array.from(plot.attributes)) {
        obj[i.name] = i.value;
        obj.empty = false;
      }
    }
    return obj;
  }

  updateMenu(xml: Document | null) {
    console.log('updateMenu start');
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
    const plots = [];
    let tests: string[] = [];
    for (const row of rows) {
      if (row.nodeName === 'default') {
        this.readDefaultBlock(row);
        continue;
      }
      plots.push([]);
      const plotsLast = plots[plots.length - 1];
      console.log(plotsLast);
      for (const j of Array.from(row.children)) {

        const obj = this.convertXMLPlot2Object(j);
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
        const filltests = o => {
          if (o.type === 'plot' && o.test) {
            tests.push(o.test);
          }
        };

        if (obj.type === 'plot') {
          filltests(obj);
        }

        if (obj.type === 'ratio') {
          filltests(obj.plot);
          filltests(obj.reference);
        }
      }
    }

    const distinct = (value, index, self) => {
      return self.indexOf(value) === index;
    };

    tests = tests.filter(distinct);
    console.log(plots);
    this.plots = plots;
    console.log('updateMenu end');
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
  }

  public onLoad() {
    console.log('onLoad start');
    this.downloadFromGitLab('AttenuationTest.xml').subscribe(results => this.updateMenu(results));
    console.log('onLoad end');
  }

  magic() {

  }
}
