
(function(){
  let pending = null;

  function isMobile(){
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '') ||
           (navigator.maxTouchPoints || 0) > 1;
  }

  function ensureModal(){
    let modal = document.getElementById('liftNativeShareReady');
    if(modal) return modal;
    modal = document.createElement('div');
    modal.id = 'liftNativeShareReady';
    modal.innerHTML = `
      <div class="liftNativeShareReadyCard">
        <button type="button" class="liftNativeShareReadyClose" aria-label="Cerrar">×</button>
        <div class="liftNativeShareReadyIcon">↗</div>
        <div class="liftNativeShareReadyTitle">Imagen lista</div>
        <div class="liftNativeShareReadyText">Toca el botón para abrir las opciones de compartir del celular.</div>
        <button type="button" class="liftNativeShareReadyBtn">Compartir imagen</button>
        <button type="button" class="liftNativeShareDownloadBtn">Guardar imagen</button>
      </div>`;
    document.body.appendChild(modal);

    modal.querySelector('.liftNativeShareReadyClose').onclick = () => {
      modal.classList.remove('open');
      pending = null;
    };
    modal.addEventListener('click', e => {
      if(e.target === modal){
        modal.classList.remove('open');
        pending = null;
      }
    });
    modal.querySelector('.liftNativeShareReadyBtn').onclick = async () => {
      if(!pending) return;
      const data = pending;
      try{
        if(navigator.share && (!navigator.canShare || navigator.canShare({files:[data.file]}))){
          await navigator.share({files:[data.file], title:data.title || data.file.name});
          modal.classList.remove('open');
          pending = null;
          return;
        }
        throw new Error('Web Share con archivos no disponible');
      }catch(err){
        if(err && err.name === 'AbortError') return;
        console.warn('LIFT mobile share fallback:', err);
        download(data.blob, data.file.name);
      }
    };
    modal.querySelector('.liftNativeShareDownloadBtn').onclick = () => {
      if(!pending) return;
      download(pending.blob, pending.file.name);
    };
    return modal;
  }

  function download(blob, name){
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name || 'lift-imagen.png';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  function showReady(blob, file, title){
    pending = {blob, file, title};
    ensureModal().classList.add('open');
  }

  window.liftShareGeneratedImage = async function(blob, file, title){
    if(!blob || !file) throw new Error('Imagen no disponible para compartir');

    const canFiles = !!(navigator.share &&
      (!navigator.canShare || navigator.canShare({files:[file]})));

    if(canFiles){
      try{
        await navigator.share({files:[file], title:title || file.name});
        return true;
      }catch(err){
        if(err && err.name === 'AbortError') return false;

        // iOS/Safari y algunos WebViews pierden la activación del toque
        // durante los await usados para crear el canvas. La imagen ya está
        // lista: un segundo toque abre navigator.share de forma directa.
        if(isMobile() || (err && err.name === 'NotAllowedError')){
          showReady(blob, file, title);
          return false;
        }
        console.warn('LIFT share:', err);
      }
    }

    if(isMobile()){
      showReady(blob, file, title);
      return false;
    }

    download(blob, file.name);
    return false;
  };

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', ensureModal, {once:true});
  }else{
    ensureModal();
  }
})();
