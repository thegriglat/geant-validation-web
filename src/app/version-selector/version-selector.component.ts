import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { GVPAPIService } from '../services/gvpapi.service';
import { GvpMctoolNameVersion } from '../classes/gvp-plot';

@Component({
  selector: 'app-version-selector',
  templateUrl: './version-selector.component.html',
  styleUrls: ['./version-selector.component.css']
})
export class VersionSelectorComponent implements OnInit {

  constructor(private api: GVPAPIService) { }

  versions: GvpMctoolNameVersion[] = [];
  disabled = true;
  @Output() version = new EventEmitter<GvpMctoolNameVersion[]>();
  currentVersion: GvpMctoolNameVersion;

  ngOnInit() {
    this.api.get<GvpMctoolNameVersion[]>('api/mctool_name_version').subscribe(response => {
      this.versions = [];
      for (const elem of response) {
        this.versions.push(elem);
      }
      this.disabled = false;
    });
  }

  formatter(obj: GvpMctoolNameVersion, query?: string): string {
    return `${obj.version}`;
  }

  emit(event: GvpMctoolNameVersion[]) {
    this.version.emit(event);
    console.log(`emit`);
    console.log(event);
  }
}
