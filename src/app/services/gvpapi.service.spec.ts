import { TestBed } from '@angular/core/testing';

import { GVPAPIService } from './gvpapi.service';

describe('GVPAPIService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: GVPAPIService = TestBed.get(GVPAPIService);
    expect(service).toBeTruthy();
  });
});
