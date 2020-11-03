import {
  Component,
  ElementRef,
  ViewChild,
  Input,
  ContentChildren,
  QueryList,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  AfterContentInit,
  Optional,
  OnDestroy,
} from '@angular/core';
import { state, style, trigger, transition, animate } from '@angular/animations';
import { RouterLinkWithHref, Router, NavigationEnd } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

export interface IAccordionAnimationState {
  state: string;
  accordionEl: ElementRef;
}

@Component({
  exportAs: 'sbItemBody',
  selector: 'mdb-item-body, mdb-accordion-item-body',
  templateUrl: 'sb-item.body.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('expandBody', [
      state('collapsed', style({ height: '0px', visibility: 'hidden' })),
      state('expanded', style({ height: '*', visibility: 'visible' })),
      transition('expanded <=> collapsed', animate('500ms ease')),
    ]),
  ],
})
export class SBItemBodyComponent implements AfterContentInit, OnDestroy {
  @Input() customClass: string;

  @Output() animationStateChange: EventEmitter<IAccordionAnimationState> = new EventEmitter<
    IAccordionAnimationState
  >();
  @ContentChildren(RouterLinkWithHref) routerLinks: QueryList<RouterLinkWithHref>;

  @ViewChild('body', { static: true }) bodyEl: ElementRef;

  public autoExpand: boolean;
  public collapsed: boolean;
  public id = `mdb-accordion-`;
  public height = '0';

  private _destroy$: Subject<void> = new Subject();

  expandAnimationState = 'collapsed';
  ariaLabelledBy = '';

  constructor(
    public el: ElementRef,
    private _cdRef: ChangeDetectorRef,
    @Optional() private router: Router
  ) {}

  toggle(collapsed: boolean) {
    setTimeout(() => {
      collapsed
        ? (this.expandAnimationState = 'collapsed')
        : (this.expandAnimationState = 'expanded');

      this._cdRef.markForCheck();
    }, 0);
  }

  animationCallback() {
    this.animationStateChange.emit({
      state: this.expandAnimationState,
      accordionEl: this.el.nativeElement.parentElement.parentElement,
    });
  }

  openSidenavOnActiveLink() {
    if (typeof window !== 'undefined' && window) {
      const pathStrategyUrl = window.location.pathname;
      const hashStrategyUrl = window.location.hash;
      const activeLink = this.routerLinks.find((link: any) => {
        const params = link.href.split('?')[1];

        if (params) {
          return (
            link.href.split('?')[0] === pathStrategyUrl ||
            link.href.split('?')[0] === hashStrategyUrl
          );
        } else {
          return link.href === pathStrategyUrl || link.href === hashStrategyUrl;
        }
      });
      const sbItem = this.el.nativeElement.parentNode;
      if (activeLink) {
        setTimeout(() => {
          this.expandAnimationState = 'expanded';
          if (sbItem) {
            sbItem.classList.add('active');
            sbItem.classList.remove('is-collapsed');
          }
          this._cdRef.markForCheck();
        }, 10);
      } else if (this.expandAnimationState !== 'collapsed' && activeLink) {
        setTimeout(() => {
          this.expandAnimationState = 'collapsed';
          if (sbItem) {
            sbItem.classList.remove('active');
            sbItem.classList.add('is-collapsed');
          }
          this._cdRef.markForCheck();
        }, 10);
      }
    }
  }

  ngAfterContentInit() {
    setTimeout(() => {
      this.collapsed
        ? (this.expandAnimationState = 'collapsed')
        : (this.expandAnimationState = 'expanded');

      if (this.router && this.autoExpand) {
        this.router.events
          .pipe(
            takeUntil(this._destroy$),
            filter(event => event instanceof NavigationEnd)
          )
          .subscribe(() => {
            this.openSidenavOnActiveLink();
          });
      }
    }, 0);
  }

  ngOnDestroy() {
    this._destroy$.next();
    this._destroy$.unsubscribe();
  }
}
