import {
  Component,
  EventEmitter,
  forwardRef,
  Input,
  Output,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
} from '@angular/core';

import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BACKSPACE, DELETE } from '../../free/utils/keyboard-navigation';

export const CUSTOM_INPUT_CONTROL_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  // tslint:disable-next-line: no-use-before-declare
  useExisting: forwardRef(() => MaterialChipsComponent),
  multi: true,
};

@Component({
  selector: 'mdb-material-chips',
  templateUrl: 'chips.component.html',
  encapsulation: ViewEncapsulation.None,
  providers: [CUSTOM_INPUT_CONTROL_VALUE_ACCESSOR],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaterialChipsComponent {
  @ViewChild('box') chipsInput: ElementRef;
  @ViewChild('tbox') initialInput: ElementRef;
  @Input() placeholder = '';

  addAreaDisplayed: boolean;
  isTagsFocused = false;
  values: string[];
  labelToAdd: string;
  focused: string;
  selected: string;
  noop: any;

  keyCodes = {
    backspace: BACKSPACE,
    delete: DELETE,
  };

  @Output() tagsfocusedChange = new EventEmitter();
  @Output() labelsChange: EventEmitter<string[]> = new EventEmitter<string[]>();

  @Input()
  get tagsfocused() {
    return this.isTagsFocused;
  }

  private onTouchedCallback: () => void = this.noop;
  private onChangeCallback: (_: any) => void = this.noop;
  registerOnChange(fn: any) {
    this.onChangeCallback = fn;
  }
  registerOnTouched(fn: any) {
    this.onTouchedCallback = fn;
  }
  constructor(private _cdRef: ChangeDetectorRef) {
    this.onTouchedCallback =
      this.onTouchedCallback === undefined ? this.noop : this.onTouchedCallback;
    this.onChangeCallback = this.onChangeCallback === undefined ? this.noop : this.onChangeCallback;
  }

  removeValue(value: string) {
    const index = this.values.indexOf(value, 0);
    if (index !== undefined) {
      this.values.splice(index, 1);
      this.labelsChange.emit(this.values);
    }
  }

  handleKeydown(event: any) {
    if (event.keyCode === this.keyCodes.backspace || event.keyCode === this.keyCodes.delete) {
      if (event.target.value === '') {
        this._removeLast();
        event.preventDefault();
      }
    }
  }

  private _removeLast() {
    const lastChip = this.values[this.values.length];
    const index = this.values.indexOf(lastChip);

    this.values.splice(index, 1);
    this.labelsChange.emit(this.values);

    if (this.values.length === 0) {
      setTimeout(() => {
        this.initialInput.nativeElement.focus();
      }, 0);
    }
  }

  addValue(value: string, event: any) {
    event.preventDefault();
    if (!value || value.trim() === '') {
      return;
    }
    this.values.push(value);
    this.labelsChange.emit(this.values);
    this.labelToAdd = '';

    if (this.values.length === 1) {
      setTimeout(() => {
        this.chipsInput.nativeElement.focus();
      }, 0);
    }
  }

  writeValue(value: string[]) {
    if (value !== this.values) {
      this.values = value;
    }

    this._cdRef.markForCheck();
  }

  onFocus() {
    this.focused = 'md-focused';
    this.isTagsFocused = true;
    this.tagsfocusedChange.emit(this.isTagsFocused);
  }
  focusOutFunction() {
    this.focused = '';
    this.isTagsFocused = false;
    this.tagsfocusedChange.emit(this.isTagsFocused);
  }
}
