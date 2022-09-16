import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LayerToggleComponent } from './layer-toggle.component';

describe('LayerToggleComponent', () => {
  let component: LayerToggleComponent;
  let fixture: ComponentFixture<LayerToggleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LayerToggleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LayerToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
