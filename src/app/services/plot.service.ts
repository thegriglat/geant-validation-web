import { Injectable } from '@angular/core';
import { concatMap, map, tap, concatAll } from 'rxjs/operators';
import { HttpClient, HttpParams } from '@angular/common/http';
import { GvpPlotData, GvpPlotXML, GvpPlotIdRequest } from '../classes/gvp-plot';
import { Observable, forkJoin } from 'rxjs';
import { GVPAPIService } from './gvpapi.service';

@Injectable({
  providedIn: 'root'
})
export class PlotService extends GVPAPIService {

  constructor(protected http: HttpClient) {
    super(http);
  }
/*
  // TODO: ratio; reference

  private getPlotId(config: GvpPlotXML, testId: number, versionId: number): Observable<number[]> {
    const request: GvpPlotIdRequest = new GvpPlotIdRequest(config, testId, versionId);
    let params = new HttpParams();
    for (const k of Object.keys(request)) {
      params = params.set(k, request[k]);
    }
    return this.get<number[]>('api/getPlotId/', params); // .pipe(
      // tap((data) => console.log('getPlotId returned', data)));
  }

  private getPlotDataById(id: number[][]): Observable<GvpPlotData[]> {
    const params = '?ids=' + id.reduce((acc, val) => acc.concat(val), []).join('&ids=');
    return this.get<GvpPlotData[]>('api/multiget/' + params);
  }

  protected getPlotData(config: GvpPlotXML, testId: number, versionId: number[]): Observable<GvpPlotData[]> {
    return forkJoin(
      versionId.map((e) => this.getPlotId(config, testId, e)))
      .pipe(
        // tap((data) => console.log('before concatMap', data)),
        concatMap((id) => this.getPlotDataById(id)) // ,
        // tap((data) => console.log('after concatMap', data))
      );
    }
  */
}
