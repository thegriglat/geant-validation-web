import { TestBed } from '@angular/core/testing';

import { StaticplotService } from './staticplot.service';

describe('StaticplotService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: StaticplotService = TestBed.get(StaticplotService);
    expect(service).toBeTruthy();
  });
});
