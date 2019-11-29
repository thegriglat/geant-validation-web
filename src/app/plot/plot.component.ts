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
  private hintData: HintData = null;
  private mousePos: { x: number, y: number } = { x: 0, y: 0 };

  constructor(private api: GVPAPIService) {
  }

  ngOnInit() {
    if (this.configObs) {
      this.configObs.subscribe(e => {

        if (e && e.data.length !== 0) {
          this.doStuff(e);
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

  hint(event: MouseEvent) {
    this.showHint = true;
    this.mousePos.x = event.offsetX;// + 100;
    this.mousePos.y = event.offsetY;// + 15;
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
    let h, w;
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
