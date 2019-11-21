import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import * as api from './../classes/api_interfaces';
import { GvpJSON, GvpTest, GvpMctoolNameVersion, GvpMctoolName } from '../classes/gvp-plot';

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
    let params = new HttpParams()
    for (let i of ids)
      params.append("ids", String(i));
    return this._get<GvpJSON[]>("api/multiget", params);
  }

  public getPlotsByTestVersion(test: string, version: string) {
    let params = new HttpParams().set("test", test).set("version", version);
    return this._get<GvpJSON[]>("api/getPlotsByTestVersion", params);
  }

  public getExpPlotsByInspireId(inspireId: number) {
    let params = new HttpParams().set("inspire_id", String(inspireId));
    return this._get<GvpJSON[]>("api/getExpPlotsByInspireId", params);
  }

  public test(id?: number) {
    let params = new HttpParams();
    if (id !== undefined)
      params.set("id", String(id));
    return this._get<GvpTest[]>("/api/test", params);
  }

  public mctool_name_version(id?: number) {
    let params = new HttpParams();
    if (id !== undefined)
      params.set("id", String(id));
    return this._get<GvpMctoolNameVersion[]>("/api/mctool_name_version", params);
  }

  public mctool_name(id?: number) {
    let params = new HttpParams();
    if (id !== undefined)
      params.set("id", String(id));
    return this._get<GvpMctoolName[]>("/api/mctool_name", params);
  }

}
