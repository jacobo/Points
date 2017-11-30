window.polyfillPointerEvents = function () {

  'use strict';

  var i,
  setUpMouseEvent,
  createUIEvent,
  createEvent,
  createMouseProxyEvent,
  mouseEventIsSimulated,
  createTouchProxyEvent,
  buttonsMap,
  pointerEventProperties;


  pointerEventProperties = 'screenX screenY clientX clientY ctrlKey shiftKey altKey metaKey relatedTarget detail button buttons pointerId pointerType width height pressure tiltX tiltY isPrimary'.split( ' ' );

  createUIEvent = function ( type, bubbles ) {
    var pointerEvent = document.createEvent( 'UIEvents' );
    pointerEvent.initUIEvent( type, bubbles, true, window, 1 );

    return pointerEvent;
  };


  createEvent = function ( type, originalEvent, params, noBubble ) {
    var pointerEvent, i;

    pointerEvent = createUIEvent( type, !noBubble );

    i = pointerEventProperties.length;
    while ( i-- ) {
      Object.defineProperty( pointerEvent, pointerEventProperties[i], {
        value: params[ pointerEventProperties[i] ],
        writable: false
      });
    }

    Object.defineProperty( pointerEvent, 'originalEvent', {
      value: originalEvent,
      writable: false
    });

    Object.defineProperty( pointerEvent, 'preventDefault', {
      value: preventDefault,
      writable: false
    });

    return pointerEvent;
  };


  // https://dvcs.w3.org/hg/pointerevents/raw-file/tip/pointerEvents.html#dfn-chorded-buttons
  buttonsMap = {
    0: 1,
    1: 4,
    2: 2
  };

  createMouseProxyEvent = function ( type, originalEvent, noBubble ) {
    var button, buttons, pressure, params, mouseEventParams, pointerEventParams;

    button = originalEvent.button;
    buttons = originalEvent.buttons;

    // Pressure is 0.5 for buttons down, 0 for no buttons down (unless pressure is
      // reported, obvs)
      pressure = originalEvent.pressure || originalEvent.mozPressure || ( buttons ? 0.5 : 0 );

      // This is the quickest way to copy event parameters. You can't enumerate
      // over event properties in Firefox (possibly elsewhere), so a traditional
      // extend function won't work
      params = {
        screenX:       originalEvent.screenX,
        screenY:       originalEvent.screenY,
        clientX:       originalEvent.clientX,
        clientY:       originalEvent.clientY,
        ctrlKey:       originalEvent.ctrlKey,
        shiftKey:      originalEvent.shiftKey,
        altKey:        originalEvent.altKey,
        metaKey:       originalEvent.metaKey,
        relatedTarget: originalEvent.relatedTarget,
        detail:        originalEvent.detail,
        button:        button,
        buttons:       buttons,

        pointerId:     1,
        pointerType:   'mouse',
        width:         0,
        height:        0,
        pressure:      pressure,
        tiltX:         0,
        tiltY:         0,
        isPrimary:     true,

        preventDefault: preventDefault
      };

      return createEvent( type, originalEvent, params, noBubble );
    };

    setUpMouseEvent = function ( type ) {
      if ( type === 'over' || type === 'out' ) {
        window.addEventListener( 'mouse' + type, function ( originalEvent ) {
          var pointerEvent;

          pointerEvent = createMouseProxyEvent( 'pointer' + type, originalEvent );
          originalEvent.target.dispatchEvent( pointerEvent );

          if ( !originalEvent.target.contains( originalEvent.relatedTarget ) ) {
            pointerEvent = createMouseProxyEvent( ( type === 'over' ? 'pointerenter' : 'pointerleave' ), originalEvent, true );
            originalEvent.target.dispatchEvent( pointerEvent );
          }
        });
      }
      else {
        window.addEventListener( 'mouse' + type, function ( originalEvent ) {
          try {
            var pointerEvent;
            pointerEvent = createMouseProxyEvent( 'pointer' + type, originalEvent );
            originalEvent.target.dispatchEvent( pointerEvent );
          } catch(e) {
            console.log(e)
          }
        });
      }
    };

    [ 'down', 'up', 'over', 'out', 'move' ].forEach( function ( eventType ) {
      setUpMouseEvent( eventType );
    });

    // Single preventDefault function - no point recreating it over and over
    function preventDefault () {
      this.originalEvent.preventDefault();
    }

    // TODO stopPropagation?
}
