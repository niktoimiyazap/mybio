(() => {
  const canvas = document.querySelector('.new-music__stars');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', {alpha:false});
  if (!ctx) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let w=0,h=0,dpr=1,stars=[],frame=0,visible=true,last=0;
  const randomStar=()=>({x:(Math.random()-.5)*w,y:(Math.random()-.5)*h,z:Math.random()*.94+.06,s:Math.random()*.8+.4});
  function resize(){
    const r=canvas.getBoundingClientRect(); w=r.width;h=r.height;
    dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    stars=Array.from({length:Math.min(175,Math.max(70,Math.round(w*h/3200)))},randomStar);
    draw(0);
  }
  function draw(dt){
    ctx.fillStyle='#080915';ctx.fillRect(0,0,w,h);
    const cx=w*.68,cy=h*.49,scale=Math.max(w,h)*.88;
    const glow=ctx.createRadialGradient(cx,cy,8,cx,cy,Math.max(w,h)*.55);
    glow.addColorStop(0,'rgba(80,64,147,.35)');glow.addColorStop(.4,'rgba(35,26,89,.13)');glow.addColorStop(1,'rgba(6,7,20,0)');
    ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
    stars.forEach(p=>{
      if(dt){p.z-=dt*.00021*p.s;if(p.z<.035){Object.assign(p,randomStar());p.z=1;}}
      const x=cx+p.x/p.z,y=cy+p.y/p.z;
      if(x<0||x>w||y<0||y>h){Object.assign(p,randomStar());p.z=1;return;}
      const tail=dt?Math.min(32,Math.max(1,8/p.z)):1;
      const length=Math.hypot(p.x,p.y)||1;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-p.x/length*tail,y-p.y/length*tail);
      ctx.strokeStyle='rgba(200,206,255,'+(Math.min(.95,.16+.8*(1-p.z)))+')';
      ctx.lineWidth=Math.min(2.1,Math.max(.45,1.3/p.z*.25))*p.s;ctx.stroke();
    });
  }
  function step(now){
    if(!visible||document.hidden||reduce.matches){frame=0;return;}
    const dt=Math.min(34,now-(last||now));last=now;draw(dt);frame=requestAnimationFrame(step);
  }
  function start(){if(frame||!visible||document.hidden||reduce.matches)return;last=0;frame=requestAnimationFrame(step);}
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)start();else if(frame){cancelAnimationFrame(frame);frame=0;}});
  observer.observe(canvas);
  document.addEventListener('visibilitychange',start);
  reduce.addEventListener?.('change',()=>{if(reduce.matches){cancelAnimationFrame(frame);frame=0;draw(0);}else start();});
  window.addEventListener('resize',resize,{passive:true});resize();start();
})();