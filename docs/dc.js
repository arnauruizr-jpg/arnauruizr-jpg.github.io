/* Motor mínimo para las páginas del portfolio (sin dependencias).
   Plantilla en <template id="dc-tpl">, lógica en window.Component. */
(function () {
  'use strict';
  var HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;
  var WHOLE = /^\{\{\s*([^}]+?)\s*\}\}$/;

  function lookup(scope, path) {
    path = path.trim();
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (path === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
    if (/^'.*'$|^".*"$/.test(path)) return path.slice(1, -1);
    var parts = path.split('.');
    var v = scope;
    for (var i = 0; i < parts.length; i++) {
      if (v == null) return undefined;
      v = v[parts[i]];
    }
    return v;
  }
  function interp(str, scope) {
    return str.replace(HOLE, function (_, p) { var v = lookup(scope, p); return v == null ? '' : String(v); });
  }

  window.DCLogic = function DCLogic(props) { this.props = props || {}; this.state = {}; };
  DCLogic.prototype.setState = function (patch) {
    var self = this;
    if (!self.__prev) self.__prev = Object.assign({}, self.state);
    var p = typeof patch === 'function' ? patch(self.state, self.props) : patch;
    Object.assign(self.state, p || {});
    if (!self.__queued) {
      self.__queued = true;
      Promise.resolve().then(function () {
        self.__queued = false;
        var prev = self.__prev; self.__prev = null;
        self.__render();
        if (self.componentDidUpdate) self.componentDidUpdate(self.props, prev);
      });
    }
  };
  DCLogic.prototype.forceUpdate = function () { this.setState({}); };

  // ---- build a fresh (detached) tree from the template ----
  function build(tplNode, scope, out, refs) {
    for (var c = tplNode.firstChild; c; c = c.nextSibling) {
      if (c.nodeType === 3) { out.appendChild(document.createTextNode(interp(c.nodeValue, scope))); continue; }
      if (c.nodeType !== 1) continue;
      var tag = c.localName;
      if (tag === 'sc-for') {
        var list = lookup(scope, (c.getAttribute('list') || '').replace(/^\{\{|\}\}$/g, '')) || [];
        var as = c.getAttribute('as') || 'item';
        for (var i = 0; i < list.length; i++) {
          var s = Object.create(scope); s[as] = list[i]; s.$index = i;
          build(c, s, out, refs);
        }
        continue;
      }
      if (tag === 'sc-if') {
        var cond = lookup(scope, (c.getAttribute('value') || '').replace(/^\{\{|\}\}$/g, ''));
        if (cond) build(c, scope, out, refs);
        continue;
      }
      var el = c.namespaceURI && c.namespaceURI !== 'http://www.w3.org/1999/xhtml'
        ? document.createElementNS(c.namespaceURI, c.localName)
        : document.createElement(c.localName);
      el.__h = {};
      for (var a = 0; a < c.attributes.length; a++) {
        var at = c.attributes[a], name = at.name, val = at.value;
        if (name.indexOf('hint-') === 0 || name === 'key') continue;
        var m = WHOLE.exec(val);
        if (m) {
          var raw = lookup(scope, m[1]);
          if (/^on[a-z]+$/i.test(name)) { if (typeof raw === 'function') el.__h[name.slice(2).toLowerCase()] = raw; continue; }
          if (name === 'ref') { if (typeof raw === 'function') el.__ref = raw; continue; }
          if (raw === false || raw == null) continue;
          if (raw === true) { el.setAttribute(name, ''); continue; }
          el.setAttribute(name, String(raw));
        } else if (val.indexOf('{{') >= 0) {
          el.setAttribute(name, interp(val, scope));
        } else {
          el.setAttribute(name, val);
        }
      }
      build(c, scope, el, refs);
      out.appendChild(el);
    }
  }

  // ---- morph the live tree into the new one, keeping nodes when possible ----
  function same(a, b) { return a.nodeType === b.nodeType && a.nodeName === b.nodeName; }
  function bindEvents(live, fresh) {
    var h = fresh.__h || {};
    live.__h = h;
    if (!live.__bound) live.__bound = {};
    Object.keys(h).forEach(function (type) {
      if (live.__bound[type]) return;
      live.__bound[type] = true;
      live.addEventListener(type, function (e) { var f = live.__h && live.__h[type]; if (f) f(e); });
    });
  }
  function patch(live, fresh, refs) {
    if (live.nodeType === 3) { if (live.nodeValue !== fresh.nodeValue) live.nodeValue = fresh.nodeValue; return; }
    var i, at;
    for (i = live.attributes.length - 1; i >= 0; i--) {
      at = live.attributes[i];
      if (!fresh.hasAttribute(at.name)) live.removeAttribute(at.name);
    }
    for (i = 0; i < fresh.attributes.length; i++) {
      at = fresh.attributes[i];
      if (live.getAttribute(at.name) !== at.value) live.setAttribute(at.name, at.value);
    }
    if (live.localName === 'button' || live.localName === 'input') live.disabled = fresh.hasAttribute('disabled');
    bindEvents(live, fresh);
    if (fresh.__ref) refs.push([fresh.__ref, live]);
    morphChildren(live, fresh, refs);
  }
  function adopt(node, refs) {
    if (node.nodeType === 1) {
      bindEvents(node, node);
      if (node.__ref) refs.push([node.__ref, node]);
      for (var c = node.firstChild; c; c = c.nextSibling) adopt(c, refs);
    }
    return node;
  }
  function morphChildren(liveParent, freshParent, refs) {
    var fresh = Array.prototype.slice.call(freshParent.childNodes);
    var live = Array.prototype.slice.call(liveParent.childNodes);
    for (var i = 0; i < fresh.length; i++) {
      var f = fresh[i], l = live[i];
      if (l && same(l, f)) patch(l, f, refs);
      else if (l) liveParent.replaceChild(adopt(f, refs), l);
      else liveParent.appendChild(adopt(f, refs));
    }
    for (var j = live.length - 1; j >= fresh.length; j--) liveParent.removeChild(live[j]);
  }

  function boot() {
    var tpl = document.getElementById('dc-tpl');
    var root = document.getElementById('dc-root');
    var propsEl = document.getElementById('dc-props');
    var props = {};
    if (propsEl) {
      try {
        var spec = JSON.parse(propsEl.textContent || '{}');
        Object.keys(spec).forEach(function (k) { if (k.charAt(0) !== '$' && spec[k] && 'default' in spec[k]) props[k] = spec[k]['default']; });
      } catch (e) {}
    }
    var C = window.Component || function () { DCLogic.call(this, props); };
    var inst = new C(props);
    inst.props = inst.props || props;
    inst.state = inst.state || {};
    inst.__render = function () {
      var vals = inst.renderVals ? inst.renderVals() : {};
      var frag = document.createDocumentFragment();
      var refs = [];
      build(tpl.content, vals, frag, refs);
      morphChildren(root, frag, refs);
      refs.forEach(function (r) { try { r[0](r[1]); } catch (e) {} });
    };
    inst.__render();
    if (inst.componentDidMount) inst.componentDidMount();
    window.addEventListener('pagehide', function () { if (inst.componentWillUnmount) inst.componentWillUnmount(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
