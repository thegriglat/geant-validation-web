import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {HomeComponent} from './home/home.component';
import {GvplayoutComponent} from './gvplayout/gvplayout.component';
import { StatComparisonComponent } from './stat-comparison/stat-comparison.component';
import { RecordViewerComponent } from './record-viewer/record-viewer.component';
import { ExpViewerComponent } from './exp-viewer/exp-viewer.component';
import { LookupViewComponent } from './lookup-view/lookup-view.component';

const routes: Routes = [
	{ path: '', component: HomeComponent},
	{ path: 'layouts', component: GvplayoutComponent},
	{ path: 'stat', component: StatComparisonComponent},
	{ path: 'records', component: RecordViewerComponent},
	{ path: 'exp', component: ExpViewerComponent},
	{ path: 'lookup', component: LookupViewComponent},
	];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
