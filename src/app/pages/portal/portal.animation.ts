import {
  AnimationTriggerMetadata,
  animate,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';

import './portal.variables.scss';

export function controlSlideX(): AnimationTriggerMetadata {
  return trigger('controlStateX', [
    state(
      'left',
      style({
        left: '60px'
      })
    ),
    state(
      'right',
      style({
        left: '465px'
      })
    ),
    transition('* => *', animate('200ms'))
  ]);
}

export function controlsAnimations(): AnimationTriggerMetadata[] {
  return [
    trigger('controlsOffsetY', [
      state('close', style({})),
      state(
        'firstRowFromBottom',
        style({
          bottom: '5px'
        })
      ),
      state(
        'secondRowFromBottom',
        style({
          bottom: '35px'
        })
      ),
      transition('* => *', animate('200ms'))
    ])
  ];
}
