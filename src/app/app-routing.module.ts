import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { GvplayoutComponent } from './gvplayout/gvplayout.component';
import { StatComparisonComponent } from './stat-comparison/stat-comparison.component';
import { RecordViewerComponent } from './record-viewer/record-viewer.component';
import { ExpViewerComponent } from './exp-viewer/exp-viewer.component';
import { LookupViewComponent } from './lookup-view/lookup-view.component';
import { TestSummaryComponent } from './test-summary/test-summary.component';
import { StatTestListComponent } from './stat-test-list/stat-test-list.component';

const routes: Routes = [
	{ path: '', component: HomeComponent },
	{ path: 'layouts', component: GvplayoutComponent },
	{ path: 'statcmp', component: StatComparisonComponent },
	{ path: 'stat', component: StatTestListComponent },
	{ path: 'records', component: RecordViewerComponent },
	{ path: 'exp', component: ExpViewerComponent },
	{ path: 'lookup', component: LookupViewComponent },
	{ path: 'summary', component: TestSummaryComponent },
];


@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule]
})
export class AppRoutingModule { }
