import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserListComponent } from './user-list/user-list.component';
import { FacultyManagementComponent } from './faculty-management/faculty-management.component';

const routes: Routes = [
  { path: '', component: UserListComponent },
  { path: 'faculty', component: FacultyManagementComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UsersRoutingModule { }
