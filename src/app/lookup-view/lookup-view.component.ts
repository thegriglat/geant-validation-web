import { Component, OnInit } from '@angular/core';
import { Nullable, GvpTest, GvpMctoolNameVersion, GvpMctoolName, GvpObservable, GvpModel, GvpParticle, GvpTarget } from '../classes/gvp-plot';
import { GVPAPIService } from '../services/gvpapi.service';
import { forkJoin, Observable } from 'rxjs';

interface Table {
  name: string;
  getter: Observable<any[]>,
  mapper: { (e: any): string };
};

@Component({
  selector: 'app-lookup-view',
  templateUrl: './lookup-view.component.html',
  styleUrls: ['./lookup-view.component.css']
})
export class LookupViewComponent implements OnInit {

  currentTable: Nullable<Table> = null;
  _tables: Table[] = [
    {
      name: "Observable",
      getter: this.api.observable(),
      mapper: function (e: GvpObservable) { return e.observable_name; }
    },
    {
      name: "Physics model",
      getter: this.api.model(),
      mapper: function (e: GvpModel) { return e.mctool_model_name; }
    },
    {
      name: "Version",
      getter: this.api.mctool_name_version(),
      mapper: function (e: GvpMctoolNameVersion) { return e.version; }
    },
    {
      name: "Particle",
      getter: this.api.particle(),
      mapper: function (e: GvpParticle) { return e.particle_name; }
    },
    {
      name: "Tool",
      getter: this.api.mctool_name(),
      mapper: function (e: GvpMctoolName) { return e.mctool_name_name; }
    },
    {
      name: "Test",
      getter: this.api.test(),
      mapper: function (e: GvpTest) { return e.test_name; }
    },
    {
      name: "Target",
      getter: this.api.target(),
      mapper: function (e: GvpTarget) { return e.target_name; }
    }
    // parameters
    // beam energy
  ];
  tableData: string[] = [];
  _tests: GvpTest[] = [];
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

}
