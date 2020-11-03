import {
  async,
  ComponentFixture,
  TestBed,
  // inject, tick, fakeAsync
} from '@angular/core/testing';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import { OverlayModule } from '@angular/cdk/overlay';

// import { DebugElement } from '@angular/core';
// import { By } from '@angular/platform-browser';

import { MdbTimePickerComponent } from './timepicker.component';
import { MdbTimePickerContentComponent } from './timepicker.content';

describe('TimePickerComponent', () => {
  let component: MdbTimePickerComponent;
  let fixture: ComponentFixture<MdbTimePickerComponent>;
  //   let de: DebugElement;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [MdbTimePickerComponent, MdbTimePickerContentComponent],
      imports: [OverlayModule],
    })
      .overrideModule(BrowserDynamicTestingModule, {
        set: { entryComponents: [MdbTimePickerContentComponent] },
      })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MdbTimePickerComponent);
    component = fixture.componentInstance;
    // de = fixture.debugElement;

    fixture.detectChanges();
  });

  test('should create', () => {
    expect(component).toBeTruthy();
  });
});
