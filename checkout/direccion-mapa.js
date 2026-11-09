/* SUPGO · Dirección con Google Maps en el checkout.
   Sugerencias de dirección (Places API New), mapa con pin ajustable y ubicación actual.
   Si no hay clave configurada (lift_catalog_config.google_maps.key) o Google falla, el formulario sigue funcionando igual. */
(function(){
'use strict';
var SB='https://vdxkknftyssjyfbdieqa.supabase.co',KEY='sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh';
var MDE={lat:6.2442,lng:-75.5812};
function $(id){return document.getElementById(id)}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
var input=$('direccion'),field=$('f-direccion');
if(!input||!field)return;

var S={key:'',loading:null,token:null,preds:[],geo:null,map:null,seq:0,timer:0};

/* API pública para el checkout */
window.SupgoGeo={
  link:function(){return S.geo?'https://maps.google.com/?q='+S.geo.lat.toFixed(6)+','+S.geo.lng.toFixed(6):''},
  clear:function(){S.geo=null;hideMap()}
};

/* ---------- Interfaz ---------- */
var css=document.createElement('style');
css.textContent='.addrSug{position:absolute;left:0;right:0;top:100%;margin-top:4px;background:#fff;border:1px solid var(--line,#e5e5e5);border-radius:10px;box-shadow:0 12px 30px rgba(0,0,0,.1);max-height:280px;overflow:auto;z-index:16;padding:4px;display:none}'+
'.addrSug.open{display:block}.addrSug button{display:flex;gap:10px;align-items:flex-start;width:100%;text-align:left;border:0;background:none;padding:10px 12px;border-radius:8px;cursor:pointer;font:inherit;font-size:14px;line-height:1.3}'+
'.addrSug button:hover,.addrSug button.on{background:var(--soft,#f4f4f2)}.addrSug button small{display:block;color:var(--muted,#777);font-size:12px}.addrSug .pw{display:block;text-align:right;font-size:10.5px;color:#999;padding:4px 8px 2px}'+
'.geoRow{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}.geoBtn{border:1px solid var(--line,#ddd);background:#fff;border-radius:999px;padding:7px 12px;font:inherit;font-size:12.5px;cursor:pointer}'+
'.geoMap{position:relative;margin-top:10px;border-radius:12px;overflow:hidden;border:1px solid var(--line,#ddd);height:220px;background:#eef0ec}.geoMap .m{position:absolute;inset:0}'+
'.geoMap .pin{position:absolute;left:50%;top:50%;transform:translate(-50%,-100%);font-size:34px;line-height:1;pointer-events:none;filter:drop-shadow(0 3px 3px rgba(0,0,0,.35));z-index:2}'+
'.geoMap .tip{position:absolute;left:8px;right:8px;bottom:8px;background:rgba(17,17,17,.82);color:#fff;font-size:12px;border-radius:8px;padding:7px 10px;z-index:2;pointer-events:none;text-align:center}'+
'.geoOk{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:6px;font-size:12px;color:var(--green,#15803d)}.geoOk button{border:0;background:none;color:var(--muted,#777);text-decoration:underline;font:inherit;font-size:12px;cursor:pointer}';
document.head.appendChild(css);

var sug=document.createElement('div');sug.className='addrSug';sug.setAttribute('role','listbox');
field.style.position='relative';input.insertAdjacentElement('afterend',sug);
var row=document.createElement('div');row.className='geoRow';row.hidden=true;
row.innerHTML='<button type="button" class="geoBtn" id="geoHere">📍 Usar mi ubicación actual</button>';
var box=document.createElement('div');box.hidden=true;
box.innerHTML='<div class="geoMap"><div class="m" id="geoM"></div><div class="pin">📍</div><div class="tip">Mueve el mapa para dejar el pin justo en tu entrada</div></div><div class="geoOk"><span>✓ Ubicación guardada para el domiciliario</span><button type="button" id="geoOff">Quitar</button></div>';
field.insertAdjacentElement('afterend',box);field.insertAdjacentElement('afterend',row);
input.setAttribute('autocomplete','off');
var notas=$('notas');if(notas){notas.placeholder='Apto, torre, interior, portería, horario…';var lb=notas.closest('label')&&notas.closest('label').querySelector('.label');if(lb)lb.innerHTML='Apto, torre e indicaciones <small>(opcional)</small>'}

/* ---------- Google ---------- */
function getKey(){
  return fetch(SB+'/rest/v1/lift_catalog_config?clave=eq.google_maps&select=valor',{headers:{apikey:KEY,Authorization:'Bearer '+KEY}})
    .then(function(r){return r.ok?r.json():[]}).then(function(rows){var v=rows&&rows[0]&&rows[0].valor;return v&&v.key&&v.activo!==false?String(v.key):''}).catch(function(){return ''});
}
function load(){
  if(S.loading)return S.loading;
  S.loading=(S.key?Promise.resolve(S.key):getKey()).then(function(k){
    if(!k)throw new Error('sin clave');S.key=k;
    if(window.google&&google.maps&&google.maps.places&&google.maps.places.AutocompleteSuggestion)return;
    return new Promise(function(res,rej){
      window.__supgoGm=function(){res()};
      var s=document.createElement('script');
      s.src='https://maps.googleapis.com/maps/api/js?key='+encodeURIComponent(k)+'&libraries=places&language=es&region=CO&loading=async&callback=__supgoGm';
      s.async=true;s.onerror=function(){rej(new Error('Google Maps no cargó'))};document.head.appendChild(s);
      setTimeout(function(){rej(new Error('Google Maps tardó demasiado'))},12000);
    });
  });
  S.loading.catch(function(){row.hidden=true});
  return S.loading;
}
function cityName(){var c=$('ciudad');return c?c.value.split('·')[0].trim():''}
function suggest(){
  var q=input.value.trim(),my=++S.seq;
  if(q.length<4){close();return}
  load().then(function(){
    var P=google.maps.places;if(!S.token)S.token=new P.AutocompleteSessionToken();
    var req={input:q+(cityName()&&q.toLowerCase().indexOf(cityName().toLowerCase())<0?', '+cityName():''),includedRegionCodes:['co'],language:'es',region:'co',sessionToken:S.token};
    if(S.geo||S.bias)req.locationBias={center:S.geo||S.bias,radius:30000};
    return P.AutocompleteSuggestion.fetchAutocompleteSuggestions(req);
  }).then(function(r){
    if(my!==S.seq)return;
    S.preds=(r&&r.suggestions||[]).map(function(s){return s.placePrediction}).filter(Boolean).slice(0,5);
    if(!S.preds.length){close();return}
    sug.innerHTML=S.preds.map(function(p,i){var m=p.mainText?p.mainText.text:p.text.text,s=p.secondaryText?p.secondaryText.text:'';return '<button type="button" role="option" data-i="'+i+'"><span>📍</span><span>'+esc(m)+'<small>'+esc(s)+'</small></span></button>'}).join('')+'<span class="pw">Sugerencias de Google</span>';
    sug.classList.add('open');
  }).catch(function(){close()});
}
function close(){sug.classList.remove('open')}
function pick(i){
  var p=S.preds[i];if(!p)return;close();
  var main=p.mainText?p.mainText.text:p.text.text;
  input.value=main;field.classList.remove('bad');
  var place=p.toPlace();
  place.fetchFields({fields:['location','formattedAddress']}).then(function(){
    S.token=null;
    if(place.location)showMap({lat:place.location.lat(),lng:place.location.lng()},17);
  }).catch(function(){S.token=null});
  input.dispatchEvent(new Event('input',{bubbles:true,cancelable:true}));
}
function showMap(pos,zoom){
  S.geo=pos;box.hidden=false;
  if(!S.map){
    S.map=new google.maps.Map($('geoM'),{center:pos,zoom:zoom||17,disableDefaultUI:true,zoomControl:true,gestureHandling:'greedy',clickableIcons:false});
    S.map.addListener('idle',function(){var c=S.map.getCenter();if(c&&!box.hidden)S.geo={lat:c.lat(),lng:c.lng()}});
  }else{S.map.setCenter(pos);S.map.setZoom(zoom||17)}
}
function hideMap(){box.hidden=true}

/* ---------- Eventos ---------- */
input.addEventListener('focus',function(){load().then(function(){row.hidden=false}).catch(function(){})},{once:true});
input.addEventListener('input',function(e){if(!e.isTrusted)return;clearTimeout(S.timer);S.timer=setTimeout(suggest,280)});
input.addEventListener('keydown',function(e){
  var opts=[].slice.call(sug.querySelectorAll('button'));if(!sug.classList.contains('open')||!opts.length)return;
  var i=opts.findIndex(function(o){return o.classList.contains('on')});
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();opts.forEach(function(o){o.classList.remove('on')});i=(i+(e.key==='ArrowDown'?1:-1)+opts.length)%opts.length;opts[i].classList.add('on')}
  else if(e.key==='Enter'&&i>=0){e.preventDefault();pick(i)}else if(e.key==='Escape')close();
});
sug.addEventListener('mousedown',function(e){var b=e.target.closest('button[data-i]');if(b){e.preventDefault();pick(Number(b.getAttribute('data-i')))}});
input.addEventListener('blur',function(){setTimeout(close,150)});
$('geoOff').addEventListener('click',function(){S.geo=null;hideMap()});
$('geoHere').addEventListener('click',function(){
  var b=this;if(!navigator.geolocation){b.textContent='Tu navegador no comparte ubicación';return}
  b.textContent='Buscando tu ubicación…';
  navigator.geolocation.getCurrentPosition(function(p){
    load().then(function(){showMap({lat:p.coords.latitude,lng:p.coords.longitude},18);b.textContent='📍 Usar mi ubicación actual'});
  },function(){b.textContent='No pudimos ver tu ubicación (revisa el permiso)'},{enableHighAccuracy:true,timeout:10000,maximumAge:60000});
});
/* Sesgo hacia Medellín por defecto; si eligen otra ciudad, Google usa el nombre en la búsqueda. */
S.bias=MDE;
/* Una dirección guardada elegida a mano no trae coordenadas: se quita el pin anterior. */
var saved=$('savedAddrs');if(saved)saved.addEventListener('click',function(e){if(e.target.closest('button[data-i]')){S.geo=null;hideMap()}});
})();
