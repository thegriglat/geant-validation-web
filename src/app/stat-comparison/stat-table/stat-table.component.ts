import { Component, OnInit, Input } from '@angular/core';
import { GVPAPIService } from 'src/app/services/gvpapi.service';
import { GvpTest, GvpMctoolNameVersion, ParametersList, GvpPlotIdRequest, Nullable, GvpPngRequest, GvpJSON } from 'src/app/classes/gvp-plot';
import { forkJoin } from 'rxjs';
import { GvpJSONMetadataMatch, getParametersList } from 'src/app/utils';
import { getEstimator, Estimator, estimatorFullName, estimatorsNames } from './../estimator';
import { SuiModalService } from 'ng2-semantic-ui';
import { PlotModal } from 'src/app/plot/plot-modal/plot-modal.component';

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

  public estimator: Nullable<Estimator> = getEstimator();
  // data for table
  public jsonlist: GvpJSON[][] = [];

  public inProgress = false;
  public sortDirection = 1;

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
        targets[0], // target
        this.versions.map(v => v.mctool_name_version_id), // versions
        models, // model
        secs, // secs
        this.beam, // beams
        this.observables, // observ
        this.parameters || [], // parameters
        beamEs // beamenergy
      );
      this.api.getPlotJSON(query).subscribe(jsons => {
        this.jsonlist = [];
        for (let i = 0; i < jsons.length; ++i) {
          const base_json = jsons[i];
          this.jsonlist.push([base_json])
          for (let j = i + 1; j < jsons.length; ++j) {
            const cmp_json = jsons[j];
            if (GvpJSONMetadataMatch(base_json, cmp_json)) {
              this.jsonlist[this.jsonlist.length - 1].push(cmp_json);
            }
          }
        }
        // skip plots with missing data
        this.jsonlist = this.jsonlist.filter(e => e.length === this.versions.length);
        this.inProgress = false;
      })
    })
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
    return this.estimator.fn(plotlist[0], plotlist[1]).toFixed(4);
  }


  ParamC2str(params: ParametersList): string {
    let s: string[] = [];
    for (let elem of params) {
      s.push(elem[0] + "=" + elem[1][0]);
    }
    return s.join(", ");
  }

  showModalPlot(jsons: GvpJSON[]): void {
    this.modalService.open(
      new PlotModal(new GvpPngRequest(jsons))
    )
  }

  estNames() {
    return estimatorsNames();
  }

  estFNames(name?: string) {
    return estimatorFullName(name);
  }

  tableSort() {
    this.sortDirection *= -1;
    console.log(this.sortDirection);
    this.jsonlist = this.jsonlist.sort((a: GvpJSON[], b: GvpJSON[]) => {
      return this.sortDirection * Math.sign(
        Number(this.estimatorCall(a)) - Number(this.estimatorCall(b))
      )
    })

  }

}
