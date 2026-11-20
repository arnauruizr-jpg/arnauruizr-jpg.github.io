(function () {
  'use strict';
  function boot() {
    var scene=document.querySelector('.scene'),sun=scene.querySelector('.sun');
    var svg=scene.querySelector('.portfolio-title svg'),mask=svg.querySelector('#light-mask-gradient');
    var reduced=matchMedia('(prefers-reduced-motion: reduce)');
    var routes={'01':.1352,'02':.3424,'03':.57,'04':.8656};
    var x=.13,target=.57,velocity=0,frame=0,previous=0,timer=0;
    var width=scene.clientWidth,sceneRect,matrix,inverse,anchors=[];
    function geometry() {
      width=scene.clientWidth;sceneRect=scene.getBoundingClientRect();
      matrix=svg.getScreenCTM();inverse=matrix.inverse();
      var summitX={'01':.52,'02':.58,'03':.5,'04':.58};
      var summitY={'01':.14,'02':.03,'03':.06,'04':.02};
      anchors=Object.keys(routes).map(function(route){
        var rect=scene.querySelector('.peak[data-route="'+route+'"]').getBoundingClientRect();
        var px=rect.left-sceneRect.left+rect.width*summitX[route];
        routes[route]=px/width;
        return {x:px/width,y:rect.top-sceneRect.top+rect.height*summitY[route]};
      });
      paint();
    }
    function paint() {
      if (!matrix) return;
      var cy=anchors[0].y;
      if(x>=anchors[anchors.length-1].x)cy=anchors[anchors.length-1].y;
      else for(var i=0;i<anchors.length-1;i++)if(x>=anchors[i].x&&x<=anchors[i+1].x){
        var t=(x-anchors[i].x)/(anchors[i+1].x-anchors[i].x);t=t*t*(3-2*t);
        cy=anchors[i].y+(anchors[i+1].y-anchors[i].y)*t;break;
      }
      var cx=x*width;
      var radius=sun.offsetWidth/2;
      sun.style.setProperty('--sun-x',(cx-radius).toFixed(2)+'px');
      sun.style.setProperty('--sun-y',(cy-radius).toFixed(2)+'px');
      var point=svg.createSVGPoint();point.x=sceneRect.left+cx;point.y=sceneRect.top+cy;
      var local=point.matrixTransform(inverse);
      mask.setAttribute('cx',local.x.toFixed(2));mask.setAttribute('cy',local.y.toFixed(2));
    }
    function animate(now) {
      var dt=Math.min((now-previous)/1000||1/60,.05);previous=now;
      var omega=8,offset=x-target,step=(velocity+omega*offset)*dt,decay=Math.exp(-omega*dt);
      x=target+(offset+step)*decay;velocity=(velocity-omega*step)*decay;paint();
      if (Math.abs(x-target)+Math.abs(velocity)>.0003) frame=requestAnimationFrame(animate);
      else { x=target;paint();frame=0;previous=0; }
    }
    function move(route) {
      if (!routes[route]) return;target=routes[route];
      if (reduced.matches) { x=target;velocity=0;paint();return; }
      if (!frame) frame=requestAnimationFrame(animate);
    }
    scene.addEventListener('pointerover',function (event) {
      var link=event.target.closest('.peak[data-route],.tag[data-route]');
      if (!link||link.contains(event.relatedTarget)) return;
      var focused=scene.querySelector('.tag:focus-visible');
      if (focused) {clearTimeout(timer);move(focused.getAttribute('data-route'));return;}
      clearTimeout(timer);timer=setTimeout(function(){move(link.getAttribute('data-route'));},90);
    });
    scene.addEventListener('focusin',function () {
      var link=scene.querySelector('.tag:focus-visible');
      if (link) {clearTimeout(timer);move(link.getAttribute('data-route'));}
    });
    window.addEventListener('resize',geometry);
    window.addEventListener('pagehide',function(){clearTimeout(timer);cancelAnimationFrame(frame);});
    geometry();
    document.fonts.ready.then(function(){geometry();if(reduced.matches){x=target;paint();}else if(!frame)frame=requestAnimationFrame(animate);});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
