import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AboutSubPageComponent } from './about-sub-page.component';

describe('AboutSubPageComponent', () => {
  let component: AboutSubPageComponent;
  let fixture: ComponentFixture<AboutSubPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutSubPageComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AboutSubPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
