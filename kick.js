%%{inc/sizzle.js}

(function() {
  window.%%{kick} = {
    type: function( obj ) {
      if (obj == null) {
        return String(obj);
      } else if (obj instanceof Array) {
        return "array";
      } else if (Object.prototype.toString.call(obj) == '[object RegExp]') {
        return 'regexp';
      }
      return String(typeof obj);
    },
    addEvent: function(obj, type, fn) {
      if(obj.attachEvent) {
        obj['e'+type+fn] = fn;
        obj[type+fn] = function(){obj['e'+type+fn](window.event);}
        obj.attachEvent('on'+type, obj[type+fn]);
      } else
        obj.addEventListener(type, fn, false);
    },
    removeEvent: function(obj, type, fn) {
      if(obj.detachEvent) {
        obj.detachEvent('on'+type, obj[type+fn]);
        obj[type+fn] = null;
      } else
        obj.removeEventListener(type, fn, false);
    },
    dom: function(a) {
      if(this.type(a) === "string") {
        var dom = Sizzle(a);
        var r;
        dom.length == 1 ? r = new this.Node(dom[0]) : r = dom;
        return r;
      } else if(this.type(a) === "object" && a.nodeName) {
        return new this.Node(a);
      }
    },

    Node: function(domEl) {
      this.attr = function(typeName, typeValue) {
        if(%%{kick}.type(typeValue) === 'undefined') { // return types value
          return domEl.getAttribute(typeName);
        } else { // set the types value
          return domEl.setAttribute(typeName, typeValue);
        }
      }
      this.on = function(evType, cb){
        return %%{kick}.addEvent(domEl, evType, cb);
      }
      this.off = function(evType, cb){
        return %%{kick}.removeEvent(domEl, evType, cb);
      }
      this.css = function(a, b) {
        if(%%{kick}.type(a) === 'object') {
          for(var x in a) {
            domEl.style[x] = a[x];
          }
        } else if(%%{kick}.type(b) === 'undefined' && %%{kick}.type(a) === 'string') {
          return domEl.style[a];
        } else {
          domEl.style[a] = b;
        }
      }
    },

    // Tweening Class
    Tween: function(obj) {
      var start = obj.start || 0,
        end = obj.end || 50,
        millis = obj.millis || 1000,
        cbFrame = obj.cbFrame,
        cbComplete = obj.cbComplete
        tween = obj.tween || Tween.linear;

      // Private vars
      var _fps = 30;
      var _frames = Math.floor(millis / _fps);
      console.log("This many frames is " + _frames);

      var _animFrames = [];
      for(var i = 1; i <= _frames; i++) {
        // percent,elapsed time,start,end,total
        _animFrames.push(i != _frames ? (tween((1 / _frames) * i, _fps * i, start, end, millis)) : end);
      }
      this.animate = function() {
        var count = 0;
        var tick = 1;
        for(var i = 0; i < _animFrames.length; i++) {
          setTimeout(function(e) {
            if(obj.cbFrame) obj.cbFrame(_animFrames[tick - 1]);
            if(i == tick) {
              if(obj.cbComplete) obj.cbComplete();
            }
            tick++;
          }, (1000 / _fps) * (count++));
        }
        console.log('animate');
      }
    }
  };

  // @Class Tween
  %%{kick}.Tween.linear = function(x, t, b, c, d) {
    return b+c*x;
  }
  %%{kick}.Tween.easeInQuad = function (x, t, b, c, d) {
      return c*(t/=d)*t + b;
  }
  %%{kick}.Tween.easeOutQuad = function (x, t, b, c, d) {
      return -c *(t/=d)*(t-2) + b;
  }
  %%{kick}.Tween.easeInOutQuad = function (x, t, b, c, d) {
      if ((t/=d/2) < 1) return c/2*t*t + b;
      return -c/2 * ((--t)*(t-2) - 1) + b;
  }
  %%{kick}.Tween.easeInElastic = function (x, t, b, c, d) {
      var s=1.70158;var p=0;var a=c;
      if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
      if (a < Math.abs(c)) { a=c; var s=p/4; }
      else var s = p/(2*Math.PI) * Math.asin (c/a);
      return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
  }
})( window );