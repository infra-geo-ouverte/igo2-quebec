import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SimpleFeatureListComponent } from './simple-feature-list.component';

describe('SimpleFeatureListComponent', () => {
  let component: SimpleFeatureListComponent;
  let fixture: ComponentFixture<SimpleFeatureListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SimpleFeatureListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SimpleFeatureListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
