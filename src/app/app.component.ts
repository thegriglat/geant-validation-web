import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.Default
})

export class AppComponent implements OnInit {
  title = 'GVP layout viewer';

  constructor() {
  }

  ngOnInit() {
  }

  isMenuHeaderVisible(): boolean {
    return (window.location.pathname === '/') ? false: true;
  }
}
