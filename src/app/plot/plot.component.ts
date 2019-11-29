import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { GVPAPIService } from '../services/gvpapi.service';
import { GvpPngRequest, GvpJSON, GvpPlot, GvpParameter } from '../classes/gvp-plot';
import { Observable } from 'rxjs';

declare var JSROOT: any;

interface HintData {
  observable: string,
  beam: string,
  target: string,
  beam_energy: string,
  items: {
    version: string,
    model: string,
    parameters: GvpParameter[],
  }[]
}

/**
 * Container for a single plot. WIP.
 */
@Component({
  selector: 'app-plot',
  templateUrl: './plot.component.html',
  styleUrls: ['./plot.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlotComponent implements OnInit {

  @Input() configObs: Observable<GvpPngRequest> = null;
  url: string = "";
  status = false;
  inProgress = false;
  showHint = false;
  modalShow = false;
  modalRoot = true;
  config: GvpPngRequest = null;
  private hintData: HintData = null;
  private mousePos: { x: number, y: number } = { x: 0, y: 0 };

  constructor(private api: GVPAPIService) {
  }

  ngOnInit() {
    if (this.configObs) {
      this.configObs.subscribe(e => {

        if (e && e.data.length !== 0) {
          this.doStuff(e);
          this.config = e;
          this.hintData = this.setHintData(e.data);
        }
      });

    }
  }

  doStuff(config: GvpPngRequest): void {
    this.inProgress = true;
    // TODO.
    this.api.getPNG(config).subscribe(res => {
      if (res.status) {
        this.status = res.status;
        this.url = res.filename;
      };
      this.inProgress = !res.status;
    })
  }

  hint(mouse: MouseEvent) {
    // check CSS for block width and height!!!
    this.showHint = true;
    const wsize = this.getWindowSize();
    const left =
      mouse.clientX < wsize.width / 2 ? mouse.offsetX + 35 : mouse.offsetX - 400 - 15 + 5 * 2;
    const top =
      mouse.clientY <= wsize.height / 2 ? mouse.offsetY + 35 : mouse.offsetY - 150 - 15 - 5 * 2;
    this.mousePos.x = left;
    this.mousePos.y = top;
  }

  hideHint() {
    this.showHint = false;
  }

  getMousePos(): { x: string, y: string } {
    return {
      x: `${this.mousePos.x}px`,
      y: `${this.mousePos.y}px`
    }
  }

  private setHintData(p: GvpJSON[]): HintData {
    const r: HintData = {
      observable: p[0].metadata.observableName,
      beam: p[0].metadata.beamParticle,
      target: p[0].metadata.targetName,
      beam_energy: p[0].metadata.beam_energy_str,
      items: p.map(e => {
        return {
          version: e.mctool.version,
          model: e.mctool.model,
          parameters: e.metadata.parameters
        }
      })
    }
    return r;
  }

  getHintData(): HintData {
    return this.hintData;
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

  private getWindowSize() {
    const w = window;
    const d = document;
    const e = d.documentElement;
    const g = d.getElementsByTagName('body')[0];
    return {
      width: w.innerWidth || e.clientWidth || g.clientWidth,
      height: w.innerHeight || e.clientHeight || g.clientHeight
    };
  }
}
