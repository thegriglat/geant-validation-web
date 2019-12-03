import { Component, OnInit } from '@angular/core';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';

@Component({
  selector: 'app-menu-header',
  templateUrl: './menu-header.component.html',
  styleUrls: ['./menu-header.component.css']
})
export class MenuHeaderComponent implements OnInit {

  menuShown = false;
  constructor() { }

  ngOnInit() {
  }


  showMenu(){
    this.menuShown = !this.menuShown;
  }
}
