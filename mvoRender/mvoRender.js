window.evolv = {};


function initializeRender(){
  if (window.evolv.renderRule) return;

  //debounce code
  function debounce (fn, dur) {
    var timeout;
    return function () {
      clearTimeout(timeout)
      var args = arguments;
      timeout = setTimeout(function () {
        fn.apply(this, args);
      }, (dur || 10))
    }
  }

  // dom manipulation package
  function toNodeValue(sel, context){
    context = context || document;
    if (typeof sel === 'string'){
      if (sel[0] === '<') {
        var div = context.createElement('div');
        div.innerHTML = sel.trim();
        return [div.firstChild]; 
      } else {
        return context.querySelectorAll(sel);
      }
    } else if (sel.constructor === HTMLDivElement){
      return [sel]
    } else if (sel.constructor === ENode){
      return sel.el
    } else if (Array.isArray(sel)){
      return sel
    } else {
      return [];
    }
  }
  var ENode = function(sel, context){
    context = context || document;
    var el = toNodeValue(sel, context);
    this.el = Array.prototype.slice.call(el)
    this.length = this.el.length;
  }
  ENode.prototype.find = function(sel){
    var el = this.el
    return new ENode(el.map(function(e){
      return Array.prototype.slice.call(toNodeValue(sel, e))
    }).flat(2))
  }
  ENode.prototype.closest = function(sel){
    var el = this.el
    return new ENode(el.map(function(e){
      return e.closest(sel)
    }))
  }
  ENode.prototype.parent = function(){
    var el = this.el
    var parents = el.map(function(e){return e.parentNode})
    parents = parents.filter(function(item, pos){
        return parents.indexOf(item) == pos; 
      });
    return new ENode(parents)
  }
  ENode.prototype.contains = function (text) {
    var el = this.el
    return new ENode(el.filter(function (e) { return e.textContent.includes(text)}));
 }
  ENode.prototype.addClass = function(classString){
    this.el.forEach(function(e){
      classString.split(' ').forEach(function(className){
        e.classList.add(className)
      })
    })
    return this;
  }
  ENode.prototype.removeClass = function(className){
    function removeTheClass(e){e.classList.remove(className)}
    this.el.forEach(removeTheClass)
    return this;
  }
  ENode.prototype.append = function(item){
    var node = this.el[0];
    if (!node) return;

    var items = toNodeValue(item)
    items.forEach(function(e){node.append(e);});

    return this;
  }
  ENode.prototype.insertBefore = function(item){
    var node = this.el[0];
    if (!node) {
      console.info('no content for insert') 
      return this;
    }
    if (typeof item === 'string'){
      item = document.querySelectorAll(item);
    } else if (item.constructor === ENode){
      item = item.el[0]
    }
    item.parentNode.insertBefore(node, item);
    return this;
  }
  ENode.prototype.markOnce = function(attr){
    var results = this.el.filter(function(e){
      return !e.getAttribute(attr);
    })
    results.forEach(function(e){e.setAttribute(attr, true)})
    return new ENode(results)
  }
  ENode.prototype.on = function(tag, fnc){
    this.el.forEach(function(e){e.addEventListener(tag,fnc)});
    return this;
  }
  ENode.prototype.html = function(str){
    if (!str) this.el.map(function(e){return e.innerHTML});
 
    this.el.forEach(function(e){e.innerHTML = str;});
    return this;
  }
  ENode.prototype.attr = function(attributes){
    this.el.forEach(function(e){
      var keys = Object.keys(attributes);
      keys.forEach(function(key){
          e.setAttribute(key,attributes[key])
      });
    })
    return this;
  }
  ENode.prototype.watch = function(options){
    var config = Object.assign({}, options || {}, {    
      attributes: false,
      childList: true,
      characterData: false,
      subtree: false
    });
    var cb;
    var observer = new MutationObserver(function (mutations) {
      if (cb) cb(mutations);
    });
    this.el.forEach(function(e){ observer.observe(e, config)});
    return {then: function(fnc){
      cb = fnc;
    }}
  }
  ENode.prototype.firstDom = function(){
    return this.el[0];
  }
  ENode.prototype.lastDom = function(){
    return this.el.slice(-1)[0]
  }
  ENode.prototype.first = function(){
    return new ENode(this.firstDom());
  }
  ENode.prototype.last = function(){
    return new ENode(this.lastDom());
  }

  var $ = function(sel){
    return new ENode(sel);
  }

  var renderRule = {}
  let renderRuleProxy = new Proxy(renderRule, {
    get(target, name, receiver) {
        let rv = Reflect.get(target, name, receiver);
        if (!rv) {
            target[name] = initializeExperimentRule(name); 
            rv = Reflect.get(target, name, receiver)
        }
        return rv;
      }
  });

  //enables creating a rule context via window.evolv.renderRule.myRule
  window.evolv.renderRule = renderRuleProxy;

  function initializeExperimentRule(name){
    var store = {
      reactivate: function(){
        rule.reactivate();
      },
      instrumentDOM: function(data){
        if (data){
          store.cache = Object.assign(store.cache || {}, data || {});
        } else {
          data = store.cache;
        }
        var check = function(obj){
          rule
            .when(rule.trigger(function(){ 
              return obj.dom.length >= (obj.count || 1)
            }))
            .then(function(){
              obj.node = obj.dom.addClass('evolv-' + obj.asClass)
            })
        }
        for(var key in data){
          check(data[key])     
        }
      }
    }

    var rule = {
      fns: {},
      $: $,
      exp: name,
      store: store,
      when: function(trig){
        var variant = null;
        var hasTriggered = false;
        var gdom = null;
        trig(function (dom) {
          gdom = dom;
          hasTriggered = true;
          if (variant) variant(dom);
        });
        return {
          then: function (fnc) {
            variant = fnc;
            if (hasTriggered) variant(gdom);
          },
        };
      },
      nextIndex: 0,
      whenDOM: function(sel){
        var index = rule.nextIndex++
        return rule.when(rule.trigger(function() {
          var attr = 'evolv-'+ rule.exp + index;
          var results = $(sel).markOnce(attr)
          return results.length > 0 ? results : null;
        }))
      },
      trigger: function(selFnc){
        return this.triggerHandler.trigger(selFnc)
      },
      reactivate: function(){
        return this.triggerHandler.reactivate()
      }
    };

    var queuedIntervalHandler = {
      triggerHistoryQueue: [],
      triggerQueue: null,
      trigger: function(selFnc){
        if (!this.triggerQueue){
          this.triggerQueue = []
          this.startProcessing();
        }

        var task = this.createTask(selFnc);
        this.triggerQueue.push(task)
        this.triggerHistoryQueue.push(task)

        return function(fnc){
          task.action = fnc;
        }
      },
      reactivate: function(){
        this.triggerQueue = this.triggerHistoryQueue.slice(0);
        this.startProcessing(500);
      },
      createTask: function(selFnc){
        return {
          selFnc: selFnc,
          action: function(){}
        }
      },
      intervalTimer : null,
      clearIntervalTimer: function(){
        if (this.intervalTimer){
          clearInterval(this.intervalTimer);
          this.intervalTimer = null
        }
      },
      startProcessing: function(duration){
        var int = 60;
        var dur = duration || 10000;

        this.clearIntervalTimer();
    
        function process() {
          var items = this.triggerQueue.slice()

          var results;
          do {
            items = results || items
            results = items.filter(function(task){
              var dom = task.selFnc();
              if (dom) {
                try{
                  task.action(dom);
                } catch(e){
                  console.warn('failed variant', e)
                  window.evolv.client.contaminate({reason:'variant-failed', details: e}, true)
                }
              }
              return !dom;
            })
          } while(items.length > results.length)

          
          this.triggerQueue = results;
          if (results.length === 0){
            setTimeout(function(){ //give other calls a chance to join before we end this.
              if (this.triggerQueue.length !== 0) return;

              this.clearIntervalTimer();
            }.bind(this), 30);
          }
        }

          this.intervalTimer = setInterval(process.bind(this), int);
          $(function(){setTimeout(process.bind(this),1)})
          setTimeout(this.clearIntervalTimer.bind(this), dur);
      }
    }

    rule.triggerHandler = queuedIntervalHandler;

    var validate = {
      lengthGreaterThan: function(val){
        return function(dom){ return dom.length >= val}
      },
      contains: function(val){
        return function(dom){ return !!dom.find(val)}
      },
      notContains: function(val){
        return function(dom){ return !dom.find(val)}
      }
    }

    rule.validate = validate;

    return rule;
  }
}

//initializeRender();

function pageMatch(page){
  if (!page) return false;

  return new RegExp(page).test(location.pathname);
}

function processNav(config){
  var pages = config.pages || [];
  var matches = pages.some(pageMatch);

  if (matches){
    initializeRender();
  }
}


//toggle the following comments to enable directly in experiment code

//processNav({pages: ['.*']});
module.exports = processNav;

