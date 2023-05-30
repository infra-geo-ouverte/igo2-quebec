import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SimpleFiltersComponent } from './simple-filters.component';

describe('SimpleFiltersComponent', () => {
  let component: SimpleFiltersComponent;
  let fixture: ComponentFixture<SimpleFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SimpleFiltersComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SimpleFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
