import { Component, OnInit, Input } from '@angular/core';
import { GvpPlot } from '../gvp-plot';
import { StaticplotService } from '../staticplot.service';
import { environment } from './../../environments/environment';

@Component({
  selector: 'app-plot',
  templateUrl: './plot.component.html',
  styleUrls: ['./plot.component.css']
})
export class PlotComponent implements OnInit {
  url: string;
  type: string;
  status: string;
  filename: string;

  @Input()
  public config: GvpPlot;

  constructor(private service: StaticplotService) { }

  ngOnInit() {

  }

  draw() {
    this.service.getPlot(this.config).subscribe((res) => {this.filename = environment.APIEndpoint + res.filename;
                                                          this.status = res.status; });
  }
}
