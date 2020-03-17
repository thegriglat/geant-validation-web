import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StatTestListComponent } from './stat-test-list.component';

describe('StatTestListComponent', () => {
  let component: StatTestListComponent;
  let fixture: ComponentFixture<StatTestListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StatTestListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StatTestListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
