(function(){
'use strict';
function boot(){
 var root=document.querySelector('#dc-root');if(!root)return;
 var train=document.createElement('div');train.className='jp-mini-metro';train.setAttribute('aria-hidden','true');
 train.innerHTML='<svg viewBox="0 0 120 44" width="108" height="40" xmlns="http://www.w3.org/2000/svg"><ellipse cx="60" cy="40" rx="56" ry="3" fill="#111" opacity=".18"/><path d="M7 8h43a4 4 0 0 1 4 4v22H3V12a4 4 0 0 1 4-4Z" fill="#f1f3f2" stroke="#283b46" stroke-width="1.7"/><path d="M65 8h35c9 0 14 8 17 18v8H61V12a4 4 0 0 1 4-4Z" fill="#f1f3f2" stroke="#283b46" stroke-width="1.7"/><path d="M4 26h49v5H4ZM62 26h54v5H62Z" fill="#c63538"/><path d="M54 20h7v11h-7Z" fill="#45545d"/><path d="M57 20v11" stroke="#acb8bf" stroke-width="1.2"/><g fill="#234a60" stroke="#17303e" stroke-width=".7"><rect x="9" y="13" width="10" height="10" rx="1.6"/><rect x="24" y="13" width="10" height="10" rx="1.6"/><rect x="68" y="13" width="10" height="10" rx="1.6"/><rect x="83" y="13" width="10" height="10" rx="1.6"/><path d="M100 12c6 2 10 7 13 13h-13Z"/></g><path d="M39 11h9v23h-9ZM96 11v23" fill="#d5dfe3" stroke="#6e838f" stroke-width="1"/><path d="M42 14h3v8h-3Z" fill="#234a60"/><g fill="#25333d" stroke="#e1e6e8" stroke-width="1.5"><circle cx="13" cy="35" r="4"/><circle cx="44" cy="35" r="4"/><circle cx="72" cy="35" r="4"/><circle cx="103" cy="35" r="4"/></g><path d="M12 6h31M68 6h25" stroke="#687c87" stroke-width="2" stroke-linecap="round"/><path d="m73 7 5-5h8l5 5" fill="none" stroke="#344b59" stroke-width="1.6"/><rect x="108" y="27" width="6" height="3" rx="1" fill="#ffe798"/><path d="M7 10h38M65 10h29" stroke="#fff" stroke-width="1.5"/></svg>';
 document.body.appendChild(train);
 var frame=0,lastIndex=-1,ready=false;
 function update(){
  frame=0;var stations=Array.from(document.querySelectorAll('.jp-station')),index=stations.findIndex(function(s){return s.getAttribute('aria-current')==='step';});
  if(index<0){train.hidden=true;return;}
  var dot=stations[index].querySelector('.jp-stop-dot'),r=dot.getBoundingClientRect();if(!r.width){train.hidden=true;return;}train.hidden=false;
  if(lastIndex>=0&&index!==lastIndex)train.style.setProperty('--metro-facing',index<lastIndex?'-1':'1');
  var x=r.left+window.scrollX+r.width/2-54,y=r.top+window.scrollY+r.height/2-35;
  train.style.transform='translate3d('+x+'px,'+y+'px,0)';
  if(!ready){ready=true;requestAnimationFrame(function(){train.classList.add('is-ready');});}
  lastIndex=index;
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(update);}
 new MutationObserver(schedule).observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['aria-current']});
 window.addEventListener('resize',schedule);document.fonts.ready.then(schedule);schedule();
 window.addEventListener('pagehide',function(){cancelAnimationFrame(frame);});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
