
window.addEventListener('popstate',()=>{
  try{
    const u=new URL(location.href);
    const raw=u.searchParams.get('producto');
    if(raw){
      const id=liftProductIdFromParam(raw);
      if(id && typeof openLiftProductById==='function') openLiftProductById(id);
    }else{
      const panel=document.getElementById('liftMonoPanel');
      const backdrop=document.getElementById('liftMonoBackdrop');
      panel?.classList.remove('open');
      backdrop?.classList.remove('open');
      document.body.style.overflow='';
    }
  }catch(e){}
});
