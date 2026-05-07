import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CommitteesRoutingModule } from './committees-routing.module';
import { FormsModule } from '@angular/forms';
import { CommitteeListComponent } from './committee-list/committee-list.component';
import { CommitteeDetailComponent } from './committee-detail/committee-detail.component';
import { SharedModule } from '../../shared/shared.module';
import { CommitteeApplicationsComponent } from './committee-applications/committee-applications.component';


@NgModule({
  declarations: [
    CommitteeListComponent,
    CommitteeDetailComponent,
    CommitteeApplicationsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    CommitteesRoutingModule
  ]
})
export class CommitteesModule { }
