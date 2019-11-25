import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { GVPAPIService } from '../services/gvpapi.service';
import { GvpPngRequest } from '../classes/gvp-plot';
import { Observable } from 'rxjs';

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

  constructor(private api: GVPAPIService) {
  }

  ngOnInit() {
    if (this.configObs) {
      this.configObs.subscribe(e => {
        console.log("config");
        console.log(e);
        if (e) this.doStuff(e);
      });

    }
  }

  doStuff(config: GvpPngRequest): void {
    this.inProgress = true;
    // TODO.
    this.api.getPNG(config).subscribe(res => {
      this.status = res.status;
      this.url = res.filename;
      this.inProgress = false;
    })
  }
  /*
    draw_old() {
      this.service.getPlot_old(this.config, this.testId, this.versionId, this.useMarkers).subscribe(
        (res) => {this.filename = environment.APIEndpoint + res.filename;
                  this.status = res.status; });
    }
  
    draw() {
      const allObservables = new Array<Observable<GvpPlotData[]>>();
      if (this.config.testName === 'experiment') {
        this.versionId = [-1];
      }
  
      const plots: GvpPlot[] = (this.config.type === 'plot') ? [this.config] : [this.config, this.config.reference];
      if (this.config.type === 'ratio') {
        for (const k in this.config) {
          if (k === 'reference') {
            continue;
          }
          if (this.config.reference.test === 'experiment' && ['test', 'model'].indexOf(k) !== -1) { continue; }
          if (!this.config.reference[k]) {
            this.config.reference[k] = this.config[k];
          }
        }
        if (this.config.reference.test === 'experiment') { this.config.reference.model = 'experiment'; }
      }
  
      // console.log(this.versionId);
      for (const p of plots) {
        p.model = this.model;
        if (p.test === 'experiment') {
          console.log('p.test', p.test);
          continue;
        }
        allObservables.push(this.service.getPlotData(p, this.testId, this.versionId));
      }
  
      if (this.config.type === 'plot') {
        const configExp = {... this.config};
        configExp.model = 'experiment';
        const obs = this.service.getPlotData(configExp, EXPERIMENT_TEST_ID, [EXPERIMENT_VERSION_ID]).pipe(
          concatMap((data) => [data.filter((d) => this.expData.indexOf(d.article.inspireId) !== -1)])
        );
        allObservables.push(obs);
      }
  
      forkJoin(allObservables).pipe(
        // tap((data) => console.log('Before concatMap', data)),
        concatMap((data) => {
          // console.log('In', data);
          // JS way of flattening array of arrays to an array
          let res = data.reduce((acc, val) => acc.concat(val), []);
          // console.log('After reduce', res);
          let pl = this.config;
          if (pl.type === 'ratio') {
            pl = this.config.reference;
          }
          res = res.filter((e) => e !== null);
          res = res.filter((elem) => elem.metadata.beam_energy_str === pl.beam_energy);
          if (pl.parname && pl.parvalue) {
            res = res.filter(e => {
              const pnames = pl.parname.trim().split(',');
              const pvalues = pl.parvalue.trim().split(',');
              if (pnames.length !== pvalues.length) { return false; }
              for (const i of e.metadata.parameters) {
                if (pnames.indexOf(i.names) !== -1 && i.values !== pvalues[pnames.indexOf(i.names)]) {
                  return false;
                }
              }
              return true;
            });
          }
          if (res.length === 0) {
            return of({filename: '', status: 'error' });
          }
          return this.service.getPlot(this.config, res, this.useMarkers);
          // return [res];
        })
      ).subscribe((res: any) => {
        this.filename = environment.APIEndpoint + res.filename;
        this.status = res.status;  });
  
    }
  
    resizeImage(newSize) {
      this.plotHeight = newSize.height;
      this.plotWidth = newSize.width;
    }
    */
}
