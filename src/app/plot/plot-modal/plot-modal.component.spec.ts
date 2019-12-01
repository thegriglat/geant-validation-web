import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlotModalComponent } from './plot-modal.component';

describe('PlotModalComponent', () => {
  let component: PlotModalComponent;
  let fixture: ComponentFixture<PlotModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PlotModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlotModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
