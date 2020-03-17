import { Component, OnInit } from '@angular/core';
import { GVPAPIService } from '../services/gvpapi.service';
import { GvpTest } from '../classes/gvp-plot';

@Component({
  selector: 'app-stat-test-list',
  templateUrl: './stat-test-list.component.html',
  styleUrls: ['./stat-test-list.component.css']
})
export class StatTestListComponent implements OnInit {

  public tests: GvpTest[] = [];
  constructor(private api: GVPAPIService) { }

  ngOnInit() {
    this.api.test().subscribe(tests => this.tests = tests.filter(e => e.test_name !== "experiment"));

  }
}
