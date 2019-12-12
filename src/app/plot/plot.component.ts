import { Component, OnInit, Input, ChangeDetectionStrategy, Output, EventEmitter } from '@angular/core';
import { GVPAPIService } from '../services/gvpapi.service';
import { GvpPngRequest, GvpJSON, GvpParameter, Nullable } from '../classes/gvp-plot';
import { Observable, from, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { SuiModalService } from 'ng2-semantic-ui';
import { PlotModal } from './plot-modal/plot-modal.component';

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
  selector: 'app-plot[configObs]',
  templateUrl: './plot.component.html',
  styleUrls: ['./plot.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlotComponent implements OnInit {

  @Input() configObs!: Observable<GvpPngRequest>;
  @Output() done = new EventEmitter<boolean>();
  url: string = "";
  status = false;
  inProgress = false;
  modalRoot = true;
  config: Nullable<GvpPngRequest> = null;
  hintData: Nullable<HintData> = null;

  constructor(private api: GVPAPIService, private modalService: SuiModalService) {
  }

  ngOnInit() {
    this.configObs.subscribe(e => {
      if (e && e.data.length !== 0) {
        this.config = e;
        this.doStuff(e);
        this.setHintData(e.data).subscribe(e => {
          this.hintData = e;
        });
      }
    });

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
          expname: ""
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

  showModal(url: string, config: GvpPngRequest) {
    console.log([url, config]);
    this.modalService.open(
      new PlotModal(url, config)
    )
  }
}
