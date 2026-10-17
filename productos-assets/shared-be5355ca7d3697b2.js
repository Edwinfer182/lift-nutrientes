
(function(){
  'use strict';

  const CONFIG_KEY = 'laboratories_v1';

  function normName(v){
    return String(v || '').trim();
  }

  function getConfig(){
    if(!window.LIFT_LABORATORIES_SUPABASE || typeof window.LIFT_LABORATORIES_SUPABASE !== 'object'){
      window.LIFT_LABORATORIES_SUPABASE = {};
    }
    return window.LIFT_LABORATORIES_SUPABASE;
  }

  function cloneConfig(){
    return JSON.parse(JSON.stringify(getConfig()));
  }

  function getEntry(name){
    const cfg = getConfig();
    const key = normName(name);
    if(cfg[key]) return cfg[key];

    const normalized = typeof norm === 'function' ? norm(key) : key.toLowerCase();
    const match = Object.keys(cfg).find(k => {
      const nk = typeof norm === 'function' ? norm(k) : k.toLowerCase();
      return nk === normalized;
    });
    return match ? cfg[match] : {};
  }

  function getLogo(name){
    const entry = getEntry(name);
    if(entry?.active === false) return '';
    return String(entry?.image || '').trim();
  }

  async function saveConfig(nextConfig){
    if(typeof window.liftCloudSaveConfig !== 'function'){
      throw new Error('No encontré la conexión de configuración con Supabase.');
    }

    // Primero se guarda en Supabase. Solo si responde bien se cambia el estado visual.
    await window.liftCloudSaveConfig(CONFIG_KEY, nextConfig);
    window.LIFT_LABORATORIES_SUPABASE = nextConfig;
  }

  function refreshLabs(){
    if(typeof window.renderLaboratoryVisualGrid === 'function'){
      window.renderLaboratoryVisualGrid('');
    }
    if(typeof renderFilters === 'function') renderFilters();
    requestAnimationFrame(() => {
      if(typeof window.renderLaboratoryVisualGrid === 'function'){
        window.renderLaboratoryVisualGrid('');
      }
    });
  }

  function productsFor(name){
    const target = normName(name);
    return (window.PRODUCTS || []).filter(p => normName(p.brand) === target);
  }

  async function saveProducts(products){
    if(!products.length) return;
    if(typeof window.liftCloudSaveProduct !== 'function'){
      throw new Error('No encontré la conexión de productos con Supabase.');
    }
    for(const product of products){
      await window.liftCloudSaveProduct(product);
    }
  }

  // Una sola fuente para mostrar logos: Supabase.
  window.liftLabLogo = function(name){
    return getLogo(name);
  };

  window.liftLabAdminOpen = function(name){
    if(!document.body.classList.contains('liftAdminUnlocked')) return;

    const n = normName(name);
    document.getElementById('liftLabAdminOldName').value = n;
    document.getElementById('liftLabAdminName').value = n;
    document.getElementById('liftLabAdminImage').value = getLogo(n);
    document.getElementById('liftLabAdminTitle').textContent = n ? 'Editar laboratorio' : 'Crear laboratorio';
    window.liftLabAdminPreview();
    document.getElementById('liftLabAdminModal').classList.add('open');
  };

  window.liftLabAdminClose = function(){
    document.getElementById('liftLabAdminModal').classList.remove('open');
  };

  window.liftLabAdminPreview = function(){
    const input = document.getElementById('liftLabAdminImage');
    const box = document.getElementById('liftLabAdminPreview');
    const url = input.value.trim();

    if(!url){
      box.innerHTML = '<span>Sin imagen</span>';
      return;
    }

    const img = document.createElement('img');
    img.alt = '';
    img.src = url;
    img.onerror = () => {
      box.innerHTML = '<span>La URL no pudo cargar la imagen</span>';
    };
    box.replaceChildren(img);
  };

  window.liftLabAdminSave = async function(){
    const oldName = normName(document.getElementById('liftLabAdminOldName').value);
    const newName = normName(document.getElementById('liftLabAdminName').value);
    const image = document.getElementById('liftLabAdminImage').value.trim();

    if(!newName) return alert('Escribe el nombre del laboratorio.');

    const previous = cloneConfig();
    const next = cloneConfig();
    const affected = oldName && oldName !== newName ? productsFor(oldName) : [];

    try{
      const previousEntry = next[oldName] || next[newName] || {};

      if(oldName && oldName !== newName){
        delete next[oldName];
      }

      next[newName] = {
        ...previousEntry,
        image: image,
        active: true
      };

      // Guardado único y directo de la imagen dentro de laboratories_v1.
      await saveConfig(next);

      if(affected.length){
        const oldBrands = affected.map(p => p.brand);
        try{
          affected.forEach(p => p.brand = newName);
          await saveProducts(affected);
        }catch(productError){
          affected.forEach((p, i) => p.brand = oldBrands[i]);
          await saveConfig(previous);
          throw productError;
        }
      }

      window.liftLabAdminClose();
      refreshLabs();
    }catch(e){
      window.LIFT_LABORATORIES_SUPABASE = previous;
      refreshLabs();
      alert('No pude guardar el laboratorio: ' + (e.message || e));
    }
  };

  window.liftLabAdminDuplicate = async function(name){
    if(!document.body.classList.contains('liftAdminUnlocked')) return;

    const base = normName(name);
    const previous = cloneConfig();
    const next = cloneConfig();
    const names = new Set([
      ...Object.keys(next),
      ...(window.PRODUCTS || []).map(p => normName(p.brand))
    ]);

    let candidate = base + ' Copia';
    let i = 2;
    while(names.has(candidate)) candidate = base + ' Copia ' + i++;

    try{
      next[candidate] = {...getEntry(base), active:true};
      await saveConfig(next);
      refreshLabs();
      window.liftLabAdminOpen(candidate);
    }catch(e){
      window.LIFT_LABORATORIES_SUPABASE = previous;
      alert('No pude duplicar el laboratorio: ' + (e.message || e));
    }
  };

  window.liftLabAdminDelete = async function(name){
    if(!document.body.classList.contains('liftAdminUnlocked')) return;

    const n = normName(name);
    const affected = productsFor(n);
    const count = affected.length;
    const msg = count
      ? `"${n}" tiene ${count} productos. Al eliminar el laboratorio, esos productos quedarán con la marca "Sin laboratorio". ¿Continuar?`
      : `¿Eliminar el laboratorio "${n}"?`;

    if(!confirm(msg)) return;

    const previous = cloneConfig();
    const next = cloneConfig();
    delete next[n];

    try{
      await saveConfig(next);

      if(affected.length){
        const oldBrands = affected.map(p => p.brand);
        try{
          affected.forEach(p => p.brand = 'Sin laboratorio');
          await saveProducts(affected);
        }catch(productError){
          affected.forEach((p, i) => p.brand = oldBrands[i]);
          await saveConfig(previous);
          throw productError;
        }
      }

      if(window.state?.brand === n) window.state.brand = 'Todas';
      refreshLabs();
      if(typeof render === 'function') render();
    }catch(e){
      window.LIFT_LABORATORIES_SUPABASE = previous;
      refreshLabs();
      alert('No pude eliminar el laboratorio: ' + (e.message || e));
    }
  };

  function decorate(){
    document.querySelectorAll('.labVisualGrid').forEach(grid => {
      if(!grid.previousElementSibling?.classList?.contains('labAdminNew')){
        const create = document.createElement('button');
        create.type = 'button';
        create.className = 'labAdminNew';
        create.textContent = '+ Crear laboratorio';
        create.onclick = () => window.liftLabAdminOpen('');
        grid.parentNode.insertBefore(create, grid);
      }

      grid.querySelectorAll('.labVisualCard').forEach(card => {
        if(card.querySelector('.labAdminActions')) return;

        const name = card.querySelector('.labVisualName')?.textContent?.trim();
        if(!name) return;

        const actions = document.createElement('span');
        actions.className = 'labAdminActions liftLabAdminMenuWrap';
        actions.innerHTML = `
          <button type="button" class="labAdminBtn liftAdminMenuToggle" title="Opciones del laboratorio" aria-label="Opciones del laboratorio">⋮</button>
          <span class="liftAdminDropdown" onclick="event.stopPropagation()">
            <button type="button" data-action="copy"><span aria-hidden="true">🔗</span><span class="srOnly">Copiar enlace</span></button>
            <button type="button" data-action="duplicate"><span aria-hidden="true">⧉</span><span class="srOnly">Duplicar laboratorio</span></button>
            <button type="button" data-action="edit"><span aria-hidden="true">✎</span><span class="srOnly">Editar laboratorio</span></button>
            <button type="button" class="danger" data-action="delete"><span aria-hidden="true">⌫</span><span class="srOnly">Eliminar laboratorio</span></button>
          </span>`;

        const toggle = actions.querySelector('.liftAdminMenuToggle');
        toggle.onclick = e => { e.stopPropagation(); window.liftToggleAdminMenu(toggle); };
        actions.querySelector('[data-action="copy"]').onclick = e => { e.stopPropagation(); liftCopyFilterLink('marca', name); window.liftCloseAdminMenus(); };
        actions.querySelector('[data-action="duplicate"]').onclick = e => { e.stopPropagation(); window.liftLabAdminDuplicate(name); window.liftCloseAdminMenus(); };
        actions.querySelector('[data-action="edit"]').onclick = e => { e.stopPropagation(); window.liftLabAdminOpen(name); window.liftCloseAdminMenus(); };
        actions.querySelector('[data-action="delete"]').onclick = e => { e.stopPropagation(); window.liftLabAdminDelete(name); window.liftCloseAdminMenus(); };

        card.appendChild(actions);
      });
    });
  }

  const observer = new MutationObserver(() => requestAnimationFrame(decorate));

  function boot(){
    observer.observe(document.body, {childList:true, subtree:true});
    decorate();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot);
  }else{
    boot();
  }
})();
