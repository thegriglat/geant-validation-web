import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GvplayoutComponent } from './gvplayout.component';

describe('GvplayoutComponent', () => {
  let component: GvplayoutComponent;
  let fixture: ComponentFixture<GvplayoutComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GvplayoutComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GvplayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
