import {
  Component,
  ElementRef,
  Input,
  HostListener,
  InjectionToken,
  Optional,
  Inject,
  OnInit,
  HostBinding,
  ViewEncapsulation,
  ChangeDetectorRef,
  EventEmitter,
  Output,
} from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { OptionGroupComponent } from './option-group.component';

export interface MdbOptionParent {
  optionHeight: number;
  visibleOptions: number;
  multiple: boolean;
}

export interface MdbOptionGroup {
  disabled?: boolean;
}

export const MDB_OPTION_PARENT = new InjectionToken<MdbOptionParent>('MDB_OPTION_PARENT');

export const MDB_OPTION_GROUP = new InjectionToken<OptionGroupComponent>('MDB_OPTION_GROUP');

@Component({
  selector: 'mdb-select-option',
  templateUrl: 'option.component.html',
  styleUrls: ['./option.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class OptionComponent implements OnInit {
  @Input() value: any;

  @HostBinding('class.disabled')
  @Input()
  disabled = false;

  @Output() readonly selectionChange = new EventEmitter<OptionComponent>();

  _optionHeight: number;

  private _selected = false;
  private _active = false;
  _multiple = false;

  clicked = false;

  clickSource: Subject<OptionComponent> = new Subject<OptionComponent>();
  click$: Observable<OptionComponent> = this.clickSource.asObservable();

  constructor(
    private _el: ElementRef,
    private _cdRef: ChangeDetectorRef,
    @Optional() @Inject(MDB_OPTION_PARENT) private _parent: MdbOptionParent,
    @Optional() @Inject(MDB_OPTION_GROUP) public group: MdbOptionGroup
  ) {
    this.clicked = false;
  }

  @HostBinding('class.mdb-option')
  option = true;

  @HostBinding('class.active')
  get active() {
    return this._active;
  }

  @HostBinding('class.selected')
  get selected() {
    return this._selected;
  }

  @HostBinding('style.height.px')
  get optionHeight(): number {
    return this._optionHeight;
  }

  @HostBinding('attr.role')
  get role() {
    return 'option';
  }

  @HostBinding('attr.aria-disabled')
  get isDisabled() {
    return this.disabled ? true : false;
  }

  @HostBinding('attr.aria-selected')
  get isSelected() {
    return this.selected;
  }

  @HostListener('click')
  onClick() {
    this.clickSource.next(this);
  }

  get label() {
    return this._el.nativeElement.textContent;
  }

  getLabel() {
    return this._el.nativeElement.textContent;
  }

  get offsetHeight() {
    return this._el.nativeElement.offsetHeight;
  }

  ngOnInit() {
    if (this._parent && this._parent.visibleOptions && this._parent.optionHeight) {
      this._optionHeight = this._parent.optionHeight;
    }

    if (this._parent && this._parent.multiple) {
      this._multiple = true;
    }
  }

  select() {
    if (!this._selected) {
      this._selected = this._multiple ? !this._selected : true;
      this.selectionChange.emit(this);
      this._cdRef.markForCheck();
    }
  }

  deselect() {
    if (this._selected) {
      this._selected = false;
      this.selectionChange.emit(this);
      this._cdRef.markForCheck();
    }
  }

  setActiveStyles() {
    if (!this._active) {
      this._active = true;
      this._cdRef.markForCheck();
    }
  }

  setInactiveStyles() {
    if (this._active) {
      this._active = false;
      this._cdRef.markForCheck();
    }
  }
}
