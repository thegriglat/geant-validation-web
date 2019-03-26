import { Injectable } from '@angular/core';
import { concatMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { GvpPlotData, GvpPlotXML, GvpPlotRequest } from './gvp-plot';
import { Observable } from 'rxjs';
import { environment } from './../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PlotService {

  constructor(protected http: HttpClient) {
  }

  // TODO: pass test_id and version_id to getPlot_ function

  private getPlotId(config: GvpPlotXML): Observable<number> {
    const params: GvpPlotRequest = new GvpPlotRequest(config, 126, 173);
    const url = `${environment.APIEndpoint}api/getPlotId/`;
    return this.http.get<number>(url, {params: params as any});
  }

  private getPlotDataById(id: number): Observable<GvpPlotData> {
    const url = `${environment.APIEndpoint}api/multiget/`;
    return this.http.get<GvpPlotData>(url, {params: {ids: String(id)}});
  }

  protected getPlot_(config: GvpPlotXML): Observable<GvpPlotData> {
    return this.getPlotId(config).pipe(concatMap((id) => this.getPlotDataById(id)));
  }
}
