/*! echo-js-extended v1.7.4 | (c) 2015 @toddmotto | https://github.com/toddmotto/echo */
/*! echo-js-extended v1.7.4 | (c) 2015 @toddmotto | https://github.com/toddmotto/echo */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(function() {
      return factory(root);
    });
  } else if (typeof exports === 'object') {
    module.exports = factory;
  } else {
    root.echo = factory(root);
  }
})(this, function (root) {

  'use strict';

  var echo = {};

  var echoStack = {}; // src: Array( Image, Image, ... )

  var echoStackPinger;

  var callback = function () {};

  var offset, poll, delay, useDebounce, unload, mobileMQBreakpoint;

  var isHidden = function (element) {
    return (element.offsetParent === null);
  };

  var inView = function (element, view) {
    if (isHidden(element)) {
      return false;
    }

    var box = element.getBoundingClientRect();
    return (box.right >= view.l && box.bottom >= view.t && box.left <= view.r && box.top <= view.b);
  };

  var isMobile = function () {
    var width = root.innerWidth || document.documentElement.clientWidth;
    return width < mobileMQBreakpoint;
  };

  var isRetina = function () {
    return window.devicePixelRatio > 1;
  };

  var getMobileSuffix = function () {
    return isMobile() ? '-mob' : '';
  };

  var getRetinaSuffix = function () {
    return isRetina() ? '-retina' : '';
  };

  var debounceOrThrottle = function () {
    if(!useDebounce && !!poll) {
      return;
    }
    clearTimeout(poll);
    poll = setTimeout(function(){
      echo.render();
      poll = null;
    }, delay);
  };

  var getSource = function (elem) {
    var srcDataAttr = 'data-echo' + getMobileSuffix() + getRetinaSuffix();

    return elem.getAttribute(srcDataAttr) ?
              elem.getAttribute(srcDataAttr) :
              elem.getAttribute('data-echo');
  };

  echo.init = function (opts) {
    opts = opts || {};
    var offsetAll = opts.offset || 0;
    var offsetVertical = opts.offsetVertical || offsetAll;
    var offsetHorizontal = opts.offsetHorizontal || offsetAll;
    var optionToInt = function (opt, fallback) {
      return parseInt(opt || fallback, 10);
    };
    offset = {
      t: optionToInt(opts.offsetTop, offsetVertical),
      b: optionToInt(opts.offsetBottom, offsetVertical),
      l: optionToInt(opts.offsetLeft, offsetHorizontal),
      r: optionToInt(opts.offsetRight, offsetHorizontal)
    };
    delay = optionToInt(opts.throttle, 250);
    useDebounce = opts.debounce !== false;
    mobileMQBreakpoint = opts.mobileMQBreakpoint || 768;
    unload = !!opts.unload;
    callback = opts.callback || callback;
    echo.render();
    if (document.addEventListener) {
      root.addEventListener('scroll', debounceOrThrottle, false);
      root.addEventListener('load', debounceOrThrottle, false);
    } else {
      root.attachEvent('onscroll', debounceOrThrottle);
      root.attachEvent('onload', debounceOrThrottle);
    }
  };

  function pinger() {
    var temp;

    echoStackPinger = setInterval(function () {
      for (var src in echoStack) {
        temp = new Image();
        temp.onload = onLoadSuccess.bind(temp, src);
        temp.src = src;
      }
    }, 1500);
  }

  function processImage(src, elem) {
    elem.src = src;

    if (!unload) {
      elem.removeAttribute('data-echo');
      elem.removeAttribute('data-echo-retina');
      elem.removeAttribute('data-echo-mob');
      elem.removeAttribute('data-echo-mob-retina');
    }

    callback(elem, 'load');
  }

  function onLoadSuccess(src, elem) {
    var elems;
    if (elem.tagName === 'IMG') {
      processImage(src, elem);
    } else {
      elems = echoStack[src];

      elems.forEach(function (elem) {
        processImage(src, elem);
      });

      delete echoStack[src];

      if (!Object.keys(echoStack).length) {
        clearInterval(echoStackPinger);
      }

      elems = null;
    }
  }

  function onLoadError(src, elem) {
    echoStack[src] = echoStack[src] || [];
    if (!~echoStack[src].indexOf(elem)) {
      echoStack[src].push(elem);
    }

    if (!echoStackPinger) {
      pinger();
    }
  }

  echo.render = function () {
    var nodes = document.querySelectorAll('img[data-echo], ' +
                                             '[data-echo-retina], ' +
                                             '[data-echo-mob], ' +
                                             '[data-echo-mob-retina]');
    var length = nodes.length;
    var src, elem, temp;
    var view = {
      l: 0 - offset.l,
      t: 0 - offset.t,
      b: (root.innerHeight || document.documentElement.clientHeight) + offset.b,
      r: (root.innerWidth || document.documentElement.clientWidth) + offset.r
    };

    for (var i = 0; i < length; i++) {
      elem = nodes[i];
      if (inView(elem, view)) {
        if (unload) {
          elem.setAttribute('data-echo-placeholder', elem.src);
        }

        src = getSource(elem);

        temp = new Image();
        temp.onerror = onLoadError.bind(temp, src, elem);
        temp.onload = onLoadSuccess.bind(temp, src, elem);

        temp.src = src;
      } else if (unload && !!(src = elem.getAttribute('data-echo-placeholder'))) {
        elem.src = src;
        elem.removeAttribute('data-echo-placeholder');
        callback(elem, 'unload');
      }
    }
    if (!length) {
      echo.detach();
    }
  };

  echo.detach = function () {
    if (document.removeEventListener) {
      root.removeEventListener('scroll', debounceOrThrottle);
    } else {
      root.detachEvent('onscroll', debounceOrThrottle);
    }
    clearTimeout(poll);
  };

  return echo;

});
