import { Component, OnInit, Input, ChangeDetectionStrategy, Output, EventEmitter } from '@angular/core';
import { GVPAPIService } from '../services/gvpapi.service';
import { GvpPngRequest, GvpJSON, GvpParameter } from '../classes/gvp-plot';
import { Observable, from, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

interface HintData {
  observable: string,
  beam: string,
  target: string,
  beam_energy: string,
  items: {
    inspireId: number,
    isExp: boolean,
    version: string,
    model: string,
    parameters: GvpParameter[],
    expname: string
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
  @Output() done = new EventEmitter<boolean>();
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
          this.setHintData(e.data).subscribe(e => {
            this.hintData = e;
          });
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
        this.done.emit(true);
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

  private setHintData(p: GvpJSON[]) {
    const r: HintData = {
      observable: p[0].metadata.observableName,
      beam: p[0].metadata.beamParticle,
      target: p[0].metadata.targetName,
      beam_energy: p[0].metadata.beam_energy_str,
      items: p.map(e => {
        return {
          inspireId: e.article.inspireId,
          isExp: false,
          version: e.mctool.version,
          model: e.mctool.model,
          parameters: e.metadata.parameters,
          expname: null
        }
      })
    }
    const ejsons = p.filter(e => e.mctool.model === "experiment");
    if (ejsons.length === 0) return from([r]);
    return forkJoin(ejsons.map(ej => ej.article.inspireId).map(e => this.api.inspireById(e))).pipe(
      map(elems => {
        for (const i of elems) {
          const e = r.items.filter(e => e.inspireId === i.inspire_id);
          for (let q of e) {
            q.expname = i.expname ? i.expname : "exp. data";
            q.isExp = true;
          }
        }
        return r
      })
    )
  }

  getHintData(): HintData {
    return this.hintData;
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
