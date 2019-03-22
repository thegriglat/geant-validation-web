import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.Default
})

export class AppComponent implements OnInit {
  title = 'GVP template viewer';
  // rows = 2;
  // columns = 3;
  // plots = null;

  // build() {
  //   this.plots = Array<any>(this.rows);
  //   for (let i = 0; i < this.rows; i++) {
  //     this.plots[i] = Array<string>(this.columns);
  //   }
  // }

  constructor() {
  }

  ngOnInit() {
    // this.build();
  }

  // onInputRow(event: any) {
    // this.rows = parseInt(event.target.value, 10);
    // this.build();
  // }

  // onInputColumn(event: any) {
    // this.columns = parseInt(event.target.value, 10);
    // this.build();
  // }

}
