import {
  Component,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  Input,
  ViewContainerRef,
  ElementRef,
  ViewChild,
  TemplateRef,
  Output,
  EventEmitter,
  ContentChildren,
  QueryList,
  AfterContentInit,
  OnDestroy,
  OnInit,
  ChangeDetectorRef,
  Self,
  Optional,
  HostListener,
  Renderer2,
  ContentChild,
  HostBinding,
} from '@angular/core';
import { dropdownAnimation } from './select-animations';
import { fromEvent, merge, Subject } from 'rxjs';
import { filter, takeUntil, startWith, switchMap, tap } from 'rxjs/operators';
import { MDB_OPTION_PARENT, OptionComponent } from '../option/option.component';
import { NgControl, ControlValueAccessor } from '@angular/forms';
import { OptionGroupComponent } from '../option/option-group.component';
import { SelectAllOptionComponent } from '../option/select-all-option';
import {
  OverlayRef,
  PositionStrategy,
  Overlay,
  ViewportRuler,
  ConnectionPositionPair,
} from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import {
  ESCAPE,
  UP_ARROW,
  HOME,
  END,
  ENTER,
  SPACE,
  DOWN_ARROW,
} from '../../free/utils/keyboard-navigation';
import { MdbSelectFilterComponent } from './select-filter.component';
import { ActiveDescendantKeyManager } from '@angular/cdk/a11y';
import { SelectionModel } from '@angular/cdk/collections';

