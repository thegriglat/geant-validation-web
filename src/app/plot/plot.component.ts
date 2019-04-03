import { Component, OnInit, Input } from '@angular/core';
import { GvpPlot } from '../gvp-plot';
import { StaticplotService } from '../staticplot.service';
import { environment } from './../../environments/environment';

/**
 * Container for a single plot. WIP.
 */
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
  plotWidth: number;
  plotHeight: number;
  useMarkers: boolean;
  public testId: number;
  public versionId: number[];

  @Input()
  public config: GvpPlot;

  constructor(private service: StaticplotService) {
    this.plotWidth = 320;
    this.plotHeight = 200;
  }

  ngOnInit() {

  }

  draw() {
    this.service.getPlot(this.config, this.testId, this.versionId, this.useMarkers).subscribe(
      (res) => {this.filename = environment.APIEndpoint + res.filename;
                this.status = res.status; });
  }

  resizeImage(newSize) {
    this.plotHeight = newSize.height;
    this.plotWidth = newSize.width;
  }
}
