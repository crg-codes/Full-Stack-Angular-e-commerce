import {
  Directive,
  Input,
  forwardRef,
  ElementRef,
  EventEmitter,
  HostListener,
  OnInit,
} from '@angular/core';
import { MdbTimePickerComponent } from './timepicker.component';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export const MDB_TIMEPICKER_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  // tslint:disable-next-line: no-use-before-declare
  useExisting: forwardRef(() => MdbTimePickerDirective),
  multi: true,
};

@Directive({
  selector: '[mdbTimePicker]',
  // tslint:disable-next-line: no-host-metadata-property
  host: { '(blur)': 'onTouched($event)', '(change)': 'onChange($event.target.value)' },
  providers: [MDB_TIMEPICKER_VALUE_ACCESSOR],
})
export class MdbTimePickerDirective implements ControlValueAccessor, OnInit {
  @Input() mdbTimePicker: MdbTimePickerComponent;

  @Input()
  set value(value: string) {
    this._value = value;
    this._valueChange.emit(this._value);
    this.el.nativeElement.value = value;
  }

  get value(): string {
    return this._value;
  }
  private _value: string;
  _valueChange = new EventEmitter<string>();

  constructor(private el: ElementRef) {}

  @HostListener('input', ['$event'])
  handleInput(event: any) {
    this.onChange(event.target.value);
    this._valueChange.emit(event.target.value);
  }

  ngOnInit() {
    this.mdbTimePicker.setInput(this);
    this.mdbTimePicker._selectionChange$.subscribe(selectedValue => {
      this.value = selectedValue;
      this.onChange(selectedValue);
      this.onTouched();
    });
  }

  onChange: (value: any) => void = () => {};

  onTouched = () => {};

  writeValue(value: any): void {
    if (value || value === '') {
      this.el.nativeElement.value = value;
      this.mdbTimePicker._selectionChange$.next(this._value);
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
}
