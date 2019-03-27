import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { MatButtonModule } from '@angular/material';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatGridListModule } from '@angular/material/grid-list';
import { KatexModule } from 'ng-katex';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { GvplayoutComponent } from './gvplayout/gvplayout.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PlotComponent } from './plot/plot.component';

@NgModule({
  declarations: [
    AppComponent,
    GvplayoutComponent,
    PlotComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatGridListModule,
    KatexModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
