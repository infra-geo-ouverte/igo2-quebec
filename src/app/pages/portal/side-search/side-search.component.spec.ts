import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SideSearchComponent } from './side-search.component';

describe('SideSearchComponent', () => {
  let component: SideSearchComponent;
  let fixture: ComponentFixture<SideSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SideSearchComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SideSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
