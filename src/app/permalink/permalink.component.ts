import { Component, OnInit, Input } from '@angular/core';
import { GvpPngRequest } from '../classes/gvp-plot';

@Component({
  selector: 'app-permalink',
  templateUrl: './permalink.component.html',
  styleUrls: ['./permalink.component.css']
})
export class PermalinkComponent implements OnInit {

  @Input() config: GvpPngRequest;
  private _url: string = "";
  constructor() { }

  ngOnInit() {
    // TODO: unsafe interface-less code
    if (this.config) {
      let json: any = Object.assign({}, this.config);
      json.ids = json.data.map(e => e.id);
      delete json.data;
      const b64 = (new Buffer(JSON.stringify(json)).toString('base64'));
      this._url = encodeURIComponent(b64);
    }
  }

  url(): string {
    return `/api/permalink/${this._url}`;
  }

}
