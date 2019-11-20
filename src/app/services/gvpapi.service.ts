import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import * as api from './../classes/api_interfaces';
import { GvpJSON } from '../classes/gvp-plot';

@Injectable({
  providedIn: 'root'
})
export class GVPAPIService {

  constructor(protected http: HttpClient) {
  }

  public _get<T>(url: string, params?: any): Observable<T> {
    while (url[0] === '/') { url = url.substr(1); }
    const fullurl = `${environment.APIEndpoint}${url}`;
    if (params !== undefined) {
      return this.http.get<T>(fullurl, { params });
    } else {
      return this.http.get<T>(fullurl);
    }
  }

  public _post<T>(url: string, body: any): Observable<T> {
    while (url[0] === '/') { url = url.substr(1); }
    const fullurl = `${environment.APIEndpoint}${url}`;
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
    return this.http.post<T>(fullurl, body as any, httpOptions);
  }

  public get(id: number) {
    return this._get<GvpJSON>("api/get/" + String(id));
  }

  public multiget(ids: number[]) {
    // TODO: check this
    let query: api.APIMultigetRequest;
    query.query.ids = ids;
    return this._get<GvpJSON[]>("api/multiget", query);
  }

  public getPlotsByTestVersion(test: string, version: string) {
    let query: api.APIGetPlotsByTestVersionRequest;
    query.query.test = test;
    query.query.version = version;
    return this._get<GvpJSON[]>("api/getPlotsByTestVersion", query);
  }

  public getExpPlotsByInspireId(inspireId: number) {
    let query: api.APIgetExpPlotsByInspireIdRequest;
    query.query.inspire_id = inspireId;
    return this._get<GvpJSON[]>("api/getExpPlotsByInspireId", query);
  }
}