@Component({
  selector: 'mdb-select-2',
  templateUrl: './select.component.html',
  styleUrls: ['./select-module.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [dropdownAnimation],
  providers: [{ provide: MDB_OPTION_PARENT, useExisting: MdbSelectComponent }],
})

// tslint:disable-next-line:component-class-suffix
export class MdbSelectComponent
  implements OnInit, OnDestroy, AfterContentInit, ControlValueAccessor {
  @ViewChild('selectWrapper') private _selectWrapper: ElementRef;
  @ViewChild('selectValue') private _selectValue: ElementRef;
  @ViewChild('dropdownTemplate') _dropdownTemplate: TemplateRef<any>;
  @ViewChild('dropdown') dropdown: ElementRef;
  @ContentChild(MdbSelectFilterComponent) filter: MdbSelectFilterComponent;
  @ViewChild('optionsWrapper') private _optionsWrapper: ElementRef;
  @ViewChild('customContent') _customContent: ElementRef;
  @ContentChild(SelectAllOptionComponent) selectAllOption: SelectAllOptionComponent;
  @ContentChildren(OptionComponent, { descendants: true }) options: QueryList<OptionComponent>;
  @ContentChildren(OptionGroupComponent) optionGroups: QueryList<OptionGroupComponent>;

  @Input() allowClear = false;
  @Input() clearButtonTabindex = 0;
  @Input() disabled = false;
  @Input() dropdownClass: string;
  @Input() highlightFirst = true;
  @Input() label = '';
  @Input() multiple = false;
  @Input() notFoundMsg = 'No results found';
  @Input() outline = false;
  @Input() placeholder: string;
  @Input() tabindex = 0;
  @Input() required = false;
  @Input('aria-label') ariaLabel = '';
  @Input('aria-labelledby') ariaLabelledby: string;
  @Input()
  get visibleOptions(): number {
    return this._visibleOptions;
  }

  set visibleOptions(value: number) {
    if (value !== 0) {
      this._visibleOptions = value;
    }
  }
  private _visibleOptions = 5;

  @Input()
  get optionHeight(): any {
    return this._optionHeight;
  }

  set optionHeight(value: any) {
    if (value !== 0) {
      this._optionHeight = value;
    }
  }

  private _optionHeight = 48;

  @Input()
  get dropdownHeight(): number {
    return this._dropdownHeight;
  }

  set dropdownHeight(value: number) {
    if (value !== 0) {
      this._dropdownHeight = value;
    }
  }
  // Equal to 4 * optionHeight (which is 48px by default)
  protected _dropdownHeight = 240;

  @Input()
  get value() {
    return this._value;
  }
  set value(newValue: any) {
    if (this._value !== newValue) {
      this._value = newValue;
      this.writeValue(newValue);
    }
  }
  private _value: any;

  @Input()
  get compareWith() {
    return this._compareWith;
  }
  set compareWith(fn: (o1: any, o2: any) => boolean) {
    if (typeof fn === 'function') {
      this._compareWith = fn;
    }
  }

  @Input() sortComparator: (
    a: OptionComponent,
    b: OptionComponent,
    options: OptionComponent[]
  ) => number;

  @Output() readonly valueChange: EventEmitter<any> = new EventEmitter<any>();
  @Output() opened: EventEmitter<any> = new EventEmitter<any>();
  @Output() closed: EventEmitter<any> = new EventEmitter<any>();
  @Output() selected: EventEmitter<OptionComponent> = new EventEmitter<OptionComponent>();
  // tslint:disable-next-line:max-line-length
  @Output() deselected: EventEmitter<OptionComponent | OptionComponent[]> = new EventEmitter<
    OptionComponent | OptionComponent[]
  >();
  @Output() noOptionsFound: EventEmitter<string> = new EventEmitter<string>();

  get activeOption(): OptionComponent | null {
    if (this._keyManager) {
      return this._keyManager.activeItem;
    }

    return null;
  }

  get selectionView(): string {
    if (this.multiple) {
      const selectedOptions = this._selectionModel.selected.map(option => option.label.trim());

      return selectedOptions.join(', ');
    }

    if (this._selectionModel.selected[0]) {
      return this._selectionModel.selected[0].label;
    }

    return '';
  }

  get hasSelection() {
    return this._selectionModel && !this._selectionModel.isEmpty();
  }

  get allChecked() {
    const selectionsNumber = this._selectionModel.selected.length;
    const optionsNumber = this.options.length;

    return selectionsNumber === optionsNumber;
  }

  private _keyManager: ActiveDescendantKeyManager<OptionComponent | null>;

  private _overlayRef: OverlayRef | null;
  private _portal: TemplatePortal;

  private _selectionModel: SelectionModel<OptionComponent>;

  previousSelectedValues: any;

  private _destroy = new Subject<void>();

  _isOpen = false;

  _hasFocus = false;

  _labelActive = false;

  _showNoResultsMsg = false;

  private _selectAllChecked = false;

  private _compareWith = (o1: any, o2: any) => o1 === o2;

  @HostListener('keydown', ['$event'])
  handleKeydown(event: any) {
    if (!this.disabled) {
      this._handleClosedKeydown(event);
    }
  }

  @HostBinding('class.mdb-select')
  get select() {
    return true;
  }

  @HostBinding('class.mdb-select-outline')
  get isOutline() {
    return this.outline;
  }

  @HostBinding('attr.aria-multiselectable')
  get isMultiselectable() {
    return this.multiple;
  }

  @HostBinding('attr.aria-haspopup')
  get hasPopup() {
    return true;
  }

  @HostBinding('attr.aria-disabled')
  get isDisabled() {
    return this.disabled;
  }

  @HostBinding('attr.aria-expanded')
  get isExpanded() {
    return this._isOpen;
  }

  @HostBinding('attr.aria-role')
  get role() {
    return this.filter ? 'combobox' : 'listbox';
  }

  constructor(
    private _overlay: Overlay,
    private _viewportRuler: ViewportRuler,
    private _vcr: ViewContainerRef,
    private _cdRef: ChangeDetectorRef,
    private _renderer: Renderer2,
    @Self() @Optional() public ngControl: NgControl
  ) {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  ngAfterContentInit() {
    this._initKeyManager();
    this._setInitialValue();
    this._listenToOptionClick();

    if (this.selectAllOption) {
      this._listenToSelectAllClick();
    }

    if (this.filter) {
      this.filter.inputChange.pipe(takeUntil(this._destroy)).subscribe(() => {
        if (this.multiple && !this.filter.value) {
          this.previousSelectedValues = this.options
            .filter(option => option.selected)
            .map(option => option.value);
        }
      });
    }
  }

  restoreMultipleOptions() {
    if (this.multiple && this.filter) {
      if (
        this.filter.value &&
        this.filter.value.length &&
        this.previousSelectedValues &&
        Array.isArray(this.previousSelectedValues)
      ) {
        if (!this.value || !Array.isArray(this.value)) {
          this.value = [];
        }
        const optionValues = this.options.map(option => option.value);
        this.previousSelectedValues.forEach(previousValue => {
          if (
            !this.value.some((v: any) => this.compareWith(v, previousValue)) &&
            !optionValues.some(v => this.compareWith(v, previousValue))
          ) {
            // if a value that was selected before is deselected and not found in the options, it was deselected
            // due to the filtering, so we restore it.
            this.value.push(previousValue);
          }
        });
      }

      this.previousSelectedValues = this.value;
    }
  }

  private _initKeyManager() {
    const options = this.selectAllOption ? [this.selectAllOption, ...this.options] : this.options;

    if (this.filter) {
      this._keyManager = new ActiveDescendantKeyManager<OptionComponent | null>(
        options
      ).withVerticalOrientation();
    } else {
      this._keyManager = new ActiveDescendantKeyManager<OptionComponent | null>(options)
        .withTypeAhead(200)
        .withVerticalOrientation();
    }
  }

  private _listenToOptionClick() {
    this.options.changes
      .pipe(
        startWith(this.options),
        tap(() => {
          this._setInitialValue();
          setTimeout(() => {
            this._showNoResultsMsg = this.options.length === 0;
            this._keyManager.setActiveItem(null);
            this._initKeyManager();

            if (this._isOpen) {
              this._highlightFirstOption();

              if (this._keyManager.activeItem) {
                this._scrollToOption(this._keyManager.activeItem);
              }
            }
          }, 0);
        }),
        switchMap((options: QueryList<OptionComponent>) => {
          return merge(...options.map((option: OptionComponent) => option.click$));
        }),
        takeUntil(this._destroy)
      )
      .subscribe((clickedOption: OptionComponent) => this._handleOptionClick(clickedOption));
  }

  private _listenToSelectAllClick() {
    this.selectAllOption.click$
      .pipe(takeUntil(this._destroy))
      .subscribe((option: SelectAllOptionComponent) => {
        this.onSelectAll(option);
      });
  }

  private _updateValue() {
    let updatedValue: any = null;

    if (this.multiple) {
      updatedValue = this._selectionModel.selected.map(option => option.value);
    } else {
      updatedValue = this._selectionModel.selected[0].value;
    }

    this._value = updatedValue;
    this.restoreMultipleOptions();
    this._cdRef.markForCheck();
  }

  private _handleOptionClick(option: OptionComponent) {
    if (option.disabled) {
      return;
    }

    if (this.multiple) {
      this._handleMultipleSelection(option);
    } else {
      this._handleSingleSelection(option);
    }

    this._updateLabeLPosition();
    this._cdRef.markForCheck();
  }

  private _handleSingleSelection(option: OptionComponent) {
    const currentSelection = this._selectionModel.selected[0];

    this._selectionModel.select(option);
    option.select();

    if (currentSelection && currentSelection !== option) {
      this._selectionModel.deselect(currentSelection);
      currentSelection.deselect();
      this.deselected.emit(currentSelection.value);
    }

    if (!currentSelection || (currentSelection && currentSelection !== option)) {
      this._updateValue();
      this.valueChange.emit(this.value);
      this._onChange(this.value);
      this.selected.emit(option.value);
    }

    this.close();
    this._focus();
    this._updateLabeLPosition();
  }

  private _handleMultipleSelection(option: OptionComponent) {
    const currentSelections = this._selectionModel.selected;
    if (option.selected) {
      this._selectionModel.deselect(option);
      option.deselect();
      this.deselected.emit(currentSelections);
    } else {
      this._selectionModel.select(option);
      option.select();
      this.selected.emit(option.value);
    }

    this._selectAllChecked = this.allChecked ? true : false;

    if (this.selectAllOption && !this._selectAllChecked) {
      this.selectAllOption.deselect();
    }

    this._updateValue();
    this._sortValues();
    this.valueChange.emit(this.value);
    this._onChange(this.value);
    this._cdRef.markForCheck();
  }

  private _setSelection(selectValue: any | any[]) {
    if (selectValue) {
      if (this.multiple) {
        this._selectionModel.clear();
        selectValue.forEach((value: any) => this._selectByValue(value));
        this._sortValues();
      } else {
        this._selectByValue(selectValue);
      }
    }
    this._updateLabeLPosition();
    this._cdRef.markForCheck();
  }

  private _selectByValue(value: any) {
    const matchingOption = this.options
      .toArray()
      .find((option: OptionComponent) => this._compareWith(option.value, value));

    if (matchingOption) {
      this._selectionModel.select(matchingOption);
      matchingOption.select();
      this.selected.emit(matchingOption.value);
    }
  }

  private _setInitialValue() {
    const value = this.ngControl ? this.ngControl.value : this._value;
    Promise.resolve().then(() => {
      this._setSelection(value);
    });
  }

  onSelectAll(selectAlloption: SelectAllOptionComponent) {
    if (!selectAlloption.selected && !this._selectAllChecked) {
      this._selectAllChecked = true;
      this.options.forEach((option: OptionComponent) => {
        if (!option.disabled) {
          this._selectionModel.select(option);
          option.select();
        }
      });
      this._updateValue();
      this._sortValues();
      this.valueChange.emit(this.value);
      this._onChange(this.value);
      this._updateLabeLPosition();
      selectAlloption.select();
    } else {
      this._selectAllChecked = false;
      this._selectionModel.clear();
      this.options.forEach((option: OptionComponent) => {
        option.deselect();
      });
      selectAlloption.deselect();
      this._updateValue();
      this.valueChange.emit(this.value);
      this._onChange(this.value);
      this._updateLabeLPosition();
    }
  }

  open() {
    if (this.disabled) {
      return;
    }

    let overlayRef = this._overlayRef;

    if (!overlayRef) {
      this._portal = new TemplatePortal(this._dropdownTemplate, this._vcr);

      overlayRef = this._overlay.create({
        width: this._selectWrapper.nativeElement.offsetWidth,
        scrollStrategy: this._overlay.scrollStrategies.reposition(),
        positionStrategy: this._getOverlayPosition(),
      });

      this._overlayRef = overlayRef;

      overlayRef.keydownEvents().subscribe((event: KeyboardEvent) => {
        // tslint:disable-next-line: deprecation
        const key = event.keyCode;

        if (key === ESCAPE || (key === UP_ARROW && event.altKey)) {
          event.preventDefault();
          event.stopPropagation();
          this.close();
          this._focus();
        }
      });
    }

    if (overlayRef && !overlayRef.hasAttached()) {
      overlayRef.attach(this._portal);
      this._listenToOutSideCick(overlayRef, this._selectValue.nativeElement).subscribe(() =>
        this.close()
      );

      if (this.filter) {
        this.filter.focus();
      }

      this._highlightFirstOption();
    }

    if (this._viewportRuler) {
      this._viewportRuler
        .change()
        .pipe(takeUntil(this._destroy))
        .subscribe(() => {
          if (this._isOpen && overlayRef) {
            overlayRef.updateSize({ width: this._selectWrapper.nativeElement.offsetWidth });
          }
        });
    }

    setTimeout(() => {
      const firstSelected = this._selectionModel.selected[0];
      if (firstSelected) {
        this._scrollToOption(firstSelected);
      }
    }, 0);

    this.opened.emit();

    setTimeout(() => {
      this._renderer.listen(this.dropdown.nativeElement, 'keydown', (event: KeyboardEvent) => {
        this._handleOpenKeydown(event);
      });
    }, 0);

    this._updateLabeLPosition();

    if (!this.filter) {
      setTimeout(() => {
        this.dropdown.nativeElement.focus();
      }, 0);
    }

    this._isOpen = true;
    this._cdRef.markForCheck();
  }

  private _sortValues() {
    if (this.multiple) {
      const options = this.options.toArray();

      this._selectionModel.sort((a, b) => {
        return this.sortComparator
          ? this.sortComparator(a, b, options)
          : options.indexOf(a) - options.indexOf(b);
      });
    }
  }

  private _listenToOutSideCick(overlayRef: OverlayRef, origin: HTMLElement) {
    return fromEvent(document, 'click').pipe(
      filter((event: MouseEvent) => {
        const target = event.target as HTMLElement;
        const notOrigin = target !== origin;
        const notValue = !this._selectValue.nativeElement.contains(target);
        const notOverlay = !!overlayRef && overlayRef.overlayElement.contains(target) === false;
        return notOrigin && notValue && notOverlay;
      }),
      takeUntil(overlayRef.detachments())
    );
  }

  private _getOverlayPosition(): PositionStrategy {
    const positionStrategy = this._overlay
      .position()
      .flexibleConnectedTo(this._selectWrapper)
      .withPositions(this._getPositions())
      .withFlexibleDimensions(false);

    return positionStrategy;
  }

  private _getPositions(): ConnectionPositionPair[] {
    const bottomOffset = this.outline ? 4 : 6;
    const topOffset = this.outline ? -7 : -3;
    if (!this.outline) {
      return [
        {
          originX: 'start',
          originY: 'top',
          offsetY: bottomOffset,
          overlayX: 'start',
          overlayY: 'top',
        },
        {
          originX: 'start',
          originY: 'bottom',
          offsetY: topOffset,
          overlayX: 'start',
          overlayY: 'bottom',
        },
      ];
    } else {
      return [
        {
          originX: 'start',
          originY: 'bottom',
          offsetY: bottomOffset,
          overlayX: 'start',
          overlayY: 'top',
        },
        {
          originX: 'start',
          originY: 'top',
          offsetY: topOffset,
          overlayX: 'start',
          overlayY: 'bottom',
        },
      ];
    }
  }

  close() {
    if (!this._isOpen) {
      return;
    }

    if (this._overlayRef && this._overlayRef.hasAttached()) {
      this._overlayRef.detach();
      this._isOpen = false;
    }

    this.closed.emit();
    this._updateLabeLPosition();
    this._keyManager.setActiveItem(null);
    this._onTouched();
    this._cdRef.markForCheck();
  }

  toggle() {
    this._isOpen ? this.close() : this.open();
  }

  private _updateLabeLPosition() {
    if (!this.placeholder && !this.hasSelected) {
      this._labelActive = false;
    } else {
      this._labelActive = true;
    }
  }

  get hasSelected() {
    return this._selectionModel.selected.length !== 0;
  }

  private _scrollToOption(option: OptionComponent) {
    let optionIndex: number;

    if (this.multiple && this.selectAllOption) {
      optionIndex = this.options.toArray().indexOf(option) + 1;
    } else {
      optionIndex = this.options.toArray().indexOf(option);
    }

    const groupsNumber = this._getNumberOfGroupsBeforeOption(optionIndex);

    const scrollToIndex = optionIndex + groupsNumber;

    const list = this._optionsWrapper.nativeElement;
    const listHeight = list.offsetHeight;

    if (optionIndex > -1) {
      const optionTop = scrollToIndex * this.optionHeight;
      const optionBottom = optionTop + this.optionHeight;

      const viewTop = list.scrollTop;
      const viewBottom = this.dropdownHeight;

      if (optionBottom > viewBottom) {
        list.scrollTop = optionBottom - listHeight;
      } else if (optionTop < viewTop) {
        list.scrollTop = optionTop;
      }
    }
  }

  private _getNumberOfGroupsBeforeOption(optionIndex: number): number {
    if (this.optionGroups.length) {
      const optionsList = this.options.toArray();
      const groupsList = this.optionGroups.toArray();
      const index = this.multiple ? optionIndex - 1 : optionIndex;
      let groupsNumber = 0;

      for (let i = 0; i <= index; i++) {
        if (optionsList[i].group && optionsList[i].group === groupsList[groupsNumber]) {
          groupsNumber++;
        }
      }

      return groupsNumber;
    }

    return 0;
  }

  handleSelectionClear(event: MouseEvent) {
    if (event.button === 2) {
      return;
    }

    this._selectionModel.clear();
    this.options.forEach((option: OptionComponent) => {
      option.deselect();
    });

    if (this.selectAllOption && this._selectAllChecked) {
      this.selectAllOption.deselect();
      this._selectAllChecked = false;
    }
    this.value = null;
    this.valueChange.emit(null);
    this._onChange(null);
    this._updateLabeLPosition();
    this._selectAllChecked = false;
  }

  private _handleOpenKeydown(event: any) {
    const key = event.keyCode;
    const manager = this._keyManager;
    const isUserTyping = manager.isTyping();
    const previousActiveItem = manager.activeItem;
    manager.onKeydown(event);

    if (key === HOME || key === END) {
      event.preventDefault();
      key === HOME ? manager.setFirstItemActive() : manager.setLastItemActive();
      if (manager.activeItem) {
        this._scrollToOption(manager.activeItem);
      }
    } else if (
      this._overlayRef &&
      this._overlayRef.hasAttached() &&
      !isUserTyping &&
      manager.activeItem &&
      (key === ENTER || (key === SPACE && !this.filter))
    ) {
      event.preventDefault();

      if (this.multiple && this.selectAllOption && manager.activeItemIndex === 0) {
        this.onSelectAll(this.selectAllOption);
      } else {
        this._handleOptionClick(manager.activeItem);
      }
    } else if (key === UP_ARROW && event.altKey) {
      event.preventDefault();
      this.close();
      this._focus();
    } else if (key === UP_ARROW || key === DOWN_ARROW) {
      if (manager.activeItem && manager.activeItem !== previousActiveItem) {
        this._scrollToOption(manager.activeItem);
      }
    }
  }

  private _handleClosedKeydown(event: any) {
    const key = event.keyCode;
    const manager = this._keyManager;

    if ((key === DOWN_ARROW && event.altKey) || key === ENTER) {
      event.preventDefault();
      this.open();
    } else if (!this.multiple && key === DOWN_ARROW) {
      event.preventDefault();
      manager.setNextItemActive();
      if (manager.activeItem) {
        this._handleOptionClick(manager.activeItem);
      }
    } else if (!this.multiple && key === UP_ARROW) {
      event.preventDefault();
      manager.setPreviousItemActive();
      if (manager.activeItem) {
        this._handleOptionClick(manager.activeItem);
      }
    } else if (!this.multiple && key === HOME) {
      event.preventDefault();
      manager.setFirstItemActive();
      if (manager.activeItem) {
        this._handleOptionClick(manager.activeItem);
      }
    } else if (!this.multiple && key === END) {
      event.preventDefault();
      manager.setLastItemActive();
      if (manager.activeItem) {
        this._handleOptionClick(manager.activeItem);
      }
    } else if (this.multiple && (key === DOWN_ARROW || key === UP_ARROW)) {
      event.preventDefault();
      this.open();
    }
  }

  handleOptionsWheel(event: any) {
    const optionsList = this._optionsWrapper.nativeElement;
    const atTop = optionsList.scrollTop === 0;
    const atBottom = optionsList.offsetHeight + optionsList.scrollTop === optionsList.scrollHeight;

    if (atTop && event.deltaY < 0) {
      event.preventDefault();
    } else if (atBottom && event.deltaY > 0) {
      event.preventDefault();
    }
  }

  private _focus() {
    this._hasFocus = true;
    this._selectWrapper.nativeElement.focus();
  }

  private _highlightFirstOption() {
    if (!this.hasSelection) {
      this._keyManager.setFirstItemActive();
    } else if (this.hasSelection && !this._selectionModel.selected[0].disabled) {
      this._keyManager.setActiveItem(this._selectionModel.selected[0]);
    }
  }

  onFocus() {
    if (!this.disabled) {
      this._focus();
    }
  }

  onBlur() {
    if (!this._isOpen && !this.disabled) {
      this._onTouched();
    }
    this._hasFocus = false;
  }

  ngOnInit() {
    this._selectionModel = new SelectionModel<OptionComponent>(this.multiple);

    if (this.label) {
      this._updateLabeLPosition();
    }
  }

  ngOnDestroy() {
    this._destroy.next();
    this._destroy.complete();
  }

  /** ControlValueAccessor interface methods. **/

  private _onChange = (_: any) => {};
  private _onTouched = () => {};

  writeValue(value: any) {
    if (this.options) {
      this._setSelection(value);
    }
  }

  setDisabledState(isDisabled: boolean) {
    this.disabled = isDisabled;
    this._cdRef.markForCheck();
  }

  registerOnChange(fn: (_: any) => void) {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void) {
    this._onTouched = fn;
  }
}
