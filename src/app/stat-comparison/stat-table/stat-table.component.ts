import { Component, OnInit, Input } from '@angular/core';
import { GVPAPIService } from 'src/app/services/gvpapi.service';
import { GvpTest, GvpMctoolNameVersion, ParametersList, GvpPlotIdRequest, Nullable, GvpJSON } from 'src/app/classes/gvp-plot';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { cartesian } from 'src/app/utils';
import { getEstimator, Estimator } from './../estimator';

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

  public estimator: Nullable<Estimator> = getEstimator('chi2');
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
      map(e => {
        let parm: string[][] = [];
        if (this.parameters) {
          parm = this.parameters.map(e => e[1]);
        }
        const input = e.concat([this.observables, ...parm])
        let cart = cartesian(input);
        return cart;
      })
    ).subscribe(comb => {
      this.combinations = comb;
    })
  }

  setEstimator(name: string): void {
    const tmp = getEstimator(name);
    if (tmp) {
      this.estimator = tmp;
    }
  }
  /*
    estimatorCall(plotlist: GvpJSON[]): number {
      if (!this.estimator) return 0.;
      return this.estimator(plotlist[0], plotlist[1]);
    }
    
    getPlots(combination: string[]) {
      // todo;
    }
  */
  ParamC2ParameterList(combination: string[][]): ParametersList {
    if (!this.parameters) return [];
    // TODO: dirty typing hack: string[] vs string
    let res: any[] = [];
    const startN = 5; // target model sec beam obs
    const values = combination.slice(startN);
    const keys = this.parameters.map(e => e[0]);
    for (let idx = 0; idx < keys.length; idx++)
      res.push([keys[idx], [values[idx]]]);
    return res as ParametersList;
  }

  ParamC2str(combination: string[][]): string {
    let s: string[] = [];
    for (let elem of this.ParamC2ParameterList(combination)) {
      s.push(elem[0] + "=" + elem[1][0]);
    }
    return s.join(", ");
  }

}
