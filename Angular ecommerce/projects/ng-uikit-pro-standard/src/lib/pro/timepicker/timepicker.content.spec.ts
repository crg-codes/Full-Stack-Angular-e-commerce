import {
  async,
  ComponentFixture,
  TestBed,
  // inject, tick, fakeAsync
} from '@angular/core/testing';
import { OverlayModule } from '@angular/cdk/overlay';
import { dispatchKeyboardEvent } from '@angular/cdk/testing';
import {
  UP_ARROW,
  ENTER,
  // DOWN_ARROW,
} from '@angular/cdk/keycodes';

import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

import { MdbTimePickerComponent } from './timepicker.component';
import { MdbTimePickerContentComponent } from './timepicker.content';
import { SelectedTime } from './timepicker.interface';

const defaultValue: SelectedTime = { h: '12', m: '00', ampm: 'AM' };

describe('TimePickerContentComponent', () => {
  let component: MdbTimePickerContentComponent;
  let fixture: ComponentFixture<MdbTimePickerContentComponent>;
  let de: DebugElement;

  let wrapper: MdbTimePickerComponent;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [MdbTimePickerComponent, MdbTimePickerContentComponent],
      imports: [OverlayModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MdbTimePickerContentComponent);
    wrapper = TestBed.createComponent(MdbTimePickerComponent).componentInstance;
    // set default values
    component = fixture.componentInstance;
    component.value = defaultValue;
    // component.twelveHour = true;
    component.okButton = 'ok';
    component.clearButton = 'clear';
    component.closeButton = 'close';
    component.autoClose = false;
    component.picker = wrapper;
    //// Set default values

    de = fixture.debugElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    component = fixture.componentInstance;
    component.value = defaultValue;
    component.ngOnInit();
    component.ngAfterViewInit();
    de = fixture.debugElement;
    fixture.detectChanges();
  });

  test('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('should renders', () => {
    test('should render ampm', () => {
      component.twelveHour = true;
      const pickerAmPmDiv = de.query(By.css('.mdb-timepicker-ampm'));
      console.log(pickerAmPmDiv);
    });
  });

  describe('should sets properties', () => {
    test('should sets "_selectedTime" from "value" property', () => {
      expect(component['_selectedTime']).toBe(component.value);
    });

    test('should sets "_min" from "min" property', () => {
      component.min = defaultValue;
      component.ngOnInit();
      expect(component['_min']).toBe(defaultValue);
    });

    test('should sets "_max" from "max" property', () => {
      component.max = defaultValue;
      component.ngOnInit();
      expect(component['_max']).toBe(defaultValue);
    });

    test('should sets _minutesTicks by _generateTick()', () => {
      expect(component['_minutesTicks'].length).toBe(12); // 5, 10 ,15 ...
      component['_minutesTicks'].map((_, index) => {
        expect(component['_minutesTicks'][index].min).toBe(
          index <= 1 ? `0${index * 5}` : `${index * 5}`
        );
        expect(component['_minutesTicks'][index].left).toBeTruthy();
        expect(component['_minutesTicks'][index].top).toBeTruthy();
      });
    });

    describe('should sets _hourTick', () => {
      test('should sets _hourTick by _generateTick() with twelveHour = false', () => {
        component.twelveHour = false;
        component['_generateTick']();
        expect(component['_hoursTicks'].length).toBe(24);
        component['_hoursTicks'].map((_, index) => {
          expect(component['_hoursTicks'][index].hour).toBe(`${index === 0 ? '00' : `${index}`}`);
          expect(component['_hoursTicks'][index].left).toBeTruthy();
          expect(component['_hoursTicks'][index].top).toBeTruthy();
        });
      });

      test('should sets _hourTick by _generateTick() with twelveHour = true', () => {
        component.twelveHour = true;
        component['_generateTick']();
        expect(component['_hoursTicks'].length).toBe(12);
        component['_hoursTicks'].map((_, index) => {
          expect(component['_hoursTicks'][index].hour).toBe(`${index + 1}`);
          expect(component['_hoursTicks'][index].left).toBeTruthy();
          expect(component['_hoursTicks'][index].top).toBeTruthy();
        });
      });
    });

    describe('should sets _disabledHours', () => {
      function setDisableHours(time: SelectedTime, range: 'max' | 'min', twelveHour: boolean) {
        let disabled: {}[];
        component = fixture.componentInstance;
        component[range] = time;
        component.twelveHour = twelveHour;
        component.ngOnInit();
        disabled = component['_disabledHours'].filter(hour => hour === false);
        return disabled;
      }

      function setDisableHoursMinMax(min: SelectedTime, max: SelectedTime, twelveHour: boolean) {
        let disabled: {}[];
        component = fixture.componentInstance;
        component.min = min;
        component.max = max;
        component.twelveHour = twelveHour;
        component.ngOnInit();
        disabled = component['_disabledHours'].filter(hour => hour === false);
        return disabled;
      }

      test('should sets _disabledHours from `max` property', () => {
        for (let i = 0; i < 24; i++) {
          // 12
          expect(setDisableHours({ h: `${i}`, m: '15', ampm: 'AM' }, 'max', false)).toHaveLength(
            1 + i
          );
        }
        for (let i = 0; i <= 24; i++) {
          // 24
          expect(setDisableHours({ h: `${i}`, m: '15', ampm: 'AM' }, 'max', true)).toHaveLength(
            1 + i
          );
        }
      });

      test('should sets _disabledHours from `min` property', () => {
        for (let i = 0; i <= 24; i++) {
          // 12
          expect(setDisableHours({ h: `${i}`, m: '15', ampm: 'AM' }, 'min', false)).toHaveLength(
            24 - i
          );
        }
        for (let i = 1; i <= 24; i++) {
          // 24
          expect(setDisableHours({ h: `${i}`, m: '15', ampm: 'AM' }, 'min', true)).toHaveLength(
            25 - i
          );
        }
      });

      test('should correctly set _disabledHours when min.h === max.h && twelveHour', () => {
        for (let i = 1; i < 12; i++) {
          expect(
            setDisableHoursMinMax(
              { h: `${i}`, m: '0', ampm: 'AM' },
              { h: `${i}`, m: '59', ampm: 'AM' },
              true
            )
          ).toHaveLength(2); // 2 because time starts from 1 and 0'th element has false
        }

        for (let i = 1; i < 12; i++) {
          expect(
            setDisableHoursMinMax(
              { h: `${i}`, m: '0', ampm: 'PM' },
              { h: `${i}`, m: '59', ampm: 'PM' },
              true
            )
          ).toHaveLength(2);
        }
      });

      test('should correctly set _disabledHours when min.h === max.h && !TH', () => {
        for (let i = 0; i < 24; i++) {
          expect(
            setDisableHoursMinMax(
              { h: `${i}`, m: '0', ampm: 'PM' },
              { h: `${i}`, m: '59', ampm: 'PM' },
              false
            )
          ).toHaveLength(1);
        }
      });
    });

    describe('should sets _disabledMinutes', () => {
      function setDisableMinute(time: SelectedTime, type: 'min' | 'max', valueType?: SelectedTime) {
        let disabled: {}[];

        component = fixture.componentInstance;
        component[type] = valueType || time;
        component.value = time;
        component.ngOnInit();
        component['_showMinutesClock']();
        disabled = component['_disabledMinutes'].filter(minute => minute === false);

        return disabled;
      }

      test('should sets disabled minutes for min === time', () => {
        for (let i = 0; i < 60; i++) {
          expect(setDisableMinute({ h: '00', m: `${i}`, ampm: 'AM' }, 'min')).toHaveLength(60 - i);
        }
      });

      test('should sets disabled minutes for max === time', () => {
        for (let i = 0; i < 60; i++) {
          expect(setDisableMinute({ h: '00', m: `${i}`, ampm: 'AM' }, 'max')).toHaveLength(i + 1);
        }
      });

      test('should sets disabled minutes for time > min', () => {
        expect(
          setDisableMinute({ h: '02', m: `15`, ampm: 'AM' }, 'min', {
            h: '00',
            m: `00`,
            ampm: 'AM',
          })
        ).toHaveLength(60);
      });

      test('should sets disabled minutes for max > time', () => {
        expect(
          setDisableMinute({ h: '02', m: `15`, ampm: 'AM' }, 'max', {
            h: '00',
            m: `00`,
            ampm: 'AM',
          })
        ).toHaveLength(0);
      });

      test('should sets disabled every minutes for min > time', () => {
        expect(
          setDisableMinute({ h: '00', m: `15`, ampm: 'AM' }, 'min', {
            h: '15',
            m: `00`,
            ampm: 'AM',
          })
        ).toHaveLength(0);
      });

      test('should sets disabled every minutes for time > max', () => {
        expect(
          setDisableMinute({ h: '00', m: `15`, ampm: 'AM' }, 'max', {
            h: '15',
            m: `00`,
            ampm: 'AM',
          })
        ).toHaveLength(60);
      });

      test.todo('should sets disabled minutes for min.h = max.h but max.m > min.m');
      test.todo('should sets disabled minutes for min.h = max.h but min.m > max.m');
      test.todo('should sets disabled minutes for min.h = max.h but min.m = max.m');
    });

    describe('should sets @ViewChild', () => {
      test('should sets plate', () => {
        expect(component.plate).toBeTruthy();
      });
      test('should sets hand', () => {
        expect(component.plate).toBeTruthy();
      });
      test('should sets fg', () => {
        expect(component.plate).toBeTruthy();
      });
      test('should sets bg', () => {
        expect(component.plate).toBeTruthy();
      });
      test('should sets focus', () => {
        expect(component.plate).toBeTruthy();
      });
      test('should sets digitalMinute', () => {
        expect(component.plate).toBeTruthy();
      });
    });
  });

  describe('should invoke events', () => {
    describe('should inoke minute digital events', () => {
      test('should change _showHours to false on click', () => {
        const minuteDigital = de.query(By.css('.minute-digital'));
        expect(component['_showHours']).toBeTruthy();
        dispatchKeyboardEvent(minuteDigital.nativeElement, 'click');
        expect(component['_showHours']).toBeFalsy();
      });

      test('should add active class on click', () => {
        const minuteDigital = de.query(By.css('.minute-digital'));
        expect(minuteDigital.classes.active).toBeFalsy();
        dispatchKeyboardEvent(minuteDigital.nativeElement, 'click');
        fixture.detectChanges();
        expect(minuteDigital.classes.active).toBeTruthy();
      });

      test('should invoke _showMinutesClock() on click', () => {
        spyOn<any>(component, '_showMinutesClock');
        const minuteDigital = de.query(By.css('.minute-digital'));
        dispatchKeyboardEvent(minuteDigital.nativeElement, 'click');
        fixture.detectChanges();
        expect(component['_showMinutesClock']).toHaveBeenCalledTimes(1);
      });

      test('should invoke _showMinutesClock() on enter', () => {
        const minuteDigital = de.query(By.css('.minute-digital'));
        expect(component['_showHours']).toBeTruthy();
        expect(minuteDigital.classes.active).toBeFalsy();
        dispatchKeyboardEvent(minuteDigital.nativeElement, 'keydown', ENTER, 'Enter');
        fixture.detectChanges();
        expect(component['_showHours']).toBeFalsy();
        expect(minuteDigital.classes.active).toBeTruthy();
      });

      test('should invoke _arrowChangeMinute on ArrowUp', () => {
        spyOn<any>(component, '_arrowChangeMinute');
        const minuteDigital = de.query(By.css('.minute-digital'));
        dispatchKeyboardEvent(minuteDigital.nativeElement, 'keydown', UP_ARROW, 'ArrowUp');
        expect(component['_arrowChangeMinute']).toHaveBeenCalledTimes(1);
        dispatchKeyboardEvent(minuteDigital.nativeElement, 'keydown', UP_ARROW, 'ArrowUp');
        dispatchKeyboardEvent(minuteDigital.nativeElement, 'keydown', UP_ARROW, 'ArrowUp');
        expect(component['_arrowChangeMinute']).toHaveBeenCalledTimes(3);
      });

      test('should invoke _arrowChangeMinute on ArrowDown', () => {
        spyOn<any>(component, '_arrowChangeMinute');
        const minuteDigital = de.query(By.css('.minute-digital'));
        dispatchKeyboardEvent(minuteDigital.nativeElement, 'keydown', UP_ARROW, 'ArrowDown');
        expect(component['_arrowChangeMinute']).toHaveBeenCalledTimes(1);
        dispatchKeyboardEvent(minuteDigital.nativeElement, 'keydown', UP_ARROW, 'ArrowDown');
        dispatchKeyboardEvent(minuteDigital.nativeElement, 'keydown', UP_ARROW, 'ArrowDown');
        expect(component['_arrowChangeMinute']).toHaveBeenCalledTimes(3);
      });

      test('should active minute digital on Arrow Up', () => {
        const minuteDigital = de.query(By.css('.minute-digital'));
        expect(component['_showHours']).toBeTruthy();
        expect(minuteDigital.classes.active).toBeFalsy();
        dispatchKeyboardEvent(minuteDigital.nativeElement, 'keydown', UP_ARROW, 'ArrowUp');

        fixture.detectChanges();
        expect(component['_showHours']).toBeFalsy();
        expect(minuteDigital.classes.active).toBeTruthy();
      });

      test('should active minute digital on Arrow Down', () => {
        const minuteDigital = de.query(By.css('.minute-digital'));
        expect(component['_showHours']).toBeTruthy();
        expect(minuteDigital.classes.active).toBeFalsy();
        dispatchKeyboardEvent(minuteDigital.nativeElement, 'keydown', UP_ARROW, 'ArrowDown');

        fixture.detectChanges();
        expect(component['_showHours']).toBeFalsy();
        expect(minuteDigital.classes.active).toBeTruthy();
      });

      test('should change minute on Arrow Up', () => {
        component = fixture.componentInstance;
        const minuteDigital = de.query(By.css('.minute-digital'));
        expect(component['_selectedTime'].m).toBe('00');
        dispatchKeyboardEvent(minuteDigital.nativeElement, 'keydown', UP_ARROW, 'ArrowUp');
        expect(component['_selectedTime'].m).toBe('01');
        dispatchKeyboardEvent(minuteDigital.nativeElement, 'keydown', UP_ARROW, 'ArrowUp');
        dispatchKeyboardEvent(minuteDigital.nativeElement, 'keydown', UP_ARROW, 'ArrowUp');
        expect(component['_selectedTime'].m).toBe('03');
      });

      test('should change minute on Arrow Down', () => {
        component = fixture.componentInstance;
        const minuteDigital = de.query(By.css('.minute-digital'));
        expect(component['_selectedTime'].m).toBe('03');
        dispatchKeyboardEvent(minuteDigital.nativeElement, 'keydown', UP_ARROW, 'ArrowDown');
        expect(component['_selectedTime'].m).toBe('02');
        dispatchKeyboardEvent(minuteDigital.nativeElement, 'keydown', UP_ARROW, 'ArrowDown');
        dispatchKeyboardEvent(minuteDigital.nativeElement, 'keydown', UP_ARROW, 'ArrowDown');
        expect(component['_selectedTime'].m).toBe('00');
      });
    });

    describe('should inoke hours digital events', () => {
      test('should change _showHours to true on click', () => {
        const hourDigital = de.query(By.css('.hour-digital'));
        component['_showHours'] = false;
        expect(component['_showHours']).toBeFalsy();
        dispatchKeyboardEvent(hourDigital.nativeElement, 'click');
        expect(component['_showHours']).toBeTruthy();
      });

      test('should add active class on click', () => {
        const hourDigital = de.query(By.css('.hour-digital'));
        component['_showHours'] = false;
        fixture.detectChanges();
        expect(hourDigital.classes.active).toBeFalsy();
        dispatchKeyboardEvent(hourDigital.nativeElement, 'click');
        fixture.detectChanges();
        expect(hourDigital.classes.active).toBeTruthy();
      });

      test('should invoke _showHoursClock() on click', () => {
        spyOn<any>(component, '_showHoursClock');
        const hourDigital = de.query(By.css('.hour-digital'));
        dispatchKeyboardEvent(hourDigital.nativeElement, 'click');
        fixture.detectChanges();
        expect(component['_showHoursClock']).toHaveBeenCalledTimes(1);
      });

      test('should invoke _showHoursClock() on enter', () => {
        const hourDigital = de.query(By.css('.hour-digital'));
        component['_showHours'] = false;
        fixture.detectChanges();
        expect(component['_showHours']).toBeFalsy();
        expect(hourDigital.classes.active).toBeFalsy();
        dispatchKeyboardEvent(hourDigital.nativeElement, 'keydown', ENTER, 'Enter');
        fixture.detectChanges();
        expect(component['_showHours']).toBeTruthy();
        expect(hourDigital.classes.active).toBeTruthy();
      });

      test('should invoke _arrowChangeHour on ArrowUp', () => {
        spyOn<any>(component, '_arrowChangeHour');
        const hourDigital = de.query(By.css('.hour-digital'));
        dispatchKeyboardEvent(hourDigital.nativeElement, 'keydown', UP_ARROW, 'ArrowUp');
        expect(component['_arrowChangeHour']).toHaveBeenCalledTimes(1);
        dispatchKeyboardEvent(hourDigital.nativeElement, 'keydown', UP_ARROW, 'ArrowUp');
        dispatchKeyboardEvent(hourDigital.nativeElement, 'keydown', UP_ARROW, 'ArrowUp');
        expect(component['_arrowChangeHour']).toHaveBeenCalledTimes(3);
      });

      test('should invoke _arrowChangeHour on ArrowDown', () => {
        spyOn<any>(component, '_arrowChangeHour');
        const hourDigital = de.query(By.css('.hour-digital'));
        dispatchKeyboardEvent(hourDigital.nativeElement, 'keydown', UP_ARROW, 'ArrowDown');
        expect(component['_arrowChangeHour']).toHaveBeenCalledTimes(1);
        dispatchKeyboardEvent(hourDigital.nativeElement, 'keydown', UP_ARROW, 'ArrowDown');
        dispatchKeyboardEvent(hourDigital.nativeElement, 'keydown', UP_ARROW, 'ArrowDown');
        expect(component['_arrowChangeHour']).toHaveBeenCalledTimes(3);
      });

      test('should active hour digital on Arrow Up', () => {
        const hourDigital = de.query(By.css('.hour-digital'));
        component['_showHours'] = false;
        fixture.detectChanges();

        expect(component['_showHours']).toBeFalsy();
        expect(hourDigital.classes.active).toBeFalsy();
        dispatchKeyboardEvent(hourDigital.nativeElement, 'keydown', UP_ARROW, 'ArrowUp');

        fixture.detectChanges();
        expect(component['_showHours']).toBeTruthy();
        expect(hourDigital.classes.active).toBeTruthy();
      });

      test('should active hour digital on Arrow Down', () => {
        const hourDigital = de.query(By.css('.hour-digital'));
        component['_showHours'] = false;
        fixture.detectChanges();

        expect(component['_showHours']).toBeFalsy();
        expect(hourDigital.classes.active).toBeFalsy();
        dispatchKeyboardEvent(hourDigital.nativeElement, 'keydown', UP_ARROW, 'ArrowDown');

        fixture.detectChanges();
        expect(component['_showHours']).toBeTruthy();
        expect(hourDigital.classes.active).toBeTruthy();
      });

      test('should change hour on Arrow Up', () => {
        component = fixture.componentInstance;
        const hourDigital = de.query(By.css('.hour-digital'));
        expect(component['_selectedTime'].h).toBe('12');
        dispatchKeyboardEvent(hourDigital.nativeElement, 'keydown', UP_ARROW, 'ArrowUp');
        expect(component['_selectedTime'].h).toBe('13');
        dispatchKeyboardEvent(hourDigital.nativeElement, 'keydown', UP_ARROW, 'ArrowUp');
        dispatchKeyboardEvent(hourDigital.nativeElement, 'keydown', UP_ARROW, 'ArrowUp');
        expect(component['_selectedTime'].h).toBe('15');
      });

      test('should change hour on Arrow Down', () => {
        component = fixture.componentInstance;
        const hourDigital = de.query(By.css('.hour-digital'));
        expect(component['_selectedTime'].h).toBe('15');
        dispatchKeyboardEvent(hourDigital.nativeElement, 'keydown', UP_ARROW, 'ArrowDown');
        expect(component['_selectedTime'].h).toBe('14');
        dispatchKeyboardEvent(hourDigital.nativeElement, 'keydown', UP_ARROW, 'ArrowDown');
        dispatchKeyboardEvent(hourDigital.nativeElement, 'keydown', UP_ARROW, 'ArrowDown');
        expect(component['_selectedTime'].h).toBe('12');
      });

      test('should change hour and AMPM type on Arrow Up for 12 type', () => {
        component = fixture.componentInstance;
        component.twelveHour = true;
        fixture.detectChanges();
        const hourDigital = de.query(By.css('.hour-digital'));
        expect(component['_selectedTime'].h).toBe('12');
        expect(component['_selectedTime'].ampm).toBe('AM');
        dispatchKeyboardEvent(hourDigital.nativeElement, 'keydown', UP_ARROW, 'ArrowUp');
        expect(component['_selectedTime'].h).toBe('01');
        expect(component['_selectedTime'].ampm).toBe('PM');
        dispatchKeyboardEvent(hourDigital.nativeElement, 'keydown', UP_ARROW, 'ArrowUp');
        dispatchKeyboardEvent(hourDigital.nativeElement, 'keydown', UP_ARROW, 'ArrowUp');
        expect(component['_selectedTime'].h).toBe('03');
      });

      test('should change hour and AMPM type on Arrow Down 12 type', () => {
        component = fixture.componentInstance;
        const hourDigital = de.query(By.css('.hour-digital'));
        component.twelveHour = true;
        fixture.detectChanges();
        expect(component['_selectedTime'].ampm).toBe('PM');
        expect(component['_selectedTime'].h).toBe('03');
        dispatchKeyboardEvent(hourDigital.nativeElement, 'keydown', UP_ARROW, 'ArrowDown');
        expect(component['_selectedTime'].h).toBe('02');
        dispatchKeyboardEvent(hourDigital.nativeElement, 'keydown', UP_ARROW, 'ArrowDown');
        dispatchKeyboardEvent(hourDigital.nativeElement, 'keydown', UP_ARROW, 'ArrowDown');
        expect(component['_selectedTime'].h).toBe('12');
        expect(component['_selectedTime'].ampm).toBe('AM');
      });

      test('should change hour and AMPM type on Arrow Down from 12', () => {
        console.log('');
      });
    });
  });
});
