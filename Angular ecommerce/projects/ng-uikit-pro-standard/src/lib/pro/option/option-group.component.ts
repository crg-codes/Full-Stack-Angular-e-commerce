import {
  Component,
  OnInit,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  AfterContentInit,
  Input,
  HostBinding,
  Optional,
  Inject,
} from '@angular/core';
import { MDB_OPTION_GROUP, MDB_OPTION_PARENT, MdbOptionParent } from './option.component';

@Component({
  selector: 'mdb-option-group',
  templateUrl: 'option-group.component.html',
  styleUrls: ['./option-group.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: MDB_OPTION_GROUP, useExisting: OptionGroupComponent }],
})
export class OptionGroupComponent implements OnInit, AfterContentInit {
  @HostBinding('class.mdb-option-group')
  optionGroup = true;
  _optionHeight = 48;

  @Input() label: string;

  @Input()
  get disabled() {
    return this._disabled;
  }
  set disabled(value: boolean) {
    this._disabled = value;
  }
  private _disabled = false;

  constructor(@Optional() @Inject(MDB_OPTION_PARENT) private _parent: MdbOptionParent) {}

  ngOnInit() {
    if (this._parent && this._parent.visibleOptions && this._parent.optionHeight) {
      this._optionHeight = this._parent.optionHeight;
    }
  }

  ngAfterContentInit() {}
}
