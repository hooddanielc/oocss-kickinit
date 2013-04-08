%%{inc/sizzle.js}
var kick = {
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
      if(kick.type(typeValue) === 'undefined') { // return types value
        return domEl.getAttribute(typeName);
      } else { // set the types value
        return domEl.setAttribute(typeName, typeValue);
      }
    }
    this.on = function(evType, cb){
      return kick.addEvent(domEl, evType, cb);
    }
    this.off = function(evType, cb){
      return kick.removeEvent(domEl, evType, cb);
    }
    this.css = function(a, b) {
      if(kick.type(a) === 'object') {
        for(var x in a) {
          domEl.style[x] = a[x];
        }
      } else if(kick.type(b) === 'undefined' && kick.type(a) === 'string') {
        return domEl.style[a];
      } else {
        domEl.style[a] = b;
      }
    }
  }
}