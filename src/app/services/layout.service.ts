import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { GvpLayouts } from '../classes/gvp-plot';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  constructor(private http: HttpClient) {
  }

  validateXML(xmltext: string): any {
    const oParser = new DOMParser();
    const oDOM = oParser.parseFromString(xmltext, 'text/xml');
    // print the name of the root element or error message
    if (oDOM.documentElement.nodeName === 'parsererror') {
      return null;
    } else {
      return oDOM;
    }
  }

  private downloadFromGitlab<T>(file: string) {
    return this.http.get<T>(`https://gitlab.com/api/v4/projects/9185703/repository/files/${file}/raw?ref=master`, {responseType: 'json'});
  }

  private downloadXMLFromGitlab(file: string): Observable<string> {
    return this.http.get(`https://gitlab.com/api/v4/projects/9185703/repository/files/${file}/raw?ref=master`, {responseType: 'text'});
  }

  public getLayout(file: string): Observable<Document|null> {
    const obs = this.downloadXMLFromGitlab(file);
    // const obs = this.http.get(`https://gitlab.com/thegriglat/geant-val-layouts/raw/master/AttenuationTest.xml`, {responseType: 'text'});
    //                            ^ this won't work due to CORS policy!
    return obs.pipe(map(data => this.validateXML(data)));
  }

  public getAllLayouts(): Observable<GvpLayouts> {
    return this.downloadFromGitlab<GvpLayouts>('tags.json');
  }
}
