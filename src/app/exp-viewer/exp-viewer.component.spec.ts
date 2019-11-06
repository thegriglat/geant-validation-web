import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpViewerComponent } from './exp-viewer.component';

describe('ExpViewerComponent', () => {
  let component: ExpViewerComponent;
  let fixture: ComponentFixture<ExpViewerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExpViewerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExpViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
