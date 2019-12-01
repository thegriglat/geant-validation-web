import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { GvpPngRequest } from 'src/app/classes/gvp-plot';

declare var JSROOT: any;

@Component({
  selector: 'app-plot-modal',
  templateUrl: './plot-modal.component.html',
  styleUrls: ['./plot-modal.component.css']
})
export class PlotModalComponent implements OnInit {

  @Input() url: string = "";
  @Input() config: GvpPngRequest = null;
  @Output() out = new EventEmitter<boolean>();
  modalRoot = true;
  constructor() { }

  ngOnInit() {
  }

  emit() {
    this.out.emit(false);
  }
  switchModalRoot() {
    let h = 640, w = 480;
    // keep png image size before draw jsroot
    // so size png and jsroot's svg will be equal
    if (this.modalRoot) {
      // save height, width
      const d = document.getElementById('rootimg');
      h = d.clientHeight;
      w = d.clientWidth;
    }
    this.modalRoot = !this.modalRoot;
    if (!this.modalRoot) {
      // JSROOT paint
      const filename = `/${this.url.replace(".png", ".json")}`;
      JSROOT.NewHttpRequest(filename, 'object', obj => {
        let div = document.getElementById("jsrootimg");
        div.style.height = `${h}px`;
        div.style.width = `${w}px`;
        JSROOT.draw(div, obj, 'hist');
      }).send();
    }
  }
}
