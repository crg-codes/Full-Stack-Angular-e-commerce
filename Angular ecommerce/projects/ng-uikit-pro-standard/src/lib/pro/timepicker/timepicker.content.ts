import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  NgZone,
  OnInit,
  Renderer2,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FocusMonitor } from '@angular/cdk/a11y';
import {
  AmPm,
  ClearButton,
  CloseButton,
  Hour,
  Minute,
  Radius,
  Rounding,
  SelectedTime,
} from './timepicker.interface';
import { MdbTimePickerComponent } from './timepicker.component';

@Component({
  selector: 'mdb-timepicker-content',
  templateUrl: './timepicker.content.html',
  styleUrls: ['./time-picker-module.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MdbTimePickerContentComponent implements OnInit, AfterViewInit {
  @ViewChild('plate', { static: false }) plate: ElementRef;
  @ViewChild('hand', { static: false }) hand: ElementRef;
  @ViewChild('fg', { static: false }) fg: ElementRef;
  @ViewChild('bg', { static: false }) bg: ElementRef;
  @ViewChild('focus', { static: false }) focus: ElementRef;
  @ViewChild('digitalMinute', { static: false }) digitalMinute: ElementRef;

  autoClose: boolean;
  clearButton: ClearButton;
  closeButton: CloseButton;
  max: SelectedTime;
  min: SelectedTime;
  okButton: string;
  picker: MdbTimePickerComponent;
  rounding: Rounding;
  twelveHour: boolean;
  value: SelectedTime;

  private _max: SelectedTime;
  private _min: SelectedTime;
  private _returnHours: string;

  private _disabledHours: boolean[] = [];
  private _disabledMinutes: boolean[] = [];
  private _isMouseDown = false;
  public _hoursTicks: Hour[] = [];
  public _minuteDigitalDisabled = false;
  public _minutesTicks: Minute[] = [];
  public _okButtonDisabled = false;
  public _selectedTime: SelectedTime;
  public _showHours = true;

  private _radius: Radius = {
    dial: 135,
    inner: 80,
    outer: 110,
    tick: 20,
  };

  private _denominator: { [key: number]: number } = {
    1: 30,
    5: 6,
    10: 3,
    15: 2,
    20: 1.5,
    // 30: 1,
    // 60: 0.5
  };

  private touchSupported: boolean = 'ontouchstart' in window;

  constructor(
    private _cdRef: ChangeDetectorRef,
    private _ngZone: NgZone,
    public focusMonitor: FocusMonitor,
    public elem: ElementRef,
    public renderer: Renderer2,
    @Inject(DOCUMENT) private _document: any
  ) {}

  ngOnInit() {
    this._max = this.max;
    this._min = this.min;
    this._selectedTime = this.value;
    const { ampm } = this._selectedTime;

    // Add disabled hours to array for PM and AM Hours
    if (this.twelveHour) {
      this._selectedTime.ampm = ampm === 'PM' ? 'AM' : 'PM';
      this._generateTick();
      this._selectedTime.ampm = this._selectedTime.ampm === 'PM' ? 'AM' : 'PM';
    }
    this._generateTick();
    this._setOkBtnDisabled();
    this._setMinuteDigitalDisabled();
  }

  ngAfterViewInit() {
    ['mousedown', 'mouseup', 'touchend', 'touchstart'].forEach((event: any) => {
      this.renderer.listen(this.plate.nativeElement, event, (ev: any) => {
        if (event === 'mousedown' || event === 'touchstart') {
          this._mousedown(ev, false);
        }
      });
    });
    this._checkDraw();
    setTimeout(() => {
      this.focusMonitor.focusVia(this.focus, 'keyboard');
    }, 0);
  }

  private _checkDraw() {
    const { h, m } = this._selectedTime;
    const value = this._showHours ? parseInt(h, 0) : parseInt(m, 0);

    const unit = Math.PI / (this._showHours ? 6 : 30),
      radian = value * unit,
      radius = this._showHours && value > 0 && value < 13 ? this._radius.inner : this._radius.outer,
      xd = Math.sin(radian) * radius,
      yd = -Math.cos(radian) * radius;

    this.setClockHand(xd, yd);
  }

  private _mousedown(e: any, space?: any) {
    this._isMouseDown = true;
    const offset = this.plate.nativeElement.getBoundingClientRect(),
      isTouch = /^touch/.test(e.type),
      x0 = offset.left + this._radius.dial,
      y0 = offset.top + this._radius.dial,
      dx = (isTouch ? e.touches[0] : e).clientX - x0,
      dy = (isTouch ? e.touches[0] : e).clientY - y0,
      z = Math.sqrt(dx * dx + dy * dy);
    let moved = false;

    if (
      space &&
      (z < this._radius.outer - this._radius.tick || z > this._radius.outer + this._radius.tick)
    ) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    if (this._showHours) {
      this.setClockHand(dx, dy);
    } else {
      this.setClockHand(dx, dy, this.rounding);
    }

    const mousemoveEventMethod = (event: any) => {
      if (!this.touchSupported) {
        event.preventDefault();
      }
      event.stopPropagation();
      // tslint:disable-next-line:no-shadowed-variable
      const isTouch = /^touch/.test(event.type),
        x = (isTouch ? event.touches[0] : event).clientX - x0,
        y = (isTouch ? event.touches[0] : event).clientY - y0;
      if (!moved && x === dx && y === dy) {
        return;
      }
      moved = true;

      this._ngZone.run(() => {
        this.setClockHand(x, y, this.rounding);
      });
    };

    const mouseupEventMethod = (event: any) => {
      this._document.removeEventListener('mousemove', mousemoveEventMethod);
      if (this.touchSupported) {
        this._document.removeEventListener('touchmove', mousemoveEventMethod);
      }
      if (!this.touchSupported) {
        event.preventDefault();
      }
      const x = event.clientX - x0,
        y = event.clientY - y0;

      if ((space || moved) && x === dx && y === dy) {
        this.setClockHand(x, y);
      }

      this._ngZone.run(() => {
        if (this.autoClose && !this._showHours) {
          this._okBtnClicked();
        }
      });

      this._showMinutesClock();
      this.digitalMinute.nativeElement.focus();

      this._isMouseDown = false;

      this._document.removeEventListener('mouseup', mouseupEventMethod);
      if (this.touchSupported) {
        this._document.removeEventListener('touchend', mouseupEventMethod);
      }
      this.picker._emitTimeChangeEvent(this._selectedTime);
    };

    this._document.addEventListener('mousemove', mousemoveEventMethod);
    if (this.touchSupported) {
      this._document.addEventListener('touchmove', mousemoveEventMethod);
    }
    this._document.addEventListener('mouseup', mouseupEventMethod);
    if (this.touchSupported) {
      this._document.addEventListener('touchend', mouseupEventMethod);
    }
  }

  public _closeBtnClicked() {
    // todo this.isOpen = false;
    const { ampm, h, m } = this._selectedTime;
    this._returnHours = this.twelveHour ? `${h}:${m}${ampm}` : `${h}:${m}${ampm}`;

    this.picker.close(false);
  }

  public _clearBtnClicked() {
    this._setAmPm('AM');
    this._setHour(12);
    this._setMinute(0);
    this._generateTick();
    this._showHoursClock();
    this.picker._setValue('');
    this.picker._selectionChange$.next('');
  }

  public _okBtnClicked() {
    if (!this._okButtonDisabled) {
      const { ampm, h, m } = this._selectedTime;
      this._returnHours = this.twelveHour ? `${h}:${m}${ampm}` : `${h}:${m}${ampm}`;

      this.picker._setValue(this._returnHours);
      this.picker._emitTimeDoneEvent(this._selectedTime);
      this.picker.onChangeCb(this._returnHours);
      this.picker.close(true);
    }
  }

  public _arrowChangeHour(key: string) {
    const { h, ampm } = this._to24(this._selectedTime);
    const selectedHour = Number(h);
    const availableHours: number[] = [];
    this._disabledHours.map((hour, index) => !hour && availableHours.push(index));

    let toChange;
    let value =
      key === 'ArrowUp'
        ? availableHours.indexOf(selectedHour) + 1
        : availableHours.indexOf(selectedHour) - 1;

    value = value < 0 ? availableHours.length - 1 : value;
    value = value > availableHours.length - 1 ? 0 : value;
    toChange = availableHours[value];
    if (this.twelveHour) {
      if (toChange >= 12) {
        toChange = toChange - 12;
        if (ampm === 'AM') {
          this._setAmPm('PM');
        }
      } else if (toChange <= 0 || toChange < 12) {
        if (ampm === 'PM') {
          this._setAmPm('AM');
        }
      }
    }
    this._showHoursClock();
    this._setHour(toChange);
    this._checkDraw();
  }

  public _arrowChangeMinute(key: string) {
    if (!this._minuteDigitalDisabled) {
      if (this._showHours) {
        this._showMinutesClock();
      }
      const { m } = this._selectedTime;
      const availableMinutes: number[] = [];

      this._generateMinutesDisable();
      this._disabledMinutes.map((disabled, i) => {
        if (!disabled) {
          availableMinutes.push(i);
        }
      });

      let toChange;
      let value =
        key === 'ArrowUp'
          ? availableMinutes.indexOf(Number(m)) + 1
          : availableMinutes.indexOf(Number(m)) - 1;

      value = value < 0 ? availableMinutes.length - 1 : value;
      value = value > availableMinutes.length - 1 ? 0 : value;
      toChange = availableMinutes[value];
      this._setMinute(toChange);
      this._checkDraw();
    }
  }

  private _generateMinutesDisable() {
    for (let i = 0; i < 60; i++) {
      const disableByRounding = this.rounding > 1 && i % this.rounding !== 0;
      const disabled =
        this._rangeMinute(i, 'min') || this._rangeMinute(i, 'max') || disableByRounding;
      this._disabledMinutes[i] = disabled;
    }
  }

  public _setHour(hour: number) {
    if (Number(this._selectedTime.h) !== hour) {
      if (this.twelveHour) {
        hour = hour <= 0 ? 12 : hour;
        hour = hour > 12 ? 1 : hour;
      } else {
        hour = hour >= 24 ? 0 : hour;
        hour = hour <= -1 ? 23 : hour;
      }

      this._selectedTime.h = hour >= 10 ? `${hour}` : `0${hour}`;
      this._setMinuteDigitalDisabled();
    }
  }

  private _setMinute(min: number) {
    if (Number(this._selectedTime.m) !== min) {
      min = min >= 60 ? 0 : min;
      min = min <= -1 ? 59 : min;
      this._selectedTime.m = min >= 10 ? `${min}` : `0${min}`;
      this._setOkBtnDisabled();
    }
  }

  public _setAmPm(ampm: AmPm) {
    this._selectedTime.ampm = ampm;
    this._generateTick();
    this._setOkBtnDisabled();
    this._setMinuteDigitalDisabled();
    this._checkDraw();
    this.picker._emitTimeChangeEvent(this._selectedTime);
  }

  public _showHoursClock() {
    this._generateTick();
    this._showHours = true;
    this._setOkBtnDisabled();
    this._checkDraw();
  }

  public _showMinutesClock() {
    if (!this._minuteDigitalDisabled) {
      this._showHours = false;
      this._generateTick();
      this._setOkBtnDisabled();

      this._generateMinutesDisable();
      if (this._disabledMinutes[Number(this._selectedTime.m)] === true) {
        this._setMinute(this._disabledMinutes.indexOf(false));
      }

      this._checkDraw();
    }
  }

  private _generateTick() {
    if (this.twelveHour) {
      this._hoursTicks = [];
      for (let i = 1; i < 13; i++) {
        const radian = (i / 6) * Math.PI;

        const tick = {
          hour: i.toString(),
          left: this._radius.dial + Math.sin(radian) * this._radius.outer - this._radius.tick,
          top: this._radius.dial - Math.cos(radian) * this._radius.outer - this._radius.tick,
          disabled: this._rangeHour(i, 'min') || this._rangeHour(i, 'max'),
        };
        this._hoursTicks.push(tick);
      }
    } else {
      this._hoursTicks = [];
      for (let i = 0; i < 24; i++) {
        const radian = (i / 6) * Math.PI;
        const inner = i > 0 && i < 13;
        const radius = inner ? this._radius.inner : this._radius.outer;
        const hour = i === 0 ? '0' + i.toString() : i.toString();

        const tick = {
          hour,
          left: this._radius.dial + Math.sin(radian) * radius - this._radius.tick,
          top: this._radius.dial - Math.cos(radian) * radius - this._radius.tick,
          disabled: this._rangeHour(i, 'min') || this._rangeHour(i, 'max'),
        };
        this._hoursTicks.push(tick);
      }
    }

    this._minutesTicks = [];
    for (let i = 0; i < 60; i += 5) {
      const radian = (i / 30) * Math.PI;
      const disableByRounding = this.rounding > 1 && i % this.rounding !== 0;
      const min = i < 10 ? '0' + i.toString() : i.toString();

      const tick = {
        min,
        left: this._radius.dial + Math.sin(radian) * this._radius.outer - this._radius.tick,
        top: this._radius.dial - Math.cos(radian) * this._radius.outer - this._radius.tick,
        disabled: this._rangeMinute(i, 'min') || this._rangeMinute(i, 'max') || disableByRounding,
      };
      this._minutesTicks.push(tick);
    }
  }

  private setClockHand(x: any, y: any, roundBy?: number) {
    let radian = Math.atan2(x, -y);
    const isHours = this._showHours;
    const unit = Math.PI / (isHours ? 6 : roundBy ? this._denominator[roundBy] : 30);
    const z = Math.sqrt(x * x + y * y);
    const inner = isHours && z < (this._radius.outer + this._radius.inner) / 2;
    let value = this._showHours
      ? parseInt(this._selectedTime.h, 0)
      : parseInt(this._selectedTime.m, 0);
    const radius = inner && !this.twelveHour ? this._radius.inner : this._radius.outer;

    if (radian < 0) {
      radian = Math.PI * 2 + radian;
    }

    value = Math.round(radian / unit);
    radian = value * unit;

    if (this.twelveHour && isHours) {
      if (value === 0) {
        value = 12;
      }

      if (this._isMouseDown) {
        if (isHours && (this._rangeHour(value, 'min') || this._rangeHour(value, 'max'))) {
          return;
        }
      }
    } else if (!this.twelveHour && isHours) {
      value = !inner ? value + 12 : value;
      value = value === 24 ? 0 : value;
      value = inner && value === 0 ? 12 : value;
      value = !inner && value === 12 ? 0 : value;

      if (this._isMouseDown) {
        if (isHours && (this._rangeHour(value, 'min') || this._rangeHour(value, 'max'))) {
          return;
        }
      }
    } else {
      if (roundBy) {
        value *= roundBy;
      }
      if (value === 60) {
        value = 0;
      }
    }

    if (isHours) {
      this.fg.nativeElement.setAttribute('class', 'mdb-timepicker-canvas-fg');
    } else {
      if (this._rangeMinute(value, 'min') || this._rangeMinute(value, 'max')) {
        this._cdRef.markForCheck();
        return;
      }

      if (value % 5 === 0) {
        this.fg.nativeElement.setAttribute('class', 'mdb-timepicker-canvas-fg');
      } else {
        this.fg.nativeElement.setAttribute('class', 'mdb-timepicker-canvas-fg active');
      }
    }

    const cx1 = Math.sin(radian) * (radius - this._radius.tick),
      cy1 = -Math.cos(radian) * (radius - this._radius.tick),
      cx2 = Math.sin(radian) * radius,
      cy2 = -Math.cos(radian) * radius;

    this.hand.nativeElement.setAttribute('x2', cx1);
    this.hand.nativeElement.setAttribute('y2', cy1);
    this.bg.nativeElement.setAttribute('cx', cx2);
    this.bg.nativeElement.setAttribute('cy', cy2);
    this.fg.nativeElement.setAttribute('cx', cx2);
    this.fg.nativeElement.setAttribute('cy', cy2);

    if (this._showHours) {
      if (value !== Number(this._selectedTime.h)) {
        this._setHour(value);
        this._setMinuteDigitalDisabled();
      }
    } else {
      if (value !== Number(this._selectedTime.m)) {
        this._setMinute(value);
      }
    }
    this._cdRef.markForCheck();
  }

  private _to24(time: SelectedTime): SelectedTime {
    let hour = time.ampm === 'PM' ? Number(time.h) + 12 : Number(time.h);
    hour = hour === 12 ? 0 : hour;
    hour = hour === 24 ? 12 : hour;
    return {
      ...time,
      h: `${hour}`,
    };
  }

  private _rangeHour(index: number, range: 'min' | 'max') {
    let status = false;
    const i = Number(this._to24({ ...this._selectedTime, h: `${index}` }).h);

    if (!this.twelveHour) {
      const minH = this.min && Number(this._min.h);
      const maxH = this.max && Number(this._max.h);

      if (range === 'min' && this.min) {
        status = index < minH;

        if (status && this._max && this._max.h < this._min.h) {
          status = false;
        }
      } else if (range === 'max' && this.max) {
        status = index > maxH;

        if (status && this._min && this._min.h > this._max.h && minH <= index) {
          status = false;
        }
      }
    } else {
      const min = this._min && Number(this._to24(this._min).h);
      const max = this._max && Number(this._to24(this._max).h);
      if (range === 'min' && this.min) {
        status = i < min;
      }

      if (range === 'max' && this.max) {
        status = i > max;
      }

      if (min > max) {
        status = false;
        status = min > i && i > max;
      }
    }

    this._disabledHours[i] = status;

    return status;
  }

  private _rangeMinute(index: number, range: 'min' | 'max') {
    let status = false;
    if (!this._showHours) {
      if (range === 'min' && this.min) {
        const isSameHour = this._min.h === this._selectedTime.h;
        const value = index < Number(this._min.m);
        status = value && isSameHour;
      } else if (range === 'max' && this.max) {
        const isSameHour = this._max.h === this._selectedTime.h;
        const value = index > Number(this._max.m);
        status = value && isSameHour;
      }
    }

    if (this.twelveHour) {
      const min = this._min && Number(this._to24(this._min).h);
      const max = this._max && Number(this._to24(this._max).h);
      const i = Number(this._to24(this._selectedTime).h);

      if (range === 'min' && min) {
        status = i === min && index < Number(this._min.m);
      } else if (range === 'max' && max) {
        status = i === max && index > Number(this._max.m);
      }
      status = status || this._disabledHours[i];
    }

    return status;
  }

  private _setOkBtnDisabled = () => {
    const hour = Number(this._to24(this._selectedTime).h);
    this._okButtonDisabled = this._disabledHours[hour];

    if (!this._okButtonDisabled) {
      if (
        this._min &&
        this._selectedTime.h === this._min.h &&
        this._selectedTime.ampm === this._min.ampm
      ) {
        this._okButtonDisabled = this._selectedTime.m < this._min.m;
      }

      if (
        this._max &&
        this._selectedTime.h === this._max.h &&
        this._selectedTime.ampm === this._max.ampm
      ) {
        this._okButtonDisabled = this._selectedTime.m > this._max.m;
      }
    }
  };

  private _setMinuteDigitalDisabled() {
    const { h } = this._to24(this._selectedTime);
    this._minuteDigitalDisabled = this._disabledHours[Number(h)];
  }
}
