import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { KatexModule } from 'ng-katex';
import { SuiModule } from 'ng2-semantic-ui';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { GvplayoutComponent } from './gvplayout/gvplayout.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PlotComponent } from './plot/plot.component';
import { HomeComponent } from './home/home.component';
import { StatComparisonComponent } from './stat-comparison/stat-comparison.component';
import { RecordViewerComponent } from './record-viewer/record-viewer.component';
import { ExpViewerComponent } from './exp-viewer/exp-viewer.component';
import { LookupViewComponent } from './lookup-view/lookup-view.component';
import { MenuHeaderComponent } from './menu-header/menu-header.component';
import { PlotModalComponent } from './plot/plot-modal/plot-modal.component';
import { PermalinkComponent } from './permalink/permalink.component';
import { TestSummaryComponent } from './test-summary/test-summary.component';
import { StatTestListComponent } from './stat-test-list/stat-test-list.component';

@NgModule({
  declarations: [
    AppComponent,
    GvplayoutComponent,
    PlotComponent,
    HomeComponent,
    StatComparisonComponent,
    RecordViewerComponent,
    ExpViewerComponent,
    LookupViewComponent,
    MenuHeaderComponent,
    PlotModalComponent,
    PermalinkComponent,
    TestSummaryComponent,
    StatTestListComponent,
  ],
  imports: [
    SuiModule,
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    KatexModule
  ],
  providers: [
  ],
  entryComponents: [PlotModalComponent],
  bootstrap: [AppComponent]
})
export class AppModule { }
