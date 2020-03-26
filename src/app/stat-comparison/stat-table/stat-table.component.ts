import { Component, OnInit, Input } from '@angular/core';
import { GVPAPIService } from 'src/app/services/gvpapi.service';
import { GvpTest, GvpMctoolNameVersion, ParametersList, GvpPlotIdRequest, Nullable, GvpPngRequest, GvpJSON, GvpInspire } from 'src/app/classes/gvp-plot';
import { forkJoin, from, Observable } from 'rxjs';
import { GvpJSONMetadataMatch, getParametersList, GvpJSONExpMetadataMatch, ParametersListEq } from 'src/app/utils';
import { getEstimator, Estimator, estimatorFullName, estimatorsNames } from './../estimator';
import { SuiModalService } from 'ng2-semantic-ui';
import { PlotModal } from 'src/app/plot/plot-modal/plot-modal.component';
import { map } from 'rxjs/operators';

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
  @Input() parameters: ParametersList = [];
  @Input() expdata: GvpInspire[] = [];

  public estimator: Nullable<Estimator> = getEstimator();
  // data for table
  public jsonlist: GvpJSON[][] = [];

  public inProgress = false;
  public sortDirection = 1;

  private collapseMap: Map<GvpJSON[], boolean> = new Map<GvpJSON[], boolean>();

  constructor(private api: GVPAPIService, private modalService: SuiModalService) { }

  ngOnInit() {
    if (!this.test) return;
    const target_req = this.api.uniqlookup_targetName(this.test.test_id);
    const model_req = this.api.uniqlookup_model(this.test.test_id);
    const sec_req = this.api.uniqlookup_secondaryParticle(this.test.test_id);
    const beamE_req = this.api.uniqlookup_beamEnergies(this.test.test_id);
    this.inProgress = true;
    const fj = forkJoin([target_req, model_req, sec_req, beamE_req])
    fj.subscribe(metadata_list => {
      const targets = metadata_list[0];
      const models = metadata_list[1];
      const secs = metadata_list[2];
      const beamEs = metadata_list[3];
      if (!this.test) return;
      const query = new GvpPlotIdRequest(
        [this.test.test_id], // testid
        targets, // target
        this.versions.map(v => v.mctool_name_version_id), // versions
        models, // model
        secs, // secs
        this.beam, // beams
        this.observables, // observ
        [], // SPECIAL! not request parameters as impossible to select >1 par. Filter in the code parameters
        beamEs // beamenergy
      );
      const g4_jsons_req = this.api.getPlotJSON(query);
      // don't request if no exp data selected
      const exp_jsons_req = (this.expdata.length !== 0) ? this.api.getExpMatchPlot(query) : from([[] as GvpJSON[]]);
      const all_jsons = forkJoin([g4_jsons_req, exp_jsons_req]).pipe(
        map(e => {
          return e[0].concat(...e[1]);
        })
      )
      all_jsons.subscribe(jsons => {
        this.jsonlist = [];
        jsons = jsons.filter(j => ParametersListEq(getParametersList(j.metadata.parameters), this.parameters))
        for (let i = 0; i < jsons.length; ++i) {
          const base_json = jsons[i];
          for (let j = i + 1; j < jsons.length; ++j) {
            const cmp_json = jsons[j];
            // compare function, different for g4 and exp
            const cmp_fn = (cmp_json.mctool.model === "experiment" || base_json.mctool.model === "experiment") ? GvpJSONExpMetadataMatch : GvpJSONMetadataMatch;
            if (cmp_fn(base_json, cmp_json)) {
              this.jsonlist.push([base_json])
              this.jsonlist[this.jsonlist.length - 1].push(cmp_json);
            }
          }
        }
        this.inProgress = false;
      })
    })
  }

  getPlotConfig(j: GvpJSON[]): Observable<GvpPngRequest> {
    return from([new GvpPngRequest(j)]);
  }

  jsonMetadata(j: GvpJSON) {
    return {
      observable: j.metadata.observableName,
      model: j.mctool.model,
      target: j.metadata.targetName,
      benergy: j.metadata.beam_energy_str,
      parameters: getParametersList(j.metadata.parameters)
    }
  }

  setEstimator(name: string): void {
    const tmp = getEstimator(name);
    if (tmp) {
      this.estimator = tmp;
    }
  }

  estimatorCall(plotlist: GvpJSON[]): string {
    if (!this.estimator) return "---";
    if (!(plotlist[0] && plotlist[1])) return "incomplete data";
    return this.estimator.fn(plotlist[0], plotlist[1]).toFixed(4);
  }


  ParamC2str(params: ParametersList): string {
    let s: string[] = [];
    for (let elem of params) {
      s.push(elem[0] + "=" + elem[1][0]);
    }
    return s.join(", ");
  }

  estNames() {
    return estimatorsNames();
  }

  estFNames(name?: string) {
    return estimatorFullName(name);
  }

  collapseRow(jj: GvpJSON[]): void {
    this.collapseMap.set(jj, !!!this.collapseMap.get(jj));
  }

  expandAll(jl: GvpJSON[][]): void {
    for (let j of jl)
      this.collapseRow(j);
  }

  isRowShown(jj: GvpJSON[]): boolean {
    return this.collapseMap.get(jj) || false;
  }

  tableSort() {
    this.sortDirection *= -1;
    this.jsonlist = this.jsonlist.sort((a: GvpJSON[], b: GvpJSON[]) => {
      return this.sortDirection * Math.sign(
        Number(this.estimatorCall(a)) - Number(this.estimatorCall(b))
      )
    })

  }

}
