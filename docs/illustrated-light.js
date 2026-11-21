(function(){
 'use strict';
 function boot(){
  var scene=document.querySelector('.landscape'),image=document.querySelector('.foreground'),sun=document.querySelector('.sun'),wash=document.querySelector('.mountain-light');
  var svg=document.querySelector('.portfolio svg'),gradient=document.querySelector('#hero-light-gradient');
  var positions={'01':{x:.105,y:.46},'02':{x:.35,y:.495},'03':{x:.602,y:.30},'04':{x:.895,y:.35}};
  var x=.35,target=.602,velocity=0,raf=0,last=0,timer=0,rect,imgRect,matrix,inv;
  var reduced=matchMedia('(prefers-reduced-motion: reduce)');
  function geometry(){rect=scene.getBoundingClientRect();imgRect=image.getBoundingClientRect();matrix=svg.getScreenCTM();inv=matrix.inverse();paint();}
  function yAt(t){
   var a=Object.values(positions);if(t<=a[0].x)return a[0].y;if(t>=a[3].x)return a[3].y;
   for(var i=0;i<3;i++)if(t>=a[i].x&&t<=a[i+1].x){var s=(t-a[i].x)/(a[i+1].x-a[i].x);s=s*s*(3-2*s);return a[i].y+(a[i+1].y-a[i].y)*s;}
  }
  function paint(){
   if(!matrix||!imgRect.width)return;
   var py=yAt(x),cx=imgRect.left-rect.left+imgRect.width*x,cy=imgRect.top-rect.top+imgRect.height*py;
   var radius=sun.offsetWidth/2;
   sun.style.setProperty('--sx',(cx-radius)+'px');sun.style.setProperty('--sy',(cy-radius)+'px');
   wash.style.setProperty('--light-x',(imgRect.width*x)+'px');wash.style.setProperty('--light-y',(imgRect.height*py+65)+'px');
   var p=svg.createSVGPoint();p.x=rect.left+cx;p.y=rect.top+cy;var local=p.matrixTransform(inv);
   gradient.setAttribute('cx',local.x);gradient.setAttribute('cy',local.y);
  }
  function step(now){
   var dt=Math.min((now-last)/1000||1/60,.05);last=now;
   var w=4.5,d=x-target,b=(velocity+w*d)*dt,e=Math.exp(-w*dt);x=target+(d+b)*e;velocity=(velocity-w*b)*e;paint();
   if(Math.abs(x-target)+Math.abs(velocity)>.0003)raf=requestAnimationFrame(step);else{raf=0;last=0;x=target;paint();}
  }
  function move(route){if(!positions[route])return;scene.dataset.active=route;target=positions[route].x;if(reduced.matches){x=target;paint();}else if(!raf)raf=requestAnimationFrame(step);}
  scene.addEventListener('pointerover',function(e){var link=e.target.closest('[data-route]');if(!link||link.contains(e.relatedTarget))return;clearTimeout(timer);timer=setTimeout(function(){move(link.dataset.route);},90);});
  scene.addEventListener('focusin',function(e){var link=e.target.closest('[data-route]');if(link){clearTimeout(timer);move(link.dataset.route);}});
  scene.addEventListener('pointerleave',function(){clearTimeout(timer);delete scene.dataset.active;});
  scene.addEventListener('focusout',function(e){if(!scene.contains(e.relatedTarget))delete scene.dataset.active;});
  window.addEventListener('resize',geometry);
  window.addEventListener('pagehide',function(){clearTimeout(timer);cancelAnimationFrame(raf);});
  Promise.all([image.decode().catch(function(){}),document.fonts.ready]).then(function(){if(innerWidth<=760||reduced.matches)x=target;geometry();if(!reduced.matches&&innerWidth>760)raf=requestAnimationFrame(step);});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
