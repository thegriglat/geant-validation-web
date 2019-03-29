import { Injectable } from '@angular/core';
import { concatMap, mergeMap, mergeAll, map, reduce } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { GvpPlotData, GvpPlotXML, GvpPlotRequest } from './gvp-plot';
import { Observable, forkJoin, concat, merge } from 'rxjs';
import { GVPAPIService } from './gvpapi.service';

@Injectable({
  providedIn: 'root'
})
export class PlotService extends GVPAPIService {

  constructor(protected http: HttpClient) {
    super(http);
  }

  // TODO: ratio!

  private getPlotId(config: GvpPlotXML, testId: number, versionId: number): Observable<number> {
    const params: GvpPlotRequest = new GvpPlotRequest(config, testId, versionId);
    return this.get<number>('api/getPlotId/', params);
  }

  private getPlotDataById(id: number): Observable<GvpPlotData> {
    return this.get<GvpPlotData>('api/multiget/', {ids: String(id)});
  }

  protected getPlotData(config: GvpPlotXML, testId: number, versionId: number[]): Observable<GvpPlotData[]> {
    return forkJoin(versionId.map((e) => this.getPlotId(config, testId, e).pipe(concatMap((id) => this.getPlotDataById(id)))));    
  }
}
