/* Preview-only color adaptation of the existing pages, including dynamic DC states. */
(function(){
 'use strict';
 function rgb(value){
  var h=value.trim().match(/^#([a-f\d]{3}|[a-f\d]{6})$/i);
  if(h){var s=h[1];if(s.length===3)s=s.split('').map(function(c){return c+c;}).join('');return [parseInt(s.slice(0,2),16),parseInt(s.slice(2,4),16),parseInt(s.slice(4,6),16)];}
  var m=value.match(/^rgba?\(\s*([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)/i);return m?[+m[1],+m[2],+m[3]]:null;
 }
 function tone(value,background){
  var c=rgb(value);if(!c)return value;
  var hi=Math.max.apply(null,c),lo=Math.min.apply(null,c),light=(hi+lo)/510,sat=(hi-lo)/255;
  if(background){
   if(sat>.16&&hi>100)return 'var(--accent)';
   return light>.65?'var(--raised)':'var(--surface)';
  }
  if(sat>.16&&hi>90)return 'var(--accent)';
  return light>.9||light<.24?'var(--text)':'var(--muted)';
 }
 var colorPattern=/#(?:[a-f\d]{6}|[a-f\d]{3})(?![a-f\d])|rgba?\([^)]*\)/gi;
 function recolor(el){
  if(el.closest('.train,.trainpos,.tactile')||el.tagName==='IMG')return;
  var s=el.style;if(!s)return;
  var bg=s.getPropertyValue('background'),bc=s.getPropertyValue('background-color');
  var accentBackground=/var\(--accent\)/.test(bg+" "+bc);
  if(bg&&!bg.includes('var(')&&!bg.includes('url(')){
   var mapped=bg.replace(colorPattern,function(v){return tone(v,true);});accentBackground=mapped.includes('var(--accent)');if(mapped!==bg)s.setProperty('background',mapped);
  }
  if(bc&&!bc.includes('var(')){var mappedBC=tone(bc,true);accentBackground=accentBackground||mappedBC==='var(--accent)';if(mappedBC!==bc)s.setProperty('background-color',mappedBC);}
  var fg=s.getPropertyValue('color');if(fg&&!fg.includes('var(')){var newFg=accentBackground?'var(--ink)':tone(fg,false);if(newFg!==fg)s.setProperty('color',newFg);}
  el.classList.toggle('theme-accent',accentBackground);
  ['border','border-top','border-bottom','border-left','border-right','outline'].forEach(function(prop){var v=s.getPropertyValue(prop);if(v&&!v.includes('var(')){var mapped=v.replace(colorPattern,'var(--line)');if(mapped!==v)s.setProperty(prop,mapped);}});
  var shadow=s.getPropertyValue('box-shadow');if(shadow&&/0px? 0px? 0px? 1px|0 0 0 1px/.test(shadow)&&!shadow.includes('var('))s.setProperty('box-shadow',shadow.replace(colorPattern,'var(--line)'));
  if(el.namespaceURI==='http://www.w3.org/2000/svg'){
   var fill=el.getAttribute('fill'),fc=fill&&rgb(fill);
   if(fc&&!fill.includes('var(')){
    if(el.tagName.toLowerCase()==='text')el.setAttribute('fill',tone(fill,false));
    else if(Math.min.apply(null,fc)>155&&Math.max.apply(null,fc)-Math.min.apply(null,fc)<55)el.setAttribute('fill','var(--raised)');
   }
   var stroke=el.getAttribute('stroke'),sc=stroke&&rgb(stroke);
   if(sc&&Math.max.apply(null,sc)<100&&!stroke.includes('var('))el.setAttribute('stroke','var(--muted)');
  }
 }
 function boot(){
  var observer=new MutationObserver(function(records){observer.disconnect();var nodes=new Set();records.forEach(function(r){if(r.type==='attributes')nodes.add(r.target);else r.addedNodes.forEach(function(n){if(n.nodeType===1){nodes.add(n);n.querySelectorAll('[style],[fill],[stroke]').forEach(function(e){nodes.add(e);});}});});nodes.forEach(recolor);observe();});
  function observe(){observer.observe(document.querySelector('#dc-root')||document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['style','fill','stroke']});}
  document.querySelectorAll('[style],[fill],[stroke]').forEach(recolor);observe();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
