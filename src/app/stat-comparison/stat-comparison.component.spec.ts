import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StatComparisonComponent } from './stat-comparison.component';

describe('StatComparisonComponent', () => {
  let component: StatComparisonComponent;
  let fixture: ComponentFixture<StatComparisonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StatComparisonComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StatComparisonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
