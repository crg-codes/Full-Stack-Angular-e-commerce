import {
  Component,
  ElementRef,
  Input,
  HostListener,
  InjectionToken,
  Optional,
  Inject,
  OnInit,
} from '@angular/core';
import { ISelectedOption } from '../interfaces/selected-option.interface';
import { Subject, Observable } from 'rxjs';

export interface MdbOptionParent {
  optionHeight: number;
  visibleOptions: number;
}

export const MDB_OPTION_PARENT = new InjectionToken<MdbOptionParent>('MDB_OPTION_PARENT');

@Component({
  selector: 'mdb-option',
  templateUrl: 'mdb-option.component.html',
})
export class MdbOptionComponent implements OnInit {
  @Input() value: string;
  @Input() disabled: boolean;
  _optionHeight: any;
  get optionHeight(): any {
    return this._optionHeight;
  }

  clicked = false;
  selectedItem: ISelectedOption;

  clickSource: Subject<MdbOptionComponent> = new Subject<MdbOptionComponent>();
  click$: Observable<MdbOptionComponent> = this.clickSource.asObservable();

  constructor(
    public el: ElementRef,
    @Optional() @Inject(MDB_OPTION_PARENT) private _parent: MdbOptionParent
  ) {
    this.clicked = false;
  }

  @HostListener('click')
  onClick() {
    this.clickSource.next(this);
  }
  get label() {
    return this.el.nativeElement.textContent;
  }
  ngOnInit() {
    if (this._parent.visibleOptions && this._parent.optionHeight) {
      this._optionHeight = this._parent.optionHeight;
    }
  }
}
