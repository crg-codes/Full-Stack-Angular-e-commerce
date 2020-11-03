import {
  AfterViewInit,
  Directive,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnDestroy,
  Output,
  Renderer2,
  forwardRef,
  HostListener,
} from '@angular/core';
import { MdbAutoCompleterComponent } from '../components/mdb-auto-completer.component';
import { ISelectedOption } from '../interfaces/selected-option.interface';

import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Utils } from '../../../free/utils';
import { TAB, ESCAPE, ENTER } from '../../../free/utils/keyboard-navigation';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export const MAT_AUTOCOMPLETE_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  // tslint:disable-next-line: no-use-before-declare
  useExisting: forwardRef(() => MdbAutoCompleterDirective),
  multi: true,
};

@Directive({
  selector: 'input[mdbAutoCompleter], textarea[mdbAutoCompleter]',
  // tslint:disable-next-line:no-host-metadata-property
  host: {
    '(input)': '_handleInput($event)',
    '(focusin)': '_handleFocusIn()',
    '(blur)': '_handleBlurIn()',
    '(mousedown)': '_handleMouseDown()',
  },
  exportAs: 'mdbAutoCompleterTrigger',
  providers: [MAT_AUTOCOMPLETE_VALUE_ACCESSOR],
})
export class MdbAutoCompleterDirective implements AfterViewInit, OnDestroy, ControlValueAccessor {
  @Input() mdbAutoCompleter: MdbAutoCompleterComponent;
  @Output() ngModelChange = new EventEmitter<any>();
  @Output() clearBtnClicked = new EventEmitter<any>();

  private _destroy$: Subject<void> = new Subject();

  private _autocompleterInputChanges: MutationObserver;
  private _clearButton: any;
  private _canOpenOnFocus = true;
  private utils: Utils = new Utils();

  listenToClearClick: Function;
  listenFunc: Function;
  isBrowser: boolean;

  @HostListener('keydown', ['$event'])
  onKeydown(event: any) {
    this._handleKeyDown(event);
    const isTabKey = event.keyCode === TAB;
    if (isTabKey) {
      this._hide();
    }
  }

  @HostListener('input', ['$event'])
  _handleInput(event: any) {
    if (!this._isOpen()) {
      this._show();
    }

    this._onChange(event.target.value);

    this.mdbAutoCompleter.removeHighlight(0);
    this.mdbAutoCompleter.highlightRow(0);

    this._updateClearButtonVisibility();
  }

  @HostListener('focusin')
  _handleFocusIn() {
    if (!this._canOpenOnFocus) {
      this._canOpenOnFocus = true;
    } else {
      this._show();
    }
  }

  /*
fix(completer): Resolve problem with closing autocompleter dropdown
when not neccessary (eg. clicking on button which is not an mdb-option.
Without calling this _hide() method, autocompleter dropdown won't close
after switching focus programmatically to another element.
*/
  @HostListener('blur')
  _handleBlurIn() {
    this._canOpenOnFocus = this.document.activeElement !== this.el.nativeElement;

    this._onTouched();
  }

  @HostListener('mousedown')
  handleMouseDown() {
    this.mdbAutoCompleter.highlightRow(0);
  }

