import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {HomeComponent} from './home/home.component';
import {GvplayoutComponent} from './gvplayout/gvplayout.component';

const routes: Routes = [
	{ path: '', component: HomeComponent},
	{ path: 'layout', component: GvplayoutComponent}
	];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
