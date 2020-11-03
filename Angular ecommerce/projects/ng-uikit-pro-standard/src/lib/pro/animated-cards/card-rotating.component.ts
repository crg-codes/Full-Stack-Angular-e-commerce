import {
  Component,
  Output,
  EventEmitter,
  ViewEncapsulation,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';

@Component({
  selector: 'mdb-card-rotating, mdb-flipping-card',
  templateUrl: 'card-rotating.component.html',
  styleUrls: ['./animated-cards-module.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardRotatingComponent {
  public rotate = false;
  ANIMATION_TRANSITION_TIME = 1000;
  @Output() animationStart: EventEmitter<any> = new EventEmitter<any>();
  @Output() animationEnd: EventEmitter<any> = new EventEmitter<any>();

  constructor(private _cdRef: ChangeDetectorRef) {}

  toggle() {
    this.rotate = !this.rotate;
    this.animationStart.emit();

    setTimeout(() => {
      this.animationEnd.emit();
    }, this.ANIMATION_TRANSITION_TIME);

    this._cdRef.markForCheck();
  }
}
