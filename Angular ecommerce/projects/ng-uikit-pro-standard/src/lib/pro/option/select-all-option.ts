import {
  Component,
  OnInit,
  ElementRef,
  ChangeDetectorRef,
  Optional,
  Inject,
  HostBinding,
} from '@angular/core';
import {
  MDB_OPTION_PARENT,
  MDB_OPTION_GROUP,
  MdbOptionGroup,
  OptionComponent,
  MdbOptionParent,
} from './option.component';

@Component({
  selector: 'mdb-select-all-option',
  templateUrl: './option.component.html',
  styleUrls: ['./option.component.scss'],
})
export class SelectAllOptionComponent extends OptionComponent implements OnInit {
  _multiple = true;

  constructor(
    _el: ElementRef,
    _cdRef: ChangeDetectorRef,
    @Optional() @Inject(MDB_OPTION_PARENT) _parent: MdbOptionParent,
    @Optional() @Inject(MDB_OPTION_GROUP) group: MdbOptionGroup
  ) {
    super(_el, _cdRef, _parent, group);
  }

  @HostBinding('class.mdb-select-all-option')
  option = true;

  ngOnInit(): void {}
}
