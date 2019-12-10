import { Component, OnInit, Input } from '@angular/core';
import { GvpPngRequest } from '../classes/gvp-plot';

class GvpPngRequestIds extends GvpPngRequest {
  ids: number[];
  constructor(req: GvpPngRequest) {
    super(req.data, req.refid);
    this.ids = req.data.map(e => e.id);
    delete this.data;
  }
}

@Component({
  selector: 'app-permalink[config]',
  templateUrl: './permalink.component.html',
  styleUrls: ['./permalink.component.css']
})
export class PermalinkComponent implements OnInit {

  @Input() config!: GvpPngRequest;
  private _url: string = "";
  constructor() { }

  ngOnInit() {
    // TODO: unsafe interface-less code
    let json = new GvpPngRequestIds(this.config);
    const b64 = btoa(JSON.stringify(json));
    this._url = encodeURIComponent(b64);
  }

  url(): string {
    return `/api/permalink/${this._url}`;
  }

}
