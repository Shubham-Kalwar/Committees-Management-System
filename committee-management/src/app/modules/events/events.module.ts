import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { EventsRoutingModule } from './events-routing.module';
import { EventListComponent } from './event-list/event-list.component';
import { EventDetailComponent } from './event-detail/event-detail.component';
import { EventCreateComponent } from './event-create/event-create.component';
import { PendingRegistrationsComponent } from './pending-registrations/pending-registrations.component';
import { MediaUploadComponent } from './media-upload/media-upload.component';
import { MediaGalleryComponent } from './media-gallery/media-gallery.component';
import { FeedbackFormComponent } from './feedback-form/feedback-form.component';
import { FeedbackListComponent } from './feedback-list/feedback-list.component';
import { FeedbackAnalyticsComponent } from './feedback-analytics/feedback-analytics.component';
import { SharedModule } from '../../shared/shared.module';


@NgModule({
  declarations: [
    EventListComponent,
    EventDetailComponent,
    EventCreateComponent,
    PendingRegistrationsComponent,
    MediaUploadComponent,
    MediaGalleryComponent,
    FeedbackFormComponent,
    FeedbackListComponent,
    FeedbackAnalyticsComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    EventsRoutingModule
  ]
})
export class EventsModule { }
