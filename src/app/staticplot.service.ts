import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PlotService } from './plot.service';
import { GvpPlotXML, GvpPlotData, GvpPngRequest } from './gvp-plot';
import { concatMap } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StaticplotService extends PlotService {

  constructor(http: HttpClient) {
    super(http);
  }

  private prepareRequest(config: GvpPlotXML, data: GvpPlotData): GvpPngRequest {
    const obj = new GvpPngRequest();
    obj.data = data;
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
      concatMap((data) => { const req = this.prepareRequest(config, data);
                            return this.post('api/getPNG', req); }
      )
    );
  }
}
