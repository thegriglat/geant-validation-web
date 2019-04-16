import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from './../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GVPAPIService {

  constructor(protected http: HttpClient) {
  }

  public get<T>(url: string, params?: any): Observable<T> {
    while (url[0] === '/') { url = url.substr(1); }
    const fullurl = `${environment.APIEndpoint}${url}`;
    if (params !== undefined) {
      return this.http.get<T>(fullurl, {params});
    } else {
      return this.http.get<T>(fullurl);
    }
  }

  public post<T>(url: string, body: any): Observable<T> {
    while (url[0] === '/') { url = url.substr(1); }
    const fullurl = `${environment.APIEndpoint}${url}`;
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };

    return this.http.post<T>(fullurl, body as any, httpOptions);
  }
}
