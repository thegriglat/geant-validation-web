import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { GvpJSON, GvpTest, GvpMctoolNameVersion, GvpMctoolName, GvpParameter, GvpInspire, GvpPngRequest, GvpPngResponse, GvpPlotIdRequest, EXPERIMENT_TEST_ID, EXPERIMENT_VERSION_ID } from '../classes/gvp-plot';
import { flatMap, map } from 'rxjs/operators';

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
    if (ids.length === 0) {
      return from([[] as GvpJSON[]]);
    }
    let params = new HttpParams().set("ids_json", JSON.stringify(ids));
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

  public inspire(id?: number) {
    let params = new HttpParams();
    if (id !== undefined)
      params.set("id", String(id));
    return this._get<GvpInspire[]>("/api/inspire", params);
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

  private uniqlookup<T>(test_id: number, JSONAttr: string) {
    let params = new HttpParams().set("test_id", String(test_id)).set("JSONAttr", JSONAttr);
    return this._get<T>("/api/uniqlookup", params);
  }

  public uniqlookup_version(test_id: number) {
    return this.uniqlookup<number[]>(test_id, "mctool.version");
  }
  public uniqlookup_beamParticle(test_id: number) {
    return this.uniqlookup<string[]>(test_id, "metadata.beamParticle");
  }
  public uniqlookup_beamEnergies(test_id: number) {
    return this.uniqlookup<string[]>(test_id, "metadata.beamEnergies");
  }
  public uniqlookup_model(test_id: number) {
    return this.uniqlookup<string[]>(test_id, "mctool.model");
  }
  public uniqlookup_targetName(test_id: number) {
    return this.uniqlookup<string[]>(test_id, "metadata.targetName");
  }
  public uniqlookup_secondaryParticle(test_id: number) {
    return this.uniqlookup<string[]>(test_id, "metadata.secondaryParticle");
  }
  public uniqlookup_observableName(test_id: number) {
    return this.uniqlookup<string[]>(test_id, "metadata.observableName");
  }
  public uniqlookup_parameters(test_id: number) {
    return this.uniqlookup<GvpParameter[]>(test_id, "metadata.parameters");
  }

  public getExperimentsInspireForTest(test_id: number) {
    let params = new HttpParams().set("test_id", String(test_id));
    return this._get<GvpInspire[]>("/api/getexperimentsinspirefortest", params);
  }

  public getPNG(config: GvpPngRequest) {
    return this._post<GvpPngResponse>("/api/getPNG", config);
  }

  public getPlotId(query: GvpPlotIdRequest) {
    let s = JSON.stringify(query);
    let params = new HttpParams().set("json_encoded", s);
    return this._get<number[]>("/api/getPlotId", params);
  }

  public getPlotJSON(query: GvpPlotIdRequest) {
    return this.getPlotId(query).pipe(
      flatMap(ids => this.multiget(ids))
    )
  }

  public getExpMatchPlot(query: GvpPlotIdRequest) {
    let exp_query = Object.assign({}, query);
    exp_query.test_id = [EXPERIMENT_TEST_ID];
    exp_query.version_id = [EXPERIMENT_VERSION_ID];
    exp_query.model = ["experiment"];
    return this.getPlotJSON(exp_query);
  }

  public getExpMatchPlotInspire(query: GvpPlotIdRequest, inspireId: number) {
    return this.getExpMatchPlot(query).pipe(
      map(jsons => jsons.filter(e => e.article.inspireId === inspireId))
    )
  }
}
