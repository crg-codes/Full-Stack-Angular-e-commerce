import {
  AfterContentChecked,
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  Inject,
  Input,
  OnInit,
  Output,
  PLATFORM_ID,
  Renderer2,
  ViewChild,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  NgZone,
  HostListener,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';

export const TIME_PIRCKER_VALUE_ACCESSOT: any = {
  provide: NG_VALUE_ACCESSOR,
  // tslint:disable-next-line: no-use-before-declare
  useExisting: forwardRef(() => ClockPickerComponent),
  multi: true,
};

@Component({
  selector: 'mdb-time-picker',
  templateUrl: './timepicker.component.html',
  styleUrls: ['./time-picker-module.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TIME_PIRCKER_VALUE_ACCESSOT],
})
export class ClockPickerComponent
  implements OnInit, AfterViewInit, ControlValueAccessor, AfterContentChecked {
  @ViewChild('hoursPlate', { static: true }) public hoursPlate: ElementRef;
  @ViewChild('minutesPlate', { static: true }) public minutesPlate: ElementRef;

  @ViewChild('plate', { static: true }) public plate: ElementRef;
  @ViewChild('svg', { static: true }) public svg: ElementRef;
  @ViewChild('g', { static: true }) public g: ElementRef;
  @ViewChild('hand', { static: true }) public hand: ElementRef;
  @ViewChild('fg', { static: true }) public fg: ElementRef;
  @ViewChild('bg', { static: true }) public bg: ElementRef;
  @ViewChild('bearing', { static: true }) public bearing: ElementRef;

  @Input() twelvehour = false;
  @Input() darktheme = false;
  @Input() placeholder: String = '';
  @Input() label = '';
  @Input() duration = 300;
  @Input() showClock = false;
  @Input() buttonLabel = 'Done';
  @Input() buttonClear = true;
  @Input() buttonClose = false;
  @Input() buttonClearLabel = 'Clear';
  @Input() buttonCloseLabel = 'Close';
  @Input() disabled = false;
  @Input() tabIndex: any;
  @Input() outlineInput = false;
  @Input() openOnFocus = true;
  @Input() readonly = false;
  @Input() ampmClass = '';
  @Input() footerClass = '';
  @Output() timeChanged: EventEmitter<string> = new EventEmitter<string>();
  isOpen = false;
  isMobile: any = null;
  touchDevice = 'ontouchstart' in (document.documentElement as any);
  showHours = false;
  moveEvent: string;
  tapEvent: string;

  public elements = document.getElementsByClassName('clockpicker');
  public elementNumber: any;

  dialRadius = 135;
  outerRadius = 110;
  innerRadius = 80;
  tickRadius = 20;
  diameter = this.dialRadius * 2;
  isBrowser: any = false;

  hoursTicks: any = [];
  minutesTicks: any = [];
  selectedHours: any = { h: '12', m: '00', ampm: 'AM' };
  endHours = '';

  touchSupported: any = 'ontouchstart' in window;
  mousedownEvent: any = 'mousedown' + (this.touchSupported ? ' touchstart' : '');
  mousemoveEvent: any = 'mousemove' + (this.touchSupported ? ' touchmove' : '');
  mouseupEvent: any = 'mouseup' + (this.touchSupported ? ' touchend' : '');
  isMouseDown = false;
  documentClickFun: Function;
  constructor(
    public elem: ElementRef,
    public renderer: Renderer2,
    private _cdRef: ChangeDetectorRef,
    private _ngZone: NgZone,
    @Inject(DOCUMENT) private _document: any,
    @Inject(PLATFORM_ID) platformId: string
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    renderer.listen(this.elem.nativeElement, 'click', (event: any) => {
      if (
        this.showClock &&
        event.target &&
        this.elem.nativeElement !== event.target &&
        !this.elem.nativeElement.contains(event.target)
      ) {
        this.showClock = false;
      }
      if (event.target.classList.contains('picker__holder')) {
        this.showClock = false;
      }
    });
  }

  @HostListener('touchmove', ['$event']) ontouchmove(event: any) {
    this.mousedown(event);
  }

  ngOnInit() {
    this.generateTick();
    if (this.isBrowser) {
      this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    }

    this.isOpen = this.showClock;
    this._handleOutsideClick();
  }

  ngAfterViewInit() {
    ['mousedown', 'mouseup'].forEach((event: any) => {
      this.renderer.listen(
        this.elem.nativeElement.querySelector('.clockpicker-plate'),
        event,
        (ev: any) => {
          if (event === 'mousedown') {
            this.mousedown(ev, false);
            this.isMouseDown = true;
          } else {
            this.isMouseDown = false;
          }
        }
      );
    });
  }

  ngAfterContentChecked() {
    if (this.isBrowser) {
      // Fix for visible date / time picker input when picker plate is visible.
      try {
        const openedPicker: any = document.querySelector('.picker--opened');
        const allPickers: any = document.querySelectorAll('.picker');
        allPickers.forEach((element: any) => {
          this.renderer.setStyle(element, 'z-index', '0');
        });
        this.renderer.setStyle(openedPicker, 'z-index', '1000');
      } catch (error) {}
    }
  }

  checkDraw() {
    let value;
    const isHours = this.showHours;
    if (isHours) {
      value = parseInt(this.selectedHours.h, 0);
    } else {
      value = parseInt(this.selectedHours.m, 0);
    }

    const unit = Math.PI / (isHours ? 6 : 30),
      radian = value * unit,
      radius = isHours && value > 0 && value < 13 ? this.innerRadius : this.outerRadius,
      xd = Math.sin(radian) * radius,
      yd = -Math.cos(radian) * radius;
    this.setHand(xd, yd, false);
  }

  mousedown(e: any, space?: any) {
    const offset = this.plate.nativeElement.getBoundingClientRect(),
      isTouch = /^touch/.test(e.type),
      x0 = offset.left + this.dialRadius,
      y0 = offset.top + this.dialRadius,
      dx = (isTouch ? e.touches[0] : e).clientX - x0,
      dy = (isTouch ? e.touches[0] : e).clientY - y0,
      z = Math.sqrt(dx * dx + dy * dy);
    let moved = false;

    if (
      space &&
      (z < this.outerRadius - this.tickRadius || z > this.outerRadius + this.tickRadius)
    ) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    if (this.showHours) {
      this.setHand(dx, dy, true);
    } else {
      this.setHand(dx, dy, false);
    }

    const mousemoveEventMethod = (event: any) => {
      event.preventDefault();
      event.stopPropagation();
      const x = event.clientX - x0,
        y = event.clientY - y0;
      if (!moved && x === dx && y === dy) {
        return;
      }
      moved = true;

      this._ngZone.run(() => {
        this.setHand(x, y, false);
      });
    };

    const mouseupEventMethod = (event: any) => {
      this._document.removeEventListener(this.mousemoveEvent, mousemoveEventMethod);
      e.preventDefault();
      const x = event.clientX - x0,
        y = event.clientX - y0;
      if ((space || moved) && x === dx && y === dy) {
        this.setHand(x, y, false);
      }
      this.showMinutesClock();
      this._document.removeEventListener(this.mouseupEvent, mouseupEventMethod);
    };

    this._ngZone.runOutsideAngular(() => {
      this._document.addEventListener(this.mousemoveEvent, mousemoveEventMethod);
      this._document.addEventListener(this.mouseupEvent, mouseupEventMethod);
    });
  }

  hideKeyboard() {
    // this set timeout needed for case when hideKeyborad
    // is called inside of 'onfocus' event handler
    try {
      setTimeout(() => {
        // creating temp field
        const field = this.renderer.createElement('input');
        this.renderer.appendChild(this.elem.nativeElement, field);
        const inputReference = this.elem.nativeElement.lastElementChild;
        this.renderer.setAttribute(inputReference, 'type', 'text');
        this.renderer.setAttribute(inputReference, 'type', 'text');
        this.renderer.setStyle(inputReference, 'opacity', '0');
        this.renderer.setStyle(inputReference, '-webkit-user-modify', 'read-write-plaintext-only');
        // // hiding temp field from peoples eyes
        // // -webkit-user-modify is nessesary for Android 4.x
        // adding onfocus event handler for out temp field
        field.onfocus = () => {
          // this timeout of 200ms is nessasary for Android 2.3.x
          setTimeout(() => {
            this.renderer.setStyle(field, 'display', 'none');
            setTimeout(() => {
              this.renderer.removeChild(this.elem.nativeElement, field);
              document.body.focus();
            }, 0);
          }, 0);
        };
        // focusing it
        field.focus();
      }, 0);
    } catch (error) {}
  }

  onFocusInput(): void {
    if (this.openOnFocus && !this.isOpen) {
      this.openBtnClicked();
    }
  }

  openBtnClicked(): void {
    this.isOpen = true;
    this.showClock = true;
    this.showHours = true;
    this.checkDraw();
    if (this.isMobile) {
      this.hideKeyboard();
    }
    this._handleOutsideClick();
    this._cdRef.markForCheck();
  }

  private _handleOutsideClick() {
    const pickerHolder = this.elem.nativeElement.querySelector('.picker__holder');
    this.documentClickFun = this.renderer.listen(pickerHolder, 'click', (event: any) => {
      const wrapper = this.elem.nativeElement.querySelector('.picker__wrap');

      if (this.isOpen && !wrapper.contains(event.target)) {
        this.close();
      }
    });
  }

  closeBtnClicked() {
    this.isOpen = false;
    const h = this.selectedHours.h;
    const m = this.selectedHours.m;
    const ampm = this.selectedHours.ampm;

    if (this.twelvehour) {
      this.endHours = h + ':' + m + ampm;
    } else {
      this.endHours = h + ':' + m;
    }
    this.onChangeCb(this.endHours);
    this.onTouchedCb();
    this.timeChanged.emit(this.endHours);
    this.showClock = false;

    if (this.documentClickFun) {
      this.documentClickFun();
    }
    this._cdRef.markForCheck();
  }

  close() {
    this.isOpen = false;
    this.showClock = false;
    this.onTouchedCb();

    if (this.documentClickFun) {
      this.documentClickFun();
    }

    this._cdRef.markForCheck();
  }

  clearTimeInput() {
    this.selectedHours = { h: '12', m: '00', ampm: 'AM' };
    this.endHours = '';
    this._cdRef.markForCheck();
    this.onChangeCb(this.endHours);
    this.onTouchedCb();
    this.timeChanged.emit(this.endHours);
  }

  setHour(hour: String) {
    this.selectedHours.h = hour;
  }

  setMinute(min: String) {
    this.selectedHours.m = min;
  }

  setAmPm(ampm: String) {
    this.selectedHours.ampm = ampm;
  }

  showHoursClock() {
    this.showHours = true;
    this.checkDraw();
  }

  showMinutesClock() {
    this.showHours = false;
    this.checkDraw();
  }

  generateTick() {
    if (this.twelvehour) {
      for (let i = 1; i < 13; i++) {
        const radian = (i / 6) * Math.PI;
        const radius = this.outerRadius;

        const tick = {
          hour: i,
          left: this.dialRadius + Math.sin(radian) * radius - this.tickRadius,
          top: this.dialRadius - Math.cos(radian) * radius - this.tickRadius,
        };
        this.hoursTicks.push(tick);
      }
    } else {
      for (let i = 0; i < 24; i++) {
        const radian = (i / 6) * Math.PI;
        const inner = i > 0 && i < 13;
        const radius = inner ? this.innerRadius : this.outerRadius;
        let h;

        if (i === 0) {
          h = '0' + i.toString();
        } else {
          h = i;
        }

        const tick = {
          hour: h,
          left: this.dialRadius + Math.sin(radian) * radius - this.tickRadius,
          top: this.dialRadius - Math.cos(radian) * radius - this.tickRadius,
        };
        this.hoursTicks.push(tick);
      }
    }

    for (let i = 0; i < 60; i += 5) {
      const radian = (i / 30) * Math.PI;
      let min = i.toString();
      if (i < 10) {
        min = '0' + i.toString();
      }
      const tick = {
        min: min,
        left: this.dialRadius + Math.sin(radian) * this.outerRadius - this.tickRadius,
        top: this.dialRadius - Math.cos(radian) * this.outerRadius - this.tickRadius,
      };
      this.minutesTicks.push(tick);
    }
  }

  setHand(x: any, y: any, roundBy5: any) {
    let radian = Math.atan2(x, -y);
    const isHours = this.showHours;
    const unit = Math.PI / (isHours || roundBy5 ? 6 : 30);
    const z = Math.sqrt(x * x + y * y);
    const inner = isHours && z < (this.outerRadius + this.innerRadius) / 2;
    let radius = inner ? this.innerRadius : this.outerRadius;
    let value;

    if (this.showHours) {
      value = parseInt(this.selectedHours.h, 0);
    } else {
      value = parseInt(this.selectedHours.m, 0);
    }

    if (this.twelvehour) {
      radius = this.outerRadius;
    }

    if (radian < 0) {
      radian = Math.PI * 2 + radian;
    }

    value = Math.round(radian / unit);
    radian = value * unit;

    if (this.twelvehour) {
      if (isHours) {
        if (value === 0) {
          value = 12;
        }
      } else {
        if (roundBy5) {
          value *= 5;
        }
        if (value === 60) {
          value = 0;
        }
      }
    } else {
      if (isHours) {
        value = !inner ? value + 12 : value;
        value = value === 24 ? 0 : value;
        value = inner && value === 0 ? 12 : value;
        value = !inner && value === 12 ? 0 : value;
      } else {
        if (roundBy5) {
          value *= 5;
        }
        if (value === 60) {
          value = 0;
        }
      }
    }

    if (isHours) {
      this.fg.nativeElement.setAttribute('class', 'clockpicker-canvas-fg');
    } else {
      if (value % 5 === 0) {
        this.fg.nativeElement.setAttribute('class', 'clockpicker-canvas-fg');
      } else {
        this.fg.nativeElement.setAttribute('class', 'clockpicker-canvas-fg active');
      }
    }

    const cx1 = Math.sin(radian) * (radius - this.tickRadius),
      cy1 = -Math.cos(radian) * (radius - this.tickRadius),
      cx2 = Math.sin(radian) * radius,
      cy2 = -Math.cos(radian) * radius;

    this.hand.nativeElement.setAttribute('x2', cx1);
    this.hand.nativeElement.setAttribute('y2', cy1);
    this.bg.nativeElement.setAttribute('cx', cx2);
    this.bg.nativeElement.setAttribute('cy', cy2);
    this.fg.nativeElement.setAttribute('cx', cx2);
    this.fg.nativeElement.setAttribute('cy', cy2);

    if (this.showHours) {
      if (value < 10) {
        this.setHour('0' + value.toString());
      } else {
        this.setHour(value.toString());
      }
    } else {
      if (value < 10) {
        this.setMinute('0' + value.toString());
      } else {
        this.setMinute(value.toString());
      }
    }

    this._cdRef.markForCheck();
  }

  offset(obj: any) {
    let left = 0,
      top = 0;

    if (obj.offsetParent) {
      do {
        left += obj.offsetLeft;
        top += obj.offsetTop;
      } while ((obj = obj.offsetParent));
    }
    return { left, top };
  }

  private _getFormattedTime(value: string) {
    const timeArr = value.split(':');
    const minutesVal = timeArr[1];

    const h = timeArr[0];
    const m = minutesVal.slice(0, 2);
    const ampm = minutesVal.length > 2 ? minutesVal.slice(-2) : '';

    return { h, m, ampm };
  }

  onChangeCb: (_: any) => void = () => {};
  onTouchedCb: () => void = () => {};

  writeValue(value: any): void {
    if (value) {
      this.showHours = true;
      const time = this._getFormattedTime(value);
      this.setHour(time.h);
      this.setMinute(time.m);
      this.setAmPm(time.ampm);

      this.endHours = value;
    } else {
      this.clearTimeInput();
    }

    this._cdRef.markForCheck();
  }

  registerOnChange(fn: any): void {
    this.onChangeCb = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouchedCb = fn;
  }
}
