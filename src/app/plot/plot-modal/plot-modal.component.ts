import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { GvpPngRequest, GvpJSON } from 'src/app/classes/gvp-plot';
import { GVPAPIService } from 'src/app/services/gvpapi.service';
import { from, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { SuiModal, ComponentModalConfig, ModalSize } from 'ng2-semantic-ui';

declare var JSROOT: any;

interface IConfirmModalContext {
  url: string;
  config: GvpPngRequest;
}

export class PlotModal extends ComponentModalConfig<IConfirmModalContext, void, void> {
  constructor(url: string, config: GvpPngRequest, size = ModalSize.Small) {
    super(PlotModalComponent, { url, config });
    this.isFullScreen = true;
    this.isClosable = true;
    this.transitionDuration = 200;
    this.size = size;
    this.isInverted = true;
    this.isBasic = true;
  }
}


@Component({
  selector: 'app-plot-modal',
  templateUrl: './plot-modal.component.html',
  styleUrls: ['./plot-modal.component.css']
})
export class PlotModalComponent implements OnInit {

  url: string = "";
  config: GvpPngRequest;
  modalRoot = true;

  selectedRef: GvpJSON = null;
  inProgress = false;
  useMarkers = true;
  private _names = new Map<GvpJSON, string>();

  constructor(public modal: SuiModal<IConfirmModalContext, void, void>, private api: GVPAPIService) {
    this.config = Object.assign({}, modal.context.config);
    this.url = modal.context.url;
  }

  ngOnInit() {
    if (this.config.markerSize !== undefined)
      this.useMarkers = (this.config.markerSize === 0) ? false : true;
    if (this.config.refid !== undefined)
      this.selectedRef = this.config.data[this.config.refid];
    // fill _names
    forkJoin(
      this.config.data.map(j => this._getName(j).pipe(
        map(e => {
          return { json: j, name: e };
        })
      ))
    ).subscribe(list => {
      for (const e of list)
        this._names.set(e.json, e.name);
    })
  }

  getName(p: GvpJSON) {
    return (this._names.has(p)) ? this._names.get(p) : "exp. data";
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
    this.config.markerSize = (this.useMarkers) ? 1 : 0;
    this.modalRoot = true;
    this.selectedRef = p;
    this.inProgress = true;
    this.api.getPNG(this.config).subscribe(e => {
      if (e.status) {
        this.url = e.filename;
        this.inProgress = false;
      }
    })
  }

  private _getName(p: GvpJSON) {
    if (p.mctool.model !== "experiment")
      return from([`${p.mctool.version} ${p.mctool.model}`]);
    return this.api.inspireById(p.article.inspireId).pipe(
      map(e => (e.expname) ? e.expname : "exp. data")
    )
  }
}
