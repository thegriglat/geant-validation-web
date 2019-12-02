import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { GvpPngRequest, GvpJSON } from 'src/app/classes/gvp-plot';
import { GVPAPIService } from 'src/app/services/gvpapi.service';

declare var JSROOT: any;

@Component({
  selector: 'app-plot-modal',
  templateUrl: './plot-modal.component.html',
  styleUrls: ['./plot-modal.component.css']
})
export class PlotModalComponent implements OnInit {

  @Input() url: string;
  @Input() config: GvpPngRequest;
  @Output() out = new EventEmitter<boolean>();
  modalRoot = true;

  selectedRef: GvpJSON = null;

  constructor(private api: GVPAPIService) { }

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

  selectRef(p: GvpJSON) {
    this.config.refid = this.config.data.indexOf(p);
    this.modalRoot = true;
    this.selectedRef = p;
    this.api.getPNG(this.config).subscribe(e => {
      if (e.status) {
        this.url = e.filename;
      }
    })
  }

  getName(p: GvpJSON): string {
    return `${p.mctool.version} ${p.mctool.model}`;
  }
}
