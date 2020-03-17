import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { switchMap, map } from 'rxjs/operators';
import { Nullable, GvpTest } from '../classes/gvp-plot';
import { GVPAPIService } from '../services/gvpapi.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-stat-comparison',
  templateUrl: './stat-comparison.component.html',
  styleUrls: ['./stat-comparison.component.css']
})
export class StatComparisonComponent implements OnInit {

  public test: Observable<GvpTest> = new Observable<GvpTest>();

  constructor(private route: ActivatedRoute, private router: Router, private api: GVPAPIService) { }

  ngOnInit() {
    this.test = this.route.paramMap.pipe(
      switchMap((params: ParamMap) => 
        this.api.testById(Number(params.get('id')))
      ));
  }

}
