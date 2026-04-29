import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { OnboardingComponent } from './onboarding.component';

const routes: Routes = [
  { path: '', component: OnboardingComponent }
];

@NgModule({
  declarations: [
    OnboardingComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes)
  ]
})
export class OnboardingModule { }
