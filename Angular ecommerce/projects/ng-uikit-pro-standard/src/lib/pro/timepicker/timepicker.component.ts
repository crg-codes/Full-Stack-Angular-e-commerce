import {
  Component,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  ViewContainerRef,
  ComponentRef,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
} from '@angular/core';
import { OverlayRef, Overlay, OverlayConfig } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { merge } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ESCAPE } from '../../free/utils/keyboard-navigation';
import { MdbTimePickerContentComponent } from './timepicker.content';
import { ClearButton, Rounding, SelectedTime, CloseButton } from './timepicker.interface';
import { Subject } from 'rxjs';

@Component({
  template: '',
  selector: 'mdb-timepicker',
  exportAs: 'mdbTimePicker',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MdbTimePickerComponent implements OnDestroy {
  @Input() autoClose = false;
  @Input() clearButton: ClearButton = 'clear';
  @Input() closeButton: CloseButton = 'close';
  @Input() max: string;
  @Input() min: string;
  @Input() okButton = 'ok';
  @Input() rounding: Rounding = 1;
  @Input() twelveHour = true;

  @Output() timeChange: EventEmitter<object> = new EventEmitter<object>();
  @Output() cancel: EventEmitter<object> = new EventEmitter<object>();
  @Output() done: EventEmitter<object> = new EventEmitter<object>();
  @Output() show: EventEmitter<object> = new EventEmitter<object>();

  private _value = '12:00AM';
  private _contentRef: ComponentRef<MdbTimePickerContentComponent>;
  private _overlayRef: OverlayRef | null;
  private _portal: ComponentPortal<MdbTimePickerContentComponent>;
  public input: any;

  public _selectionChange$ = new Subject<string>();

  constructor(
    private _overlay: Overlay,
    private _vcr: ViewContainerRef // private _cdRef: ChangeDetectorRef
  ) {}

  protected _patchInputValues() {
    this._contentRef.instance.picker = this;
    this._contentRef.instance.autoClose = this.autoClose;
    this._contentRef.instance.clearButton = this.clearButton;
    this._contentRef.instance.closeButton = this.closeButton;
    this._contentRef.instance.okButton = this.okButton;
    this._contentRef.instance.rounding = this.rounding;
    this._contentRef.instance.twelveHour = this.twelveHour;
    this._contentRef.instance.value = this._timeToObj(this._value);

    if (this.max) {
      this._contentRef.instance.max = this._timeToObj(this.max);
    }
    if (this.min) {
      this._contentRef.instance.min = this._timeToObj(this.min);
    }
  }

  protected _timeToObj(time: any): SelectedTime {
    const round = (x: number, roundBy: number) => {
      return x % roundBy < Math.round(roundBy / 2)
        ? x % roundBy === 0
          ? x
          : Math.ceil(x / roundBy) * roundBy
        : Math.floor(x / roundBy) * roundBy;
    };

    function toString(val: number) {
      return val < 10 ? `0${val}` : `${val}`;
    }

    const hour = Number(time.split(':')[0]);
    let minute = Number(time.split(':')[1].match(/\d+/g));
    const ampm = time.match(/AM|PM/) || [''];

    if (this.rounding) {
      minute = round(minute, this.rounding);
    }

    return {
      h: toString(hour),
      m: toString(minute),
      ampm: ampm[0],
    };
  }

  open(): void {
    let overlayRef = this._overlayRef;
    if (!overlayRef) {
      this._portal = new ComponentPortal(MdbTimePickerContentComponent, this._vcr);
      overlayRef = this._overlay.create(this._getOverlayConfig());

      this._overlayRef = overlayRef;
    }

    if (overlayRef && this._overlayRef && !overlayRef.hasAttached()) {
      this._contentRef = this._overlayRef.attach(this._portal);
      this._patchInputValues();
      this._listenToOutsideClick();
    }

    this._emitTimeShowEvent(this._timeToObj(this._value));
  }

  close(doneClicked?: boolean, value?: SelectedTime) {
    if (this._overlayRef && this._overlayRef.hasAttached()) {
      if (!doneClicked) {
        this._emitTimeCancelEvent(value || this._timeToObj(this._value));
      }
    }
    this._destroyOverlay();
  }

  _emitTimeChangeEvent(value: SelectedTime) {
    this.timeChange.emit({ status: 'change', value });
  }

  _emitTimeCancelEvent(value: SelectedTime) {
    this.cancel.emit({ status: 'cancel', value });
  }

  _emitTimeDoneEvent(value: SelectedTime) {
    const { h, m, ampm } = value;
    this.done.emit({ status: 'done', value });
    this._selectionChange$.next(this.twelveHour ? `${h}:${m}${ampm}` : `${h}:${m}`);
  }

  _emitTimeShowEvent(value: SelectedTime) {
    this.show.emit({ status: 'open', value });
  }

  _setValue(value: string) {
    if (value) {
      this._value = value;
    } else {
      this._value = '12:00AM';
    }
  }

  setInput(input: any) {
    this.input = input;
    input._valueChange.subscribe((val: any) => {
      const match = val.match(/\d\d:\d\d(AM|PM)?/gi);
      if (match) {
        this._value = match[0];
      } else {
        this._value = '12:00AM';
      }
    });
  }

  onChangeCb: (_: any) => void = () => {};
  onTouchedCb: () => void = () => {};

  registerOnChange(fn: any): void {
    this.onChangeCb = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouchedCb = fn;
  }

  private _getOverlayConfig(): OverlayConfig {
    const positionStrategy = this._overlay
      .position()
      .global()
      .centerHorizontally()
      .centerVertically();
    const overlayConfig = new OverlayConfig({
      hasBackdrop: true,
      scrollStrategy: this._overlay.scrollStrategies.block(),
      positionStrategy,
    });
    return overlayConfig;
  }

  private _destroyOverlay() {
    if (this._overlayRef) {
      this._overlayRef.dispose();
      this._overlayRef = null;
    }
  }

  private _listenToOutsideClick() {
    if (this._overlayRef) {
      merge(
        this._overlayRef.backdropClick(),
        this._overlayRef.detachments(),
        this._overlayRef.keydownEvents().pipe(
          filter((event: KeyboardEvent) => {
            // Closing on alt + up is only valid when there's an input associated with the datepicker.
            // tslint:disable-next-line: deprecation
            return event.keyCode === ESCAPE;
          })
        )
      ).subscribe(event => {
        if (event) {
          event.preventDefault();
        }
        this.close();
        this._destroyOverlay();
      });
    }
  }

  ngOnDestroy() {
    this._destroyOverlay();
  }
}
