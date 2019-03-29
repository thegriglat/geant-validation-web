import { Injectable } from '@angular/core';
import { concatMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { GvpPlotData, GvpPlotXML, GvpPlotRequest } from './gvp-plot';
import { Observable } from 'rxjs';
import { GVPAPIService } from './gvpapi.service';

@Injectable({
  providedIn: 'root'
})
export class PlotService extends GVPAPIService {

  constructor(protected http: HttpClient) {
    super(http);
  }

  // TODO: pass test_id and version_id to getPlot_ function

  private getPlotId(config: GvpPlotXML): Observable<number> {
    const params: GvpPlotRequest = new GvpPlotRequest(config, 126, 173);
    return this.get<number>('api/getPlotId/', params);
  }

  private getPlotDataById(id: number): Observable<GvpPlotData> {
    return this.get<GvpPlotData>('api/multiget/', {ids: String(id)});
  }

  protected getPlot_(config: GvpPlotXML): Observable<GvpPlotData> {
    return this.getPlotId(config).pipe(concatMap((id) => this.getPlotDataById(id)));
  }
}
