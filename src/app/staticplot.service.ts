import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { GvpPlotXML, GvpPlotData, GvpPngRequest, GvpPlotRequest } from './gvp-plot';
import { concatMap, tap } from 'rxjs/operators';
import { Observable, forkJoin } from 'rxjs';
import { GVPAPIService } from './gvpapi.service';

@Injectable({
  providedIn: 'root'
})
export class StaticplotService extends GVPAPIService {

  constructor(http: HttpClient) {
    super(http);
  }

  private prepareRequest(config: GvpPlotXML, data: GvpPlotData[], useMarkers: boolean): GvpPngRequest {
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
    if (useMarkers) {
      obj.markersize = config.markerSize || 1;
    } else {
      obj.markersize = 0;
    }
    return obj;
  }

  private getPlotId(config: GvpPlotXML, testId: number, versionId: number): Observable<number[]> {
    const request: GvpPlotRequest = new GvpPlotRequest(config, testId, versionId);
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

  private getPlotData(config: GvpPlotXML, testId: number, versionIds: number[]): Observable<GvpPlotData[]> {
    return forkJoin(
      versionIds.map((versionId) => this.getPlotId(config, testId, versionId)))
      .pipe(
        // tap((data) => console.log('before concatMap', data)),
        concatMap((id) => this.getPlotDataById(id)) // ,
        // tap((data) => console.log('after concatMap', data))
      );
    }

  public getPlot(config: GvpPlotXML, testId: number, versionId: number[], useMarkers: boolean): Observable<any> {
    return this.getPlotData(config, testId, versionId).pipe(
      // tap((data) => console.log('getPlotData returned', data)),
      concatMap((data) => { const req = this.prepareRequest(config, data, useMarkers);
                            // console.log('prepareRequest returned', req);
                            return this.post('api/getPNG', req); }
      )
    );
  }
/*
  public getPlot(config: GvpPlotXML, testId: number, versionId: number[], useMarkers: boolean): Observable<any> {

  }
  */
}
