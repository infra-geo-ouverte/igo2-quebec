import { TestBed } from '@angular/core/testing';

import { FiltersServiceService } from './filters-service.service';

describe('FiltersServiceService', () => {
  let service: FiltersServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FiltersServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
