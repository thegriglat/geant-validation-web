import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PlotService } from './plot.service';
import { GvpPlotXML, GvpPlotData, GvpPngRequest } from './gvp-plot';
import { concatMap, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StaticplotService extends PlotService {

  constructor(http: HttpClient) {
    super(http);
  }

  private prepareRequest(config: GvpPlotXML, data: GvpPlotData[]): GvpPngRequest {
    const obj = new GvpPngRequest();
    // console.log('PrepareRequest: ', data, 'energy', config.energy);
    obj.data = data.filter((p) => p.metadata.beam_energy_str === config.energy);
    obj.xaxis = config.xaxis;
    obj.yaxis = config.yaxis;
    obj.xmin = config.xmin;
    obj.xmax = config.xmax;
    obj.ymin = config.ymin;
    obj.ymax = config.ymax;
    // TODO
    // obj.refid = '';
    // obj.onlyratio = undefined;
    // obj.markersize = 1;
    return obj;
  }

  public getPlot(config: GvpPlotXML, testId: number, versionId: number[]): Observable<any> {
    return super.getPlotData(config, testId, versionId).pipe(
      // tap((data) => console.log('getPlotData returned', data)),
      concatMap((data) => { const req = this.prepareRequest(config, data);
                            // console.log('prepareRequest returned', req);
                            return this.post('api/getPNG', req); }
      )
    );
  }
}
