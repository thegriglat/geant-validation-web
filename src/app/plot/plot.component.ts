import { Component, OnInit, Input, ChangeDetectionStrategy, Output, EventEmitter } from '@angular/core';
import { GVPAPIService } from '../services/gvpapi.service';
import { GvpPngRequest, GvpJSON, GvpParameter, Nullable } from '../classes/gvp-plot';
import { Observable, from, forkJoin } from 'rxjs';
import { map, filter, tap, flatMap } from 'rxjs/operators';
import { SuiModalService } from '@richardlt/ng2-semantic-ui';
import { PlotModal } from './plot-modal/plot-modal.component';
import { RatioDiffEstimator } from './ratiofunctions';

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

export type PlotEmitType = {
  ratiodiff: number,
  plotData: Nullable<HintData>
};

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
  @Input() popupEnable = true;
  @Output() done = new EventEmitter<PlotEmitType>();
  url: string = "";
  status = false;
  inProgress = false;
  modalRoot = true;
  ratiodiff: number = 0;
  config: Nullable<GvpPngRequest> = null;
  private hintData: Nullable<HintData> = null;

  constructor(private api: GVPAPIService, private modalService: SuiModalService) {
  }

  ngOnInit() {
    this.inProgress = true;
    let dowork = this.configObs.pipe(
      filter(config => config && config.data.length !== 0),
      tap(config => {
        this.config = config;
      }),
      flatMap(config => {
        return this.doStuff(config);
      }),
      flatMap(config => {
        return this.setHintData(config.data);
      }),
      map(hint => {
        this.hintData = hint;
      })
    );
    dowork.subscribe();
  }

  doStuff(config: GvpPngRequest) {
    // TODO.
    return this.api.getPNG(config).pipe(
      map(res => {
        if (res.status) {
          this.status = res.status;
          this.url = res.filename;
          let emit_v: PlotEmitType = {
            ratiodiff: 0.,
            plotData: this.hintData
          };
          if (this.isRatioPlot()) {
            emit_v.ratiodiff = this.ratioDiff()
            this.ratiodiff = emit_v.ratiodiff;
          };
          this.done.emit(emit_v);
        };
        this.inProgress = !res.status;
        return config;
      }));
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

  getHintData(): HintData {
    if (this.hintData) return this.hintData;
    throw new TypeError("HintData is null");
  }

  showModal(config: GvpPngRequest) {
    this.modalService.open(
      new PlotModal(config)
    )
  }

  isRatioPlot(): boolean {
    if (!this.config) return false;
    return this.config.refid !== null && this.config.refid !== undefined;
  }

  ratioDiff(): number {
    // possibility to change estimator further
    const estimator = RatioDiffEstimator;
    if (!this.config || this.config.refid === undefined || this.config.refid === undefined) return 0;
    const refid = this.config.refid;
    const baseplot = this.config.data[Math.abs(refid - 1)];
    const refplot = this.config.data[refid];
    if (!baseplot || !refplot) return 0;
    return estimator.fn(baseplot, refplot);
  }
}
