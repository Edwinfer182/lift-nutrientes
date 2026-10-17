
(()=>{
'use strict';
let viewer,stage,img,counter,percent,images=[],index=0,scale=1,offsetX=0,offsetY=0,oldOverflow='',previousFocus=null;
const touches=new Map();let drag=null,pinchDistance=0,swipe=null;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function bounds(){const w=img.offsetWidth,h=img.offsetHeight;return {x:Math.max(0,(w*scale-stage.clientWidth)/2),y:Math.max(0,(h*scale-stage.clientHeight)/2)};}
function paint(){if(!img)return;scale=clamp(scale,1,5);if(scale===1){offsetX=0;offsetY=0;}else{const b=bounds();offsetX=clamp(offsetX,-b.x,b.x);offsetY=clamp(offsetY,-b.y,b.y);}img.style.transform=`translate3d(${offsetX}px,${offsetY}px,0) scale(${scale})`;percent.textContent=Math.round(scale*100)+'%';stage.classList.toggle('zoomed',scale>1);}
function zoom(value){scale=clamp(value,1,5);paint();}
function fitImage(){
 if(!img||!stage||!img.naturalWidth||!img.naturalHeight)return;
 const availableWidth=Math.max(1,stage.clientWidth-(window.innerWidth<=600?80:112));
 const availableHeight=Math.max(1,stage.clientHeight-(window.innerWidth<=600?24:36));
 const ratio=Math.min(availableWidth/img.naturalWidth,availableHeight/img.naturalHeight);
 img.style.setProperty('width',Math.max(1,Math.floor(img.naturalWidth*ratio))+'px','important');
 img.style.setProperty('height',Math.max(1,Math.floor(img.naturalHeight*ratio))+'px','important');
 img.style.setProperty('max-width','none','important');
 img.style.setProperty('max-height','none','important');
 img.style.setProperty('object-fit','contain','important');
 paint();
}
function show(n){if(!images.length)return;index=(n+images.length)%images.length;scale=1;offsetX=offsetY=0;img.src=images[index];img.onload=fitImage;if(img.complete&&img.naturalWidth)fitImage();counter.textContent=`${index+1} / ${images.length}`;viewer.querySelector('.livTopCounter').textContent=`${index+1} / ${images.length}`;viewer.querySelectorAll('.livArrow').forEach(el=>el.hidden=images.length<2);}
function close(){if(!viewer?.classList.contains('open'))return;viewer.classList.remove('open');touches.clear();drag=null;document.body.style.overflow=oldOverflow;previousFocus?.focus?.();}
function ensure(){if(viewer)return;
 viewer=document.createElement('div');viewer.id='liftImageViewer';viewer.setAttribute('role','dialog');viewer.setAttribute('aria-modal','true');viewer.setAttribute('aria-label','Galería de imágenes del producto');
 viewer.innerHTML=`<div class="livDialog"><div class="livTop"><span class="livTitle"></span><strong class="livTopCounter" aria-live="polite">1 / 1</strong><div class="livTools"><button type="button" data-action="minus" aria-label="Reducir">−</button><span class="livPercent">100%</span><button type="button" data-action="plus" aria-label="Ampliar">+</button><button type="button" data-action="reset" aria-label="Restablecer">⟲</button><button type="button" class="livClose" data-action="close" aria-label="Cerrar">×</button></div></div><div class="livStageWrap"><div class="livStage"><img alt="" draggable="false"></div><button type="button" class="livArrow livPrev" data-action="prev" aria-label="Anterior">‹</button><button type="button" class="livArrow livNext" data-action="next" aria-label="Siguiente">›</button></div><div class="livFoot"><strong class="livCounter">1 / 1</strong><span class="livHint">Arrastra para explorar · Desliza para cambiar imagen</span></div></div>`;
 document.body.append(viewer);stage=viewer.querySelector('.livStage');img=stage.querySelector('img');window.addEventListener('resize',fitImage,{passive:true});counter=viewer.querySelector('.livCounter');percent=viewer.querySelector('.livPercent');
 viewer.addEventListener('click',e=>{if(e.target===viewer){close();return;}const action=e.target.closest('button')?.dataset.action;if(!action)return;switch(action){case 'close':close();break;case 'plus':zoom(scale+.5);break;case 'minus':zoom(scale-.5);break;case 'reset':zoom(1);break;case 'prev':show(index-1);break;case 'next':show(index+1);break;}});
 stage.addEventListener('dragstart',e=>e.preventDefault());stage.addEventListener('selectstart',e=>e.preventDefault());
 stage.addEventListener('wheel',e=>{e.preventDefault();zoom(scale+(e.deltaY<0?.35:-.35));},{passive:false});
 stage.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;e.preventDefault();stage.setPointerCapture(e.pointerId);touches.set(e.pointerId,{x:e.clientX,y:e.clientY});if(touches.size===1){drag={x:e.clientX,y:e.clientY,startX:offsetX,startY:offsetY};swipe={x:e.clientX,y:e.clientY};stage.classList.add('dragging');}else if(touches.size===2){const a=[...touches.values()];pinchDistance=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);drag=null;swipe=null;}});
 stage.addEventListener('pointermove',e=>{if(!touches.has(e.pointerId))return;e.preventDefault();touches.set(e.pointerId,{x:e.clientX,y:e.clientY});if(touches.size===2){const a=[...touches.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);if(pinchDistance>0)zoom(scale*d/pinchDistance);pinchDistance=d;return;}if(scale>1&&drag){offsetX=drag.startX+(e.clientX-drag.x);offsetY=drag.startY+(e.clientY-drag.y);paint();}});
 function end(e){if(!touches.has(e.pointerId))return;if(touches.size===1&&scale===1&&swipe){const dx=e.clientX-swipe.x,dy=e.clientY-swipe.y;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.3)show(index+(dx<0?1:-1));}touches.delete(e.pointerId);drag=null;swipe=null;pinchDistance=0;stage.classList.remove('dragging');}
 stage.addEventListener('pointerup',end);stage.addEventListener('pointercancel',end);stage.addEventListener('lostpointercapture',end);
 stage.addEventListener('dblclick',e=>{e.preventDefault();zoom(scale>1?1:2.5);});
 document.addEventListener('keydown',e=>{if(!viewer.classList.contains('open'))return;if(e.key==='Escape')close();else if(e.key==='ArrowLeft')show(index-1);else if(e.key==='ArrowRight')show(index+1);else if(e.key==='+'||e.key==='=')zoom(scale+.5);else if(e.key==='-')zoom(scale-.5);});
}
window.liftOpenImageViewer=(src,alt='Imagen del producto')=>{if(!src)return;ensure();previousFocus=document.activeElement;oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';const area=document.getElementById('liftMonoZoomArea');const thumbs=area?[...area.querySelectorAll('.liftSecondaryThumb img')].map(el=>el.getAttribute('src')).filter(Boolean):[];images=[...new Set(thumbs.length?thumbs:[src])];index=images.indexOf(src);if(index<0){images.unshift(src);index=0;}viewer.querySelector('.livTitle').textContent=alt;img.alt=alt;viewer.classList.add('open');show(index);viewer.querySelector('.livClose').focus();};
})();
