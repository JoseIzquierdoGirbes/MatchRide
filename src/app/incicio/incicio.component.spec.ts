import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IncicioComponent } from './incicio.component';

describe('IncicioComponent', () => {
  let component: IncicioComponent;
  let fixture: ComponentFixture<IncicioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncicioComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IncicioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
