import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearviajeComponent } from './crearviaje.component';

describe('CrearviajeComponent', () => {
  let component: CrearviajeComponent;
  let fixture: ComponentFixture<CrearviajeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearviajeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrearviajeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
