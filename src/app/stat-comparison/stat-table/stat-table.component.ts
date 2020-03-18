import { Component, OnInit, Input } from '@angular/core';
import { GVPAPIService } from 'src/app/services/gvpapi.service';
import { GvpTest, GvpMctoolNameVersion, ParametersList, GvpPlotIdRequest } from 'src/app/classes/gvp-plot';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { cartesian } from 'src/app/utils';

@Component({
  selector: 'app-stat-table',
  templateUrl: './stat-table.component.html',
  styleUrls: ['./stat-table.component.css']
})
export class StatTableComponent implements OnInit {

  @Input() test?: GvpTest;
  @Input() versions: GvpMctoolNameVersion[] = [];
  @Input() observables: string[] = [];
  @Input() beam: string[] = [];
  @Input() parameters?: ParametersList;

  public combinations: string[][] = [];

  constructor(private api: GVPAPIService) { }

  ngOnInit() {
    if (!this.test) return;
    this.combinations = [];
    const target_req = this.api.uniqlookup_targetName(this.test.test_id);
    const model_req = this.api.uniqlookup_model(this.test.test_id);
    const sec_req = this.api.uniqlookup_secondaryParticle(this.test.test_id);
    const beamE_req = this.api.uniqlookup_beamEnergies(this.test.test_id);
    const fj = forkJoin([target_req, model_req, sec_req, beamE_req])
    fj.pipe(
      map(e => cartesian(e.concat([this.observables]))
      )
    ).subscribe(comb => {
      this.combinations = comb;
      console.log(this.combinations);
    })
  }

}
