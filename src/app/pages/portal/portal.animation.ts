import './portal.variables.scss';

import {
  trigger,
  state,
  style,
  transition,
  animate,
  AnimationTriggerMetadata
} from '@angular/animations';

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

export function controlSlideY(): AnimationTriggerMetadata {
  return trigger('controlStateY', [
    state('close', style({})),
    state(
      'firstRowFromBottom',
      style({
        bottom: '2px',
        'margin-left': '0px'
      })
    ),
    state(
      'firstRowFromBottom-expanded',
      style({
        bottom: '285px',
        'margin-left': '-55px'
      })
    ),
    state(
      'firstRowFromBottom-expanded-maximized',
      style({
        bottom: '500px', // workspace full size
        'margin-left': '-55px'
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
        'firstRowFromBottom-expanded',
        style({
          bottom: '5px'
        })
      ),
      state(
        'firstRowFromBottom-expanded-maximized',
        style({
          bottom: '500px'
        })
      ),
      state(
        'secondRowFromBottom',
        style({
          bottom: '47px'
        })
      ),
      state(
        'thirdRowFromBottom',
        style({
          bottom: '104px'
        })
      ),
      state(
        '',
        style({
          bottom: 'calc(285px)'
        })
      ),
      state(
        'secondRowFromBottom-expanded',
        style({
          bottom: 'calc(285px + 52px)'
        })
      ),
      state(
        'thirdRowFromBottom-expanded',
        style({
          bottom: 'calc(285px + 104px)'
        })
      ),
      transition('* => *', animate('200ms'))
    ])
  ];
}
