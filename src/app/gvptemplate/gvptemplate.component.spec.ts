import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GvptemplateComponent } from './gvptemplate.component';

describe('GvptemplateComponent', () => {
  let component: GvptemplateComponent;
  let fixture: ComponentFixture<GvptemplateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GvptemplateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GvptemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
