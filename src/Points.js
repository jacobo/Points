window.polyfillPointerEvents = function () {

  'use strict';

  console.log("polyfillPointerEvents...");

  var activePointers,
  numActivePointers,
  recentTouchStarts,
  mouseDefaults,
  mouseEvents,
  i,
  setUpMouseEvent,
  createUIEvent,
  createEvent,
  createMouseProxyEvent,
  mouseEventIsSimulated,
  createTouchProxyEvent,
  buttonsMap,
  pointerEventProperties;


  pointerEventProperties = 'screenX screenY clientX clientY ctrlKey shiftKey altKey metaKey relatedTarget detail button buttons pointerId pointerType width height pressure tiltX tiltY isPrimary'.split( ' ' );

  // Can we create events using the MouseEvent constructor? If so, gravy
  try {
    i = new UIEvent( 'test' );

    createUIEvent = function ( type, bubbles ) {
      return new UIEvent( type, { view: window, bubbles: bubbles });
    };

    // otherwise we need to do things oldschool
  } catch ( err ) {
    if ( document.createEvent ) {
      console.log("oldschool it is...")
      createUIEvent = function ( type, bubbles ) {
        var pointerEvent = document.createEvent( 'UIEvents' );
        pointerEvent.initUIEvent( type, bubbles, true, window, 1 );

        return pointerEvent;
      };
    }
  }

  if ( !createUIEvent ) {
    throw new Error( 'Cannot create events. You may be using an unsupported browser.' );
  }

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
  console.log("createEvent defined");


  // https://dvcs.w3.org/hg/pointerevents/raw-file/tip/pointerEvents.html#dfn-chorded-buttons
  buttonsMap = {
    0: 1,
    1: 4,
    2: 2
  };

  createMouseProxyEvent = function ( type, originalEvent, noBubble ) {
    console.log("createMouseProxyEvent")
    console.log(type)
    var button, buttons, pressure, params, mouseEventParams, pointerEventParams;

    // normalise button and buttons
    if ( originalEvent.buttons !== undefined ) {
      buttons = originalEvent.buttons;
      button = !originalEvent.buttons ? -1 : originalEvent.button;
    }

    else {
      if ( event.button === 0 && event.which === 0 ) {
        button = -1;
        buttons = 0;
      } else {
        button = originalEvent.button;
        buttons = buttonsMap[ button ];
      }
    }

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

    console.log("createMouseProxyEvent defined")

    // Some mouse events are real, others are simulated based on touch events.
    // We only want the real ones, or we'll end up firing our load at
    // inappropriate moments.
    //
    // Surprisingly, the coordinates of the mouse event won't exactly correspond
    // with the touchstart that originated them, so we need to be a bit fuzzy.


    setUpMouseEvent = function ( type ) {
      console.log("setUpMouseEvent " + type);
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
        console.log("addEventListener + mouse" + type);
        window.addEventListener( 'mouse' + type, function ( originalEvent ) {
          try {
          
            if (type == "down"){
              console.log("handling event")
              console.log(originalEvent)
            }
            var pointerEvent;

            pointerEvent = createMouseProxyEvent( 'pointer' + type, originalEvent );
            console.log("dispatching event")
            console.log(originalEvent)
            originalEvent.target.dispatchEvent( pointerEvent );

          } catch(e) {
            console.log(e)
          }
        });
      }
    };
    console.log("setUpMouseEvent defined");

    var stuff = [ 'down', 'up', 'over', 'out', 'move' ];

    console.log(stuff);

    // [ 'down', 'up', 'over', 'out', 'move' ].forEach( function ( eventType ) {
    //   setUpMouseEvent( eventType );
    // });

    [ 'down', 'up', 'over', 'out' ].forEach( function ( eventType ) {
      setUpMouseEvent( eventType );
    });
    console.log("setUpMouseEvent called for all the important things....")

    // Single preventDefault function - no point recreating it over and over
    function preventDefault () {
      this.originalEvent.preventDefault();
    }

    // TODO stopPropagation?

}
