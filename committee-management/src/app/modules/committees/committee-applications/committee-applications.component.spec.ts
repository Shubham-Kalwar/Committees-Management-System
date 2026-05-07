import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommitteeApplicationsComponent } from './committee-applications.component';

describe('CommitteeApplicationsComponent', () => {
  let component: CommitteeApplicationsComponent;
  let fixture: ComponentFixture<CommitteeApplicationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CommitteeApplicationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommitteeApplicationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