  constructor(
    private renderer: Renderer2,
    private el: ElementRef,
    @Inject(PLATFORM_ID) platformId: string,
    @Inject(DOCUMENT) private document: any
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  private _renderClearButton() {
    const el = this.renderer.createElement('button');

    this._setStyles(el, {
      position: 'absolute',
      top: '25%',
      right: '0',
      visibility: 'hidden',
    });

    this._addClass(el, ['mdb-autocomplete-clear', 'fa', 'fa-times']);

    this.renderer.setAttribute(el, 'type', 'button');
    this.renderer.setAttribute(
      el,
      'tabindex',
      this.mdbAutoCompleter.clearButtonTabIndex.toString()
    );
    this.listenToClearClick = this.renderer.listen(el, 'click', () => {
      this.clearBtnClicked.emit();
      this._onChange('');
    });

    if (this.isBrowser) {
      const parent =
        this.utils.getClosestEl(this.el.nativeElement, '.md-form') || this.el.nativeElement;
      this.renderer.appendChild(parent, el);
    }
  }

  private _updateClearButtonVisibility() {
    const clearButtonVisibility = this.el.nativeElement.value.length > 0 ? 'visible' : 'hidden';
    if (this.mdbAutoCompleter.clearButton) {
      const clearButton = this.el.nativeElement.parentElement.lastElementChild;

      this._setStyles(clearButton, { visibility: clearButtonVisibility });
    }
  }

  private _setStyles(target: ElementRef, styles: any) {
    Object.keys(styles).forEach((prop: any) => {
      this.renderer.setStyle(target, prop, styles[prop]);
    });
    return this;
  }

  private _addClass(target: ElementRef, name: string[]) {
    name.forEach((el: string) => {
      this.renderer.addClass(target, el);
    });
  }

  private _clearInput() {
    this.el.nativeElement.value = '';
    this.ngModelChange.emit('');
    const clearButton = this.el.nativeElement.parentElement.lastElementChild;
    this._setStyles(clearButton, { visibility: 'hidden' });
  }

  public clear() {
    this._clearInput();
  }

  public _handleKeyDown(event: any) {
    this.mdbAutoCompleter.navigateUsingKeyboard(event);
    const key = event.keyCode;

    if (key !== ESCAPE && key !== ENTER && key !== TAB) {
      this.mdbAutoCompleter.show();
    }
  }

  getCoords(elem: any): any {
    if (this.isBrowser) {
      const box: ClientRect = elem.getBoundingClientRect();
      const body: any = document.body;
      const docEl: any = document.documentElement;

      const scrollTop: number = window.pageYOffset || docEl.scrollTop || body.scrollTop;
      const scrollLeft: number = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;

      const clientTop: number = docEl.clientTop || body.clientTop || 0;
      const clientLeft: number = docEl.clientLeft || body.clientLeft || 0;

      const top: number = box.top + scrollTop - clientTop;
      const left: number = box.left + scrollLeft - clientLeft;

      return { top: Math.round(top), left: Math.round(left) };
    }
  }

  private _isOpen() {
    return this.mdbAutoCompleter.isOpen();
  }

  private _show() {
    this.mdbAutoCompleter.show();
    setTimeout(() => {
      if (this.mdbAutoCompleter.appendToBody) {
        if (this.utils.getClosestEl(this.el.nativeElement, '.modal-body')) {
          setTimeout(() => {
            this.renderer.setStyle(this.mdbAutoCompleter.dropdown.nativeElement, 'z-index', '1100');
          }, 0);
        }
      }
    }, 0);

    this.listenFunc = this.renderer.listen('document', 'click', event => {
      if (
        this.mdbAutoCompleter.dropdown &&
        !this.mdbAutoCompleter.dropdown.nativeElement.contains(event.target as HTMLElement) &&
        !this.el.nativeElement.contains(event.target as HTMLElement)
      ) {
        this._hide();
      }
    });
  }

  private _hide() {
    this.mdbAutoCompleter.hide();
    this.listenFunc();
  }

  private _appendDropdownToInput() {
    const position: ClientRect = this.el.nativeElement.getBoundingClientRect();
    const el = this.el.nativeElement;
    const style = window.getComputedStyle(this.el.nativeElement);
    const height = ['height', 'padding-top', 'padding-bottom', 'margin-top', 'margin-bottom']
      .map(key => parseInt(style.getPropertyValue(key), 10))
      .reduce((prev, cur) => prev + cur);

    this.mdbAutoCompleter.parameters = {
      left: this.getCoords(el).left,
      top: this.getCoords(el).top + height,
      width: position.width,
      bottom: window.innerHeight - height - el.getBoundingClientRect().top,
      inputHeight: this.el.nativeElement.offsetHeight,
    };

    this.mdbAutoCompleter.appendDropdown();
  }

  ngAfterViewInit() {
    this.mdbAutoCompleter
      .selectedItemChanged()
      .pipe(takeUntil(this._destroy$))
      .subscribe((item: ISelectedOption) => {
        const displayedValue =
          this.mdbAutoCompleter && this.mdbAutoCompleter.displayValue
            ? this.mdbAutoCompleter.displayValue(item.text)
            : item.text;

        this.el.nativeElement.value = displayedValue;
        this._onChange(item.text);
        const clearButtonVisibility = this.el.nativeElement.value.length > 0 ? 'visible' : 'hidden';
        const clearButton = this.el.nativeElement.parentElement.lastElementChild;
        this._setStyles(clearButton, { visibility: clearButtonVisibility });

        if (item) {
          this._canOpenOnFocus = false;
          this.el.nativeElement.focus();
          this._hide();
        }
      });

    this.mdbAutoCompleter.origin = this.el;

    this.mdbAutoCompleter
      .isDropdownOpen()
      .pipe(takeUntil(this._destroy$))
      .subscribe((state: boolean) => {
        if (state) {
          this._appendDropdownToInput();
        }
      });

    if (this.mdbAutoCompleter.clearButton && this.isBrowser) {
      this._renderClearButton();
      const clearButton = this.el.nativeElement.parentElement.querySelectorAll(
        '.mdb-autocomplete-clear'
      )[0];

      this._clearButton = this.document.querySelector('.mdb-autocomplete-clear');

      this.renderer.listen(clearButton, 'focus', () => {
        ['click', 'keydown:space', 'keydown:enter'].forEach(event =>
          this.renderer.listen(clearButton, event, () => {
            this._clearInput();
          })
        );

        this._setStyles(clearButton, {
          transform: 'scale(1.2, 1.2)',
          transition: '200ms',
        });
      });

      this.renderer.listen(clearButton, 'click', () => {
        this._clearInput();
      });

      this.renderer.listen(clearButton, 'mouseenter', () => {
        this._setStyles(clearButton, {
          transform: 'scale(1.2, 1.2)',
          transition: '200ms',
        });
      });

      this.renderer.listen(clearButton, 'mouseleave', () => {
        this._setStyles(clearButton, {
          transform: 'scale(1.0, 1.0)',
          transition: '200ms',
        });
      });

      this.renderer.listen(clearButton, 'blur', () => {
        this._setStyles(clearButton, {
          transform: 'scale(1.0, 1.0)',
          transition: '200ms',
        });
      });

      if (this.el.nativeElement.disabled) {
        this.renderer.setAttribute(clearButton, 'disabled', 'true');
      }

      this._autocompleterInputChanges = new MutationObserver((mutations: MutationRecord[]) => {
        mutations.forEach((mutation: MutationRecord) => {
          if (mutation.attributeName === 'disabled') {
            this.renderer.setAttribute(this._clearButton, 'disabled', 'true');
          }
        });
      });

      this._autocompleterInputChanges.observe(this.el.nativeElement, {
        attributes: true,
        childList: true,
        characterData: true,
      });
    }
  }

  ngOnDestroy() {
    if (this._autocompleterInputChanges) {
      this._autocompleterInputChanges.disconnect();
    }

    if (this.listenToClearClick) {
      this.listenToClearClick();
    }
    if (this.listenFunc) {
      this.listenFunc();
    }

    this._destroy$.next();
    this._destroy$.complete();
  }

  _onChange: (value: any) => void = () => {};

  _onTouched = () => {};

  writeValue(value: any): void {
    Promise.resolve(null).then(() => {
      this.el.nativeElement.value = value;
      this._updateClearButtonVisibility();
    });
  }

  registerOnChange(fn: (value: any) => {}): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => {}) {
    this._onTouched = fn;
  }
}
