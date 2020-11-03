import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  forwardRef,
  HostListener,
  EventEmitter,
  Output,
  Input,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

export const MDB_SELECT_FILTER_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  // tslint:disable-next-line: no-use-before-declare
  useExisting: forwardRef(() => MdbSelectFilterComponent),
  multi: true,
};

@Component({
  selector: 'mdb-select-filter',
  templateUrl: './select-filter.component.html',
  providers: [MDB_SELECT_FILTER_VALUE_ACCESSOR],
})
export class MdbSelectFilterComponent implements OnInit {
  value: any;
  @ViewChild('input') input: ElementRef;

  @Input() placeholder = '';
  @Input() autocomplete = true;

  @Output() readonly inputChange: EventEmitter<any> = new EventEmitter<any>();

  @HostListener('input', ['$event'])
  _handleInput(event: any) {
    const valueChanged = this.value !== event.target.value;

    if (valueChanged) {
      this._onChange(event.target.value);
      this.inputChange.emit(event.target.value);
      this.value = event.target.value;
    }
  }

  constructor(private _el: ElementRef) {}

  ngOnInit() {}

  focus() {
    this.input.nativeElement.focus();
  }

  /** Control value accessor methods */

  setDisabledState(isDisabled: boolean) {
    this._el.nativeElement.disabled = isDisabled;
  }

  _onChange: (value: any) => void = () => {};

  _onTouched = () => {};

  writeValue(value: any): void {
    Promise.resolve(null).then(() => {
      this._el.nativeElement.value = value;
    });
  }

  registerOnChange(fn: (value: any) => {}): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => {}) {
    this._onTouched = fn;
  }
}
