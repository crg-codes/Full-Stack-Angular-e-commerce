import { trigger, state, style, transition, animate } from '@angular/animations';

export const dropdownAnimation = trigger('dropdownAnimation', [
  state(
    'void',
    style({
      transform: 'scaleY(0.8)',
      opacity: 0,
    })
  ),
  state(
    'visible',
    style({
      opacity: 1,
      transform: 'scaleY(1)',
    })
  ),
  transition('void => *', animate('200ms ease')),
  transition('* => void', animate('200ms ease')),
]);
