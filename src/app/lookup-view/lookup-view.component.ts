import { Component, OnInit } from '@angular/core';
import { Nullable, GvpTest, GvpMctoolNameVersion, GvpMctoolName, GvpObservable, GvpModel, GvpParticle, GvpTarget } from '../classes/gvp-plot';
import { GVPAPIService } from '../services/gvpapi.service';
import { Observable } from 'rxjs';
import { _versionSorterComparator } from '../utils';

interface Table {
  name: string;
  getter: Observable<any[]>,
  mapper: { (e: any): string },
  sorter: { (a: string, b: string): number }
};

const defaultStrSortFn = (a: string, b: string) => {
  if (a === b) return 0;
  return a.localeCompare(b);
}

@Component({
  selector: 'app-lookup-view',
  templateUrl: './lookup-view.component.html',
  styleUrls: ['./lookup-view.component.css']
})
export class LookupViewComponent implements OnInit {

  currentTable: Nullable<Table> = null;
  _tables: Table[] = [
    {
      name: "Tool",
      getter: this.api.mctool_name(),
      mapper: function (e: GvpMctoolName) { return e.mctool_name_name; },
      sorter: defaultStrSortFn
    },
    {
      name: "Test",
      getter: this.api.test(),
      mapper: function (e: GvpTest) { return e.test_name; },
      sorter: defaultStrSortFn
    },
    {
      name: "Observable",
      getter: this.api.observable(),
      mapper: function (e: GvpObservable) { return e.observable_name; },
      sorter: defaultStrSortFn
    },
    {
      name: "Physics model",
      getter: this.api.model(),
      mapper: function (e: GvpModel) { return e.mctool_model_name; },
      sorter: defaultStrSortFn
    },
    {
      name: "Version",
      getter: this.api.mctool_name_version(),
      mapper: function (e: GvpMctoolNameVersion) { return e.version; },
      sorter: (a: string, b: string) => _versionSorterComparator(a, b) * -1
    },
    {
      name: "Target",
      getter: this.api.target(),
      mapper: function (e: GvpTarget) { return e.target_name; },
      sorter: defaultStrSortFn
    },
    {
      name: "Particle",
      getter: this.api.particle(),
      mapper: function (e: GvpParticle) { return e.particle_name; },
      sorter: defaultStrSortFn
    }
    // parameters
    // beam energy
  ];
  tableData: string[] = [];
  _tests: GvpTest[] = [];
  filterStr: string = "";
  constructor(private api: GVPAPIService) { }

  ngOnInit() {
    this.api.test().subscribe(t => {
      this._tests = t;
    })
  }

  tableFormatter(item: Table, query?: string): string {
    return item.name;
  }

  onTableChange(table: Table) {
    // maybe not necessary
    this.currentTable = table;
    this.tableData = [];
    table.getter.subscribe(v => this.tableData = v.map(table.mapper))
  }
  isLatex(): boolean {
    return this.currentTable !== null && this.currentTable.name == "Observable";
  }

  latexize(input: string): string {
    return input.replace(new RegExp(" ", "g"), " \\space ");
  }

  filter(inp: string[]): string[] {
    if (this.filterStr.length != 0) {
      const rgx = new RegExp(this.filterStr, "i");
      return inp.filter(e => e.match(rgx));
    }
    return inp;
  }

  sort(data: string[]): string[] {
    if (!this.currentTable) return data;
    return data.sort(this.currentTable.sorter);

  }

  setFilter(f: string) {
    this.filterStr = f;
  }
}
