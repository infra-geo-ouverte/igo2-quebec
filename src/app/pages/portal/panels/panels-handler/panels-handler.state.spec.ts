import { TestBed } from '@angular/core/testing';

import { PanelsHandlerState } from './panels-handler.state';

describe('PanelsHandlerState', () => {
  let service: PanelsHandlerState;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PanelsHandlerState);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
