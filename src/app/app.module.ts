import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MatButtonModule } from '@angular/material';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MAT_LABEL_GLOBAL_OPTIONS} from '@angular/material/core';
import { KatexModule } from 'ng-katex';

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
    MenuHeaderComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSidenavModule,
    MatCardModule,
    MatIconModule,
    MatSelectModule,
    MatToolbarModule,
    MatCheckboxModule,
    MatChipsModule,
    MatListModule,
    KatexModule
  ],
  providers: [
    {provide: MAT_LABEL_GLOBAL_OPTIONS, useValue: {float: 'always', appearance: 'standard'}}
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
