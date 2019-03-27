import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

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

  public getLayout(file: string): Observable<Document|null> {
    const obs = this.http.get(`https://gitlab.com/api/v4/projects/9185703/repository/files/${file}/raw?ref=master`, {responseType: 'text'});
    // const obs = this.http.get(`https://gitlab.com/thegriglat/geant-val-layouts/raw/master/AttenuationTest.xml`, {responseType: 'text'});
    //                            ^ this won't work due to CORS policy!
    return obs.pipe(map(data => this.validateXML(data)));
  }
}
