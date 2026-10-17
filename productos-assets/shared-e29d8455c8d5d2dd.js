
(() => {
  'use strict';

  // =========================
  // LIFT MONOLITH
  // Todo el comportamiento visual principal vive dentro de index.html.
  // Los únicos recursos externos que siguen existiendo son datos/imagenes:
  // - sabores.json
  // - imágenes de Google Drive / imágenes físicas del catálogo
  // =========================

  if (typeof PRODUCTS !== 'undefined' && Array.isArray(PRODUCTS)) {
    window.PRODUCTS = PRODUCTS;
    window.LIFT_PRODUCTS = PRODUCTS;
  }

  const norm = (s='') => String(s)
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase()
    .replace(/[^a-z0-9+.%]+/g,' ')
    .replace(/\s+/g,' ')
    .trim();

  const phrase = (text, value) => ` ${norm(text)} `.includes(` ${norm(value)} `);

  // ============================================================
  // 1. SUBCATEGORÍAS / RECLASIFICACIÓN
  // ============================================================
  const PROTEIN_GROUPS = [
    ['Proteína hidrolizada',['sascha','sasha','sascha fitness','hydrolyzed','hydrolysed','hydro whey','hydro']],
    ['Proteína vegana',['vegan','plant protein','plant-based','pea','arveja','rice protein','proteina de arroz','soya','soy','vegetal']],
    ['Proteína de carne',['beef','carnivor','carne']],
    ['Proteína de otras fuentes',['casein','caseina','micellar','egg','huevo','albumin','albumina']],
    ['Proteína aislada / limpia',['itholate','iso-xp','iso xp','iso triple zero','triple zero','iso100','iso 100','isolate','isolated','isolation','aislado','isopure','iso whey','whey iso','zero carb','low carb']],
    ['Proteína Whey',['whey','gold standard','syntha','combat','nitro tech','nitrotech']]
  ];

  const MASS = ['gainer','ganador de peso','ganadores de peso','ganador de masa','ganadores de masa','mass gainer','mega mass','mass evolution','titan beef','titan army','serious mass','true mass','super mass','pro gainer','bulk','carnivor mass'];

  function proteinCategory(p){
    const t = norm(`${p?.name||''} ${p?.brand||''} ${p?.category||''}`);
    if (MASS.some(x=>t.includes(norm(x)))) return 'Ganador de masa';
    for (const [cat, words] of PROTEIN_GROUPS) {
      if (words.some(x=>t.includes(norm(x)))) return cat;
    }
    return 'Proteína Whey';
  }

  function reclassify(){
    if (!Array.isArray(window.PRODUCTS)) return;
    for (const p of window.PRODUCTS){
      const c = norm(p.category);
      if (c.includes('protein') || c.includes('proteina')) {
        p.category = proteinCategory(p);
      }
      const t = norm(p.name);
      if (t.includes('psychotic') || t.includes('psychopath')) p.category = 'Pre entreno';
    }
  }

  // ============================================================
  // 2. IMÁGENES NUEVAS DE DRIVE
  // ============================================================
  const DRIVE = 'https://drive.google.com/thumbnail?id=';
  const IMAGE_GROUPS = [
    {items:[
      [['cell tech 3 lb','cell tech 3lbs','cell tech 3 libras'],'1Ltfp2lD4vRKKwD_R_ERmfqUm1JOljMpb'],
      [['cell tech 6 lb','cell tech 6lbs','cell tech 6 libras'],'12zfD4aDhk5nH78rMWrNo9-RFBeu1phUb'],
      [['cell tech creactor 120 serv','cell tech creactor','creactor 120','creactor'],'1WfJJSzeLMAAc-GZOqDH_HpvSe8h_abAQ'],
      [['crea stack 60 serv','crea stack','creastack'],'1vwCWMGdlcATLB3ZeYG_lgtuyxdeKBtYQ'],
      [['creatina chews 90 tabletas','creatina chews','creatine chews','chews 90'],'1U73goE-Ej9Sou1Pfqc5iSBLuER1NGqF2'],
      [['creatina dymatize 300 gr 60 serv','creatina dymatize 300 gr','creatina dymatize','creatine dymatize','dymatize 300'],'1unY0XVVrUOgxhlEOJPduO-W0yBggMNc9'],
      [['creatina iron 100 serv 500 gr','creatina iron 100 serv','creatina iron','creatine iron','iron 100 serv'],'1WgTsfF74d80FErFRBZ_qsN_pDnB08hD_'],
      [['creatina 1200 gr 240 serv micronizada','1200 gr 240 serv micronizada','creatina on 240','creatine on 240','optimum nutrition 240','creatina optimum 240'],'15Se4597oGm8jWGpKMDkYOgx45h4P68ff'],
      [['creatina platinum 450 gr 90 serv micronizada','creatina platinum 90 serv 450 gr micronizada','creatina platinum 90','creatine platinum 90','platinum 90 serv'],'1jEUIurIkIP0eNAxAxd28hWtLspMezTFn'],
      [['simply creatina 300gr 60 serv','simply creatina 300 gr 60 serv','creatina simply 300','simply 300'],'1SOvlTG1-OG2DBtersnefTbk-NHAwuww8'],
      [['simply creatina 1 kg 200 serv','creatine simply 1 kg','creatina simply 1 kg','simply 1 kg'],'1LHbMA2OJ8SO7kQWNAeecfJyNyEV8z7i-'],
      [['legacy 50 serv','legacy 50','legacy creatine','creatina legacy'],'1CtXgrkeOHQCrXNjnbOQJLAcOip_WvGTP']
    ]},
    {items:[
      [['iso xp 4lb','iso xp 4 lb'],'1jdppAiKKTQnLLJPJHSlq8kx3QQK7Qt6A'],
      [['iso xp 2lb','iso xp 2 lb'],'1j_4Kop2-VdRpCYSEAFn0pX5tKY5tr7RG'],
      [['protein crunch barra','protein crunch'],'15ZnZJzqrrqnc_Xsf2NF6UNnM5ant6z1K'],
      [['abe pump shot'],'1sKTJETT7aWuFNBaIJDzoVMxfG_f61me_'],
      [['abe all black everything 30serv','abe all black everything 30 serv','abe all black everything'],'1qHOpUobMsReVYQ1vhbJsBMTCO6rHy7Sm'],
      [['berberine 1000mg control de glucosa','berberine 1000 mg','berberine 1000mg'],'1KizWWgOrukNTtCDqYqZndhCmNBeWjnDl'],
      [['creatine 3000 30serv caps capsulas','creatine 3000 30serv caps','creatine 3000 30 serv caps'],'1HSzpa9mhUhDZWLc73DdeSDQvScji2UQt'],
      [['creatine monohydrate micronized 50serv','creatine monohydrate micronized 50 serv'],'16au9YOQBP6crGCz4xxLB2JA4-PtgYu4q'],
      [['beef xp clear 4lb','beef xp clear 4 lb'],'1saSZPU-Tj8TkseyclO_Q28QfA1jAMuWo'],
      [['gel endure naranja'],'1DgYrk0mT0h39WXRB7fN9vzXA5LoIb8Xw'],
      [['critical mass 12lb','critical mass 12 lb'],'1IpKtj-SJZ2aQgJXHbqOlmsmXbojkKHNA'],
      [['probiotic'],'1f7WroWPE5196eOwNhXmr_RCNzsM82ymr'],
      [['creatine + hydration','creatine hydration'],'1uDvwwZV5BVp-rXDdLwAHMet9brs_0PYT'],
      [['abe lata preentreno','abe lata de preentreno'],'1veJNyGCRt-oRPFXcJzU_WKxVKnQdwz4F'],
      [['critical whey 2lb','critical whey 2 lb'],'1tYhS_HCzQrtggvxdXMWgS7kOb_JskecC'],
      [['critical whey 4lb','critical whey 4 lb'],'1pG2iHSjmHcGCHrYLF5Lu8HlZcXxal84Z']
    ]},
    {items:[
      [['basic whey 5 servicios','basic whey 5 serv'],'1ElqN-lMqqMrgwhRpuMlY5sSJslQEMzd3'],
      [['basic whey 2 lbs','basic whey 2 lb'],'1ZITSnP69Aav4v5wqgmkJCnLRbk5xbEVY'],
      [['basic whey 5 lbs','basic whey 5 lb'],'1rKHLt25Ifw2oLdWhRcJI6yuQaNi0GdC2'],
      [['basic isolate 2 lbs','basic isolate 2 lb'],'1dELhRARMFAm-CxHzadUP4buuvriPD_dk'],
      [['basic isolate 5 lbs','basic isolate 5 lb'],'1uOhLzMQ3Ar72p_2HVwA1lJiVlDYKvU9h'],
      [['basic mass gainer 6 lbs','basic mass gainer 6 lb','basic mass 6 lbs'],'1Z7r_uOpEchdKkPGdPah-BoYDxuFDmf98'],
      [['basic eaa 30 ser','basic eaa 30 serv'],'1VHoyRp46prnbURLRlEyM8-r3c4zAqhpe'],
      [['basic creatina 300 gr','basic creatina 300gr'],'1PMh8XsVviqmTb2gW2Hs0pRujkzWBCxQ3'],
      [['basic glutamina 300 gr','basic glutamina 300gr'],'1tnzo1YGFMMhB9uqvc_8hNjXFo0PiIFBn'],
      [['basic pre 30 serv','basic pre 30serv'],'1fI72R-mfsfwFZZ89LX8gexI7Ej5Om__8'],
      [['basic burn 45 serv','basic burn 45serv'],'17qRVvdLuhgZPbA1OdB09VcvVWfzjRcSk'],
      [['basic hydration 20 sachet','basic hydration 20 sachets'],'1UE-4QAS4KG6_pM1xBsFHC8XjZm3oVsHo']
    ]},
    {items:[
      [['syntha 6 10 lbs','syntha 6 10 lb'],'1ICGqpvXh3HYqoyQqzQ3pUUHT9gX4xGFp'],
      [['syntha 6 5 lbs','syntha 6 5 lb'],'13AH4sX3CA-nhu3kVhUpnwkn02-X-Qa1x'],
      [['amino x 30 serv','amino x 30 servicios'],'1JT3c3GTCJb0JRwO1tc4FnQ248-QwP9kM'],
      [['amino x 70 serv','amino x 70 servicios'],'187Lk4ELQR11BiAGEbmyV-p0PuuJn9Sax'],
      [['no-xplode 30 serv','no xplode 30 serv'],'1Jjz5ps90vldNUPf8vzSUMevLMvhsczYY'],
      [['no-xplode 60 serv','no xplode 60 serv'],'1r3QRCzPmEp-9fIFrvPdXaI1EeCavKkUk'],
      [['protein crisp barra','protein crisp bar'],'1pTQboDBRwohjtvucpK8m56U5OsVDoWmG']
    ]},
    {items:[
      [['c4 original 30 serv'],'1YXOZRYzCGGE5PJHWhn-lP_z_2txNikj4'],
      [['c4 original 50 serv'],'1PSYV7N_p3tTLhm6wWybRr_6oaMRZOLjE'],
      [['c4 original energy 1 lata','c4 original energy','c4 energy 1 lata'],'1k5NPyqykx_zraCKqgS9C1F0u1BQAaxcH'],
      [['c4 energy drink pack x12 latas','c4 energy drink pack x12'],'1OWVAwa0EGcZa55PyqoLaQyNAsk6Opobq']
    ]},
    {items:[
      [['evora pw pre entreno 30 serv','evora pw 30 serv'],'1IDRqIdZV48ctD2F_vHA1a7Nl3Y1_u8Su'],
      [['creatina creapure 3g 66 serv','creatina creapure 66 serv'],'1p_mvE_LmEMG89Y_y12Xmg1o62PQr_o5Q'],
      [['vasculor pre entreno vasodilatador 300 gr','vasculor 300 gr','vasculor'],'1YuBPsFS6BlcHpLi3blC1ULowX7Hc8XT7'],
      [['evora xt 60 serv','evora xt'],'1cjtmBiFrOIHblZTO0ZQ1ETqzx4ucVlin'],
      [['whey concentrada 30g proteina 2 lb','whey concentrada 2 lb'],'18fIT6Un1ZTRxM36g6i3PgtocBBCfLxce'],
      [['dark bar x8','dark bar darkness nation'],'1E_BAjdlx63HCr8lp3yekgXOOz2h-lpU9']
    ]},
    
    {items:[
      [['iso 100 1.3 lbs','iso100 1.3 lb'],'1HkTDmvSZ51yciulklQY_me0rrj2-RYAN'],
      [['iso 100 3 lbs','iso100 3 lb'],'1K-cwmTzwoHm9W94hLxlmzvjPYngc6pAf'],
      [['iso 100 5 lbs','iso100 5 lb'],'1Dc0hXGskYfHD37xr93JsGfLuz1EXMgpB'],
      [['super mass gainer 6 lbs','super mass 6 lbs'],'1IA5MMLsIGl8CuSUbYT-kKf39lxmzAMg5'],
      [['super mass gainer 12 lbs','super mass 12 lbs'],'135QeLTYS4QyGpxf9dUPFc7PR4FD4Eudk'],
      [['elite whey 2 lbs','whey elite 2 lbs'],'1uy1E8XoiIPAc9T97Ys8cC8QFBRj1NXT_'],
      [['elite whey 5 lbs','whey elite 5 lbs'],'1SqKAg0VHMqbb5Vku0ocUNj6D878v_oyr'],
      [['creatina dymatize 300 gr 88 serv 3 gr'],'1wqXm26uMqFL4odl3EtSp0FE7nYC_iMxf'],
      [['creatina dymatize 500 gr 147 serv 3 gr'],'1EheZUWD7-eks3btcS-ldzXmlhyLwrrHx'],
      [['creatina dymatize 300 gr 60 serv'],'13-ANgE3a10jy0nZ7IJpQ1cSRNNTr1zfX'],
      [['dymatize protein shake','protein shake'],'15KDUdpx3CgUZVaIg61IvxXhzNSz3xPS3']
    ]},
    {items:[
      [['survivor pack 30 packs','survivor pack'],'1gZsrU7pDRCzm7D_kyP2zRR1onsCLPLzX'],
      [['lipocore advance 90 caps','lipocore advance'],'1G1QmS5BaZVPW0RLTljQPUxgxJDsV8quA'],
      [['organ defender'],'1TDYO73zON7KwLbzzvBUFkLeQMpBUVruP'],
      [['testabolic xtreme 120 caps','testabolic xtreme'],'1pVC2r9y19dg8W-ZxH9nq9OicJX6qgxqs']
    ]},
    {items:[
      [['creatina healthy sports 300 gr'],'12MsRLrhi30BiHmuxtFEo9PmN7e5_1AK8'],
      [['creatina healthy sports 150 gr'],'1qczaRDiGW4FIeWtBK_c-UZ_Cda1CcGLT'],
      [['vegan protein 2 lb','healthy sports vegan protein'],'1FRzZhDFbXc1lHHGdIqI3JKaXyOy90E8p'],
      [['turmeric 60 gomas','tumeric 60 gomas'],'1UDrn_ltFF-4BSno6X9NLEmEB42UYpYeu'],
      [['citrato de magnesio gomitas 30 serv','citrato de magnesio'],'1LnuXSNCv2sE8OeZSGs2cY-pOPn_MPyac'],
      [['complejo b gomitas 30 serv','complejo b'],'1oFtujnApUojGJHKaiKJJY2tnKJPLMzrj'],
      [['probiotics 60 gomitas','probiotics'],'1wolpo6OYKQagrcwIfNXYcbuiDbgjWQeb']
    ]},
    {items:[
      [['lipodrene hardcore'],'1Z37dxhu_f02ydYD2yAlV5yD6azIsImpU'],
      [['lipodrene xtreme'],'1I5wyjmNF_WL2zzj6uL10N2hCUsGlH2lO'],
      [['lipodrene'],'1xyWPMwGOBhWCdXCUF_lcZBucyRWjLW5N'],
    ]},
    {items:[
      [['creatina imn 500gr 166serv sin sabor','creatina imn 500 gr','creatina 500gr 166serv'],'1yRsiOfmE4z1pqUcCmzM9LWAKAe92HyYV'],
      [['imn bull 68serv creatina','imn bull','bull creatina'],'14wBHJeY6msnLETzog5csW1zLoQn6I5u0'],
      [['imn korageem','korageem'],'14m9rktyIcFJMKf4AJC4_47b8OMcuFGjk'],
      [['imn ultimate pre workout','ultimate pre workout imn','ultimate pre workout'],'17Zp0uqkdwp0JpIGERrbnKyiN6u4ypg1w']
    ]},
    {items:[
      [['just a whey 30 serv vainilla','just a whey 30serv sabor vainilla'],'1_LwhKGRU1SBA8PUQmnRRZwSyYP9TLc_k'],
      [['phatom toronja 30 serv','phatom sabor toronja 30serv'],'1LZRLp-AUxn_jpdtxwRvgbk_HqJS5svMA'],
      [['creatine hcl acid grape y panelada 30 serv'],'1URwTHOTWQzl15JqyoaCongakFR91no-f'],
      [['the builder'],'15cmnQjdeMLTDy7YZjLf3jYQbBRJBLXsz'],
      [['factor lemon lychee 30 serv'],'1rI8ACl8oUQ-4RrmImEhWdCwwHDZj3O_C']
    ]}
  ];

  function bestImage(product){
    const text = `${product?.name||''} ${product?.brand||''} ${product?.category||''}`;
    const brand = norm(product?.brand||'');
    let best=null, len=-1;
    IMAGE_GROUPS.forEach(group=>{
      if(group.brand && !phrase(brand,group.brand)) return;
      group.items.forEach(([aliases,id])=>{
        aliases.forEach(alias=>{
          const a=norm(alias);
          if(a && phrase(text,alias) && a.length>len){best=id;len=a.length;}
        });
      });
    });
    return best;
  }

  function updateProductImages(){
    if (!Array.isArray(window.PRODUCTS)) return;
    for (const p of window.PRODUCTS){
      const id = bestImage(p);
      if(id) p.image = DRIVE + id + '&sz=w800';
    }
  }

  // Mantiene UNA sola imagen por producto aunque aparezca en Marca,
  // Categoría, Destacados, búsqueda, carrito u otras vistas.
  // Si existe una URL de Drive para una versión del mismo producto,
  // esa URL se reutiliza en todos los duplicados del catálogo.
  function syncSharedProductImages(){
    if (!Array.isArray(window.PRODUCTS)) return;

    const genericBrands = new Set([
      'destacados lift','seleccion lift','selección lift','destacados','seleccion'
    ]);

    const keyOf = (p) => norm(p?.name || '');
    const groups = new Map();

    for (const p of window.PRODUCTS){
      const k = keyOf(p);
      if(!k) continue;
      if(!groups.has(k)) groups.set(k, []);
      groups.get(k).push(p);
    }

    for (const list of groups.values()){
      if(list.length < 2) continue;

      // Prioridad: URL Drive de la marca real > cualquier URL Drive > imagen existente.
      let canonical =
        list.find(p => String(p.image||'').includes('drive.google.com') &&
                       !genericBrands.has(norm(p.brand||''))) ||
        list.find(p => String(p.image||'').includes('drive.google.com')) ||
        list.find(p => p.image);

      if(!canonical || !canonical.image) continue;

      for (const p of list){
        p.image = canonical.image;
      }
    }
  }


  // Correcciones puntuales que deben prevalecer sobre la sincronización por nombre.
  function forceProductImageOverrides(){
    if (!Array.isArray(window.PRODUCTS)) return;
    const p = window.PRODUCTS.find(x => Number(x?.id) === 420);
    if (p){
      p.image = 'https://drive.google.com/thumbnail?id=1SkY-E2RfkPfN73zqyUUuawiDkIMBiF3R&sz=w1200';
    }
  }

  // ============================================================
  // 3. ESTILO DE IMÁGENES DE TARJETAS
  // ============================================================
  function installCardStyles(){
    if(document.getElementById('liftMonolithStyles')) return;
    const style=document.createElement('style');
    style.id='liftMonolithStyles';
    style.textContent=`
      .pic{height:210px!important;padding:10px!important;overflow:hidden!important;display:flex!important;align-items:center!important;justify-content:center!important;box-sizing:border-box!important}
      .pic img{display:block!important;width:auto!important;height:auto!important;max-width:100%!important;max-height:100%!important;object-fit:contain!important;object-position:center!important}
      .card{transition:transform .24s ease,box-shadow .24s ease,border-color .24s ease;cursor:pointer;will-change:transform}
      .card .pic img{transition:transform .28s ease}
      .inspectBtn{position:absolute;left:10px;top:10px;z-index:4;width:38px;height:38px;border:1px solid rgba(0,0,0,.12);border-radius:50%;background:rgba(255,255,255,.96);color:#111;display:grid;place-items:center;cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,.08);transition:transform .18s ease,background .18s ease,color .18s ease,opacity .18s ease}
      .inspectBtn svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
      .inspectBtn:hover{background:#111;color:#fff;transform:scale(1.06)}
      .liftMonoImg{cursor:zoom-in;touch-action:none}
      .liftMonoImg.zoomed{cursor:grab}
      .liftMonoImg.dragging{cursor:grabbing}
      .liftMonoImg img{transition:transform .22s ease;transform-origin:center center;user-select:none;-webkit-user-drag:none;will-change:transform}
      .liftZoomTools{display:none!important;position:absolute;right:12px;bottom:12px;z-index:5;display:flex;gap:7px;padding:6px;border-radius:999px;background:rgba(17,17,17,.78);backdrop-filter:blur(6px);box-shadow:0 5px 18px rgba(0,0,0,.16)}
      .liftZoomTools button{width:34px;height:34px;border:0;border-radius:50%;background:#fff;color:#111;font-size:20px;line-height:1;display:grid;place-items:center;cursor:pointer;font-weight:700}
      .liftZoomTools button:hover{background:#f0f0f0}
      .liftZoomHint{display:none!important;position:absolute;left:12px;bottom:12px;z-index:4;background:rgba(17,17,17,.72);color:#fff;border-radius:999px;padding:6px 10px;font-size:10px;font-weight:600;pointer-events:none}
      @media (hover:hover) and (pointer:fine){
        .card:hover{transform:translateY(-6px) scale(1.018);box-shadow:0 16px 34px rgba(0,0,0,.14);border-color:#d8d8d8}
        .card:hover .pic img{transform:scale(1.06)}
      }
      #liftMonoBackdrop{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9998;opacity:0;visibility:hidden;transition:opacity .24s ease,visibility .24s ease;backdrop-filter:blur(3px)}
      #liftMonoBackdrop.open{opacity:1;visibility:visible}
      #liftMonoOff{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%) scale(.86);width:min(1040px,94vw);max-width:calc(100vw - 20px);max-height:92dvh;background:#fff;border-radius:20px;z-index:9999;opacity:0;visibility:hidden;transition:transform .28s cubic-bezier(.2,.8,.2,1),opacity .22s ease,visibility .22s ease;overflow-y:auto;overflow-x:hidden;box-shadow:0 30px 80px rgba(0,0,0,.28);box-sizing:border-box;overscroll-behavior:contain}
      #liftMonoOff.open{transform:translate(-50%,-50%) scale(1);opacity:1;visibility:visible}

.liftMonoBody{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:44px;align-items:center;padding:38px;position:relative}
      .liftMonoImg{height:500px;min-width:0;display:flex;align-items:center;justify-content:center;padding:18px;position:relative;overflow:hidden}
      .liftMonoImg img{display:block;width:100%;height:100%;max-width:100%;max-height:100%;object-fit:contain;object-position:center}
      .liftMonoNav{position:absolute;top:50%;transform:translateY(-50%);z-index:4;width:46px;height:46px;border:1px solid rgba(0,0,0,.12);border-radius:50%;background:rgba(255,255,255,.94);box-shadow:0 5px 18px rgba(0,0,0,.12);display:grid;place-items:center;font-size:28px;line-height:1;color:#111;cursor:pointer;transition:transform .15s ease,background .15s ease}
      .liftMonoNav:hover{background:#111;color:#fff;transform:translateY(-50%) scale(1.06)}
      .liftMonoPrev{left:12px}.liftMonoNext{right:12px}
      .liftMonoCounter{position:absolute;left:50%;bottom:10px;transform:translateX(-50%);z-index:3;background:rgba(17,17,17,.78);color:#fff;border-radius:999px;padding:5px 10px;font-size:11px;font-weight:500;white-space:nowrap}
      .liftMonoBrand{font-size:12px;text-transform:uppercase;letter-spacing:.12em;color:#777;font-weight:700;margin-bottom:8px}
      .liftMonoTitle{font-size:clamp(28px,3vw,40px);line-height:1.05;margin:0 0 10px}
      .liftMonoPrice{font-size:28px;font-weight:800;margin:14px 0 22px}
      .liftMonoBtns{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      .liftMonoBtns button{min-height:52px;border-radius:28px;border:1px solid #111;font-weight:700;cursor:pointer}
      .liftMonoBuy{background:#111;color:#fff}
      .liftMonoMeta{border-top:1px solid #eee;margin-top:22px;padding-top:16px;color:#666;font-size:13px;line-height:1.55}
      @media(max-width:760px){
        .pic{height:165px!important;padding:8px!important}
        .inspectBtn{left:8px;top:8px;width:36px;height:36px}
        .inspectBtn svg{width:18px;height:18px}
        .liftZoomTools{right:8px;bottom:8px;gap:5px;padding:5px}
        .liftZoomTools button{width:32px;height:32px;font-size:18px}
        .liftZoomHint{left:8px;bottom:8px;font-size:9px;padding:5px 8px}
        #liftMonoOff{width:calc(100vw - 20px);max-width:calc(100vw - 20px);max-height:88dvh;border-radius:16px}
        #liftMonoBody,.liftMonoBody,.liftMonoBody>*{min-width:0;max-width:100%;box-sizing:border-box}
        .liftMonoBody{grid-template-columns:minmax(0,1fr);gap:8px;padding:22px 16px 18px;overflow:hidden}
        .liftMonoImg{width:100%;max-width:100%;height:min(42vh,290px);min-height:220px;padding:10px 44px;overflow:hidden;contain:layout paint}
        .liftMonoImg img{display:block!important;width:100%!important;height:100%!important;max-width:100%!important;max-height:100%!important;object-fit:contain!important;object-position:center!important}
        .liftMonoNav{width:38px;height:38px;font-size:23px;background:rgba(255,255,255,.96);top:145px;transform:translateY(-50%)}
        .liftMonoNav:hover{transform:translateY(-50%)}
        .liftMonoPrev{left:6px}.liftMonoNext{right:6px}
        .liftMonoCounter{bottom:4px;font-size:10px;padding:4px 8px}
        .liftMonoTitle{font-size:22px;line-height:1.15;overflow-wrap:anywhere;word-break:normal;padding-right:34px}
        .liftMonoBrand,.liftMonoPrice,.liftMonoMeta{max-width:100%;overflow-wrap:anywhere}
        .liftMonoPrice{font-size:24px;margin:10px 0 16px}
        .liftMonoBtns{grid-template-columns:minmax(0,1fr);width:100%}
        .liftMonoBtns button{width:100%;max-width:100%;min-width:0}

}
    `;
    document.head.appendChild(style);
  }

  // ============================================================
  // 4. OFFCANVAS CENTRAL / DETALLE DE PRODUCTO
  // ============================================================
  let panel, backdrop, panelBody;
  let currentProductId=null;
  function navProducts(){
    try{
      const arr=typeof filtered==='function'?filtered():window.PRODUCTS;
      return Array.isArray(arr)&&arr.length?arr:window.PRODUCTS;
    }catch(e){ return Array.isArray(window.PRODUCTS)?window.PRODUCTS:[]; }
  }
  function ensureOffcanvas(){
    if(panel) return;
    backdrop=document.createElement('div');
    backdrop.id='liftMonoBackdrop';
    panel=document.createElement('aside');
    panel.id='liftMonoOff';
    panel.innerHTML='<button id="liftMonoClose" type="button" aria-label="Cerrar">×</button><div id="liftMonoBody"></div>';
    document.body.append(backdrop,panel);
    panelBody=panel.querySelector('#liftMonoBody');
    panel.querySelector('#liftMonoClose').onclick=closeProduct;
    backdrop.onclick=closeProduct;
    document.addEventListener('keydown',e=>{
      if(!panel?.classList.contains('open')) return;
      if(e.key==='Escape') closeProduct();
    });
  }

  function productFromCard(card){
    if(!Array.isArray(window.PRODUCTS)) return null;
    const html=card.innerHTML||'';
    const m=html.match(/(?:buyProduct|add)\s*\(\s*['"]?(\d+)/);
    if(m){
      const p=window.PRODUCTS.find(x=>String(x.id)===String(m[1]));
      if(p) return p;
    }
    const name=norm(card.querySelector('.name')?.textContent||'');
    return window.PRODUCTS.find(x=>norm(x.name)===name)||null;
  }

  
  const ISO100_FLAVOR_IMAGES={"16":[{"name":"Fruity Pebbles","image":"https://drive.google.com/thumbnail?id=1DkwIrBnXXlgyrD0WKeydyxDFk2RANsvk&sz=w1200"},{"name":"Gourmet Vanilla","image":"https://drive.google.com/thumbnail?id=1D1z0ccTplDjZK43VDtf06zm7ChR2eikp&sz=w1200"},{"name":"Gourmet Chocolate","image":"https://drive.google.com/thumbnail?id=10KSVrbCu8ujPLDsfwvOJjH3QpcOPZMM5&sz=w1200"},{"name":"Cookies & Cream","image":"https://drive.google.com/thumbnail?id=1taoNqqPzQxOBg_4uGkUVoX25j55mm2dw&sz=w1200"},{"name":"Chocolate Peanut Butter","image":"https://drive.google.com/thumbnail?id=1Y7n3nKv_81d746TeEvQmzdoWykmVYFYd&sz=w1200"},{"name":"Strawberry","image":"https://drive.google.com/thumbnail?id=1B6KMqnDo6JvVOXSjvxitwsrJOaGAU7w6&sz=w1200"},{"name":"Cinnamon Churro","image":"https://drive.google.com/thumbnail?id=1Zz22v4pLFD1xkJDk261yX79HSCGqEE-6&sz=w1200"},{"name":"Cocoa Pebbles","image":"https://drive.google.com/thumbnail?id=1TkyClYZWIGUvP9jY7zQdpxGqkim_-4RP&sz=w1200"},{"name":"Fudge Brownie","image":"https://drive.google.com/thumbnail?id=1S0F0sNLIYus62NtBXsMkdq1_QK2eWB7h&sz=w1200"},{"name":"Birthday Cake Pebbles","image":"https://drive.google.com/thumbnail?id=1x8y-Kt8GZT_HgLOY0mh_eLEHGXhMP3KU&sz=w1200"}],"126":[{"name":"Fruity Pebbles","image":"https://drive.google.com/thumbnail?id=1DkwIrBnXXlgyrD0WKeydyxDFk2RANsvk&sz=w1200"},{"name":"Gourmet Vanilla","image":"https://drive.google.com/thumbnail?id=1D1z0ccTplDjZK43VDtf06zm7ChR2eikp&sz=w1200"},{"name":"Gourmet Chocolate","image":"https://drive.google.com/thumbnail?id=10KSVrbCu8ujPLDsfwvOJjH3QpcOPZMM5&sz=w1200"},{"name":"Cookies & Cream","image":"https://drive.google.com/thumbnail?id=1taoNqqPzQxOBg_4uGkUVoX25j55mm2dw&sz=w1200"},{"name":"Chocolate Peanut Butter","image":"https://drive.google.com/thumbnail?id=1Y7n3nKv_81d746TeEvQmzdoWykmVYFYd&sz=w1200"},{"name":"Strawberry","image":"https://drive.google.com/thumbnail?id=1B6KMqnDo6JvVOXSjvxitwsrJOaGAU7w6&sz=w1200"},{"name":"Cinnamon Churro","image":"https://drive.google.com/thumbnail?id=1Zz22v4pLFD1xkJDk261yX79HSCGqEE-6&sz=w1200"},{"name":"Cocoa Pebbles","image":"https://drive.google.com/thumbnail?id=1TkyClYZWIGUvP9jY7zQdpxGqkim_-4RP&sz=w1200"},{"name":"Fudge Brownie","image":"https://drive.google.com/thumbnail?id=1S0F0sNLIYus62NtBXsMkdq1_QK2eWB7h&sz=w1200"},{"name":"Birthday Cake Pebbles","image":"https://drive.google.com/thumbnail?id=1x8y-Kt8GZT_HgLOY0mh_eLEHGXhMP3KU&sz=w1200"}],"125":[{"name":"Gourmet Vanilla","image":"https://drive.google.com/thumbnail?id=1EEuPSEd-H9dKYPGjtEirq6o1RGtKfj0R&sz=w1200"},{"name":"Gourmet Chocolate","image":"https://drive.google.com/thumbnail?id=1ttVv1yrhGuT4wv5-rN1PT2zXsTOswhXb&sz=w1200"},{"name":"Cocoa Pebbles","image":"https://drive.google.com/thumbnail?id=1hKKhbyCv1YGDq-lM3PZECZRCSVTnqbjU&sz=w1200"},{"name":"Fudge Brownie","image":"https://drive.google.com/thumbnail?id=15fM53-2CrL3oYa-kJO9QXvAjbG5d7LgU&sz=w1200"},{"name":"Fruity Pebbles","image":"https://drive.google.com/thumbnail?id=19-PlcG4HnvTWMO4zy-QJ2toseTW9_92j&sz=w1200"}],"123":[{"name":"Fruity Pebbles","image":"https://drive.google.com/thumbnail?id=1cDcAN8Xuuw3t3RmxuI093HXpQ-jOmaoV&sz=w1200"},{"name":"Gourmet Vanilla","image":"https://drive.google.com/thumbnail?id=1GLLsuPheltDH2UHtewRCnZO6YE2IJw6j&sz=w1200"},{"name":"Gourmet Chocolate","image":"https://drive.google.com/thumbnail?id=1CQ1R7qLc5nD_pN0wc_RzJTP0RepK2fgl&sz=w1200"},{"name":"Cookies & Cream","image":"https://drive.google.com/thumbnail?id=10OC5NaO_hSRTf05AKtnrfX5E1PPxZphv&sz=w1200"},{"name":"Fudge Brownie","image":"https://drive.google.com/thumbnail?id=1Jg71W1MXlamD5SG9KYFLl1v6lGR2MWYS&sz=w1200"},{"name":"Strawberry","image":"https://drive.google.com/thumbnail?id=1S-SXI9G5qYAyYe4wPbn-sXih33FH_WW8&sz=w1200"},{"name":"Chocolate Peanut Butter","image":"https://drive.google.com/thumbnail?id=1wekI5w1a4fI6r1C5cj6h1yE9XSl3ana1&sz=w1200"},{"name":"Cocoa Pebbles","image":"https://drive.google.com/thumbnail?id=1WYbtVxmXBIazasGkEj83IB67fJ8NIGct&sz=w1200"},{"name":"Birthday Cake Pebbles","image":"https://drive.google.com/thumbnail?id=17f8tay_6IO1x0Xh3AI2dDGVI-UkGwTXk&sz=w1200"},{"name":"Caramelo Salado","image":"https://drive.google.com/thumbnail?id=1uUujyhYdTSFjo9dtvVMrFIF63bZpQFs2&sz=w1200"},{"name":"Dunkin Cappuccino","image":"https://drive.google.com/thumbnail?id=1t2G_hv_moFMmywgvoDZS10WHoc3oZf_1&sz=w1200"},{"name":"Dunkin Mocha Latte","image":"https://drive.google.com/thumbnail?id=1FPRfovO2guXBs2LwGj8Id89YemkxQEpy&sz=w1200"},{"name":"Dunkin Glazed","image":"https://drive.google.com/thumbnail?id=1xQY2ZZp34ZY4lWehnyihXRo-oU5RG8jQ&sz=w1200"}]};
  const ISO100_SELECTED={};

  function iso100FlavorsFor(p){
    return ISO100_FLAVOR_IMAGES[String(p?.id)]||[];
  }

  function pdfFlavorsFor(p){
    return Array.isArray(p?.pdfFlavors) ? p.pdfFlavors.filter(Boolean) : [];
  }

  function pdfFlavorStrip(p){
    // ISO100 conserva su selector con imágenes. Los sabores del PDF usan solo pills.
    if(iso100FlavorsFor(p).length) return '';
    const fs=pdfFlavorsFor(p);
    if(!fs.length) return '';
    const first=ISO100_SELECTED[String(p.id)]?.name || fs[0];
    return `<div class="pdfFlavorBlock">
      <div class="pdfFlavorHead"><b>Selecciona sabor</b><span class="pdfFlavorSelected">${esc(first)}</span></div>
      <div class="pdfFlavorStrip">
        ${fs.map((f,i)=>`<button type="button" class="pdfFlavorChip${i===0?' active':''}" data-pdf-flavor="${esc(f)}">${esc(f)}</button>`).join('')}
      </div>
    </div>`;
  }

  function bindPdfFlavors(p){
    if(iso100FlavorsFor(p).length) return;
    const fs=pdfFlavorsFor(p);
    if(!fs.length) return;
    if(!ISO100_SELECTED[String(p.id)]) ISO100_SELECTED[String(p.id)]={name:fs[0],image:''};
    const label=panel.querySelector('.pdfFlavorSelected');
    panel.querySelectorAll('.pdfFlavorChip').forEach(btn=>btn.onclick=e=>{
      e.stopPropagation();
      const name=btn.dataset.pdfFlavor||'';
      ISO100_SELECTED[String(p.id)]={name,image:''};
      if(label) label.textContent=name;
      panel.querySelectorAll('.pdfFlavorChip').forEach(x=>x.classList.remove('active'));
      btn.classList.add('active');
    });
  }

  function iso100FlavorStrip(p){
    const fs=iso100FlavorsFor(p);
    if(!fs.length) return '';
    return `<div class="isoFlavorBlock">
      <div class="isoFlavorHead"><b>Selecciona sabor</b><span id="isoFlavorSelected">${fs[0].name}</span></div>
      <div class="isoFlavorStrip">
        ${fs.map((f,i)=>`<button type="button" class="isoFlavorChip${i===0?' active':''}" data-iso-index="${i}" title="${f.name.replace(/"/g,'&quot;')}">
          <img src="${f.image.replace('sz=w1200','sz=w180')}" loading="lazy" decoding="async" fetchpriority="low" alt="${f.name.replace(/"/g,'&quot;')}">
          <span>${f.name}</span>
        </button>`).join('')}
      </div>
    </div>`;
  }

  function bindIso100Flavors(p){
    const fs=iso100FlavorsFor(p);
    if(!fs.length) return;
    if(!ISO100_SELECTED[String(p.id)]) ISO100_SELECTED[String(p.id)]=fs[0];
    const main=panel.querySelector('.liftMonoImg img');
    const label=panel.querySelector('#isoFlavorSelected');
    panel.querySelectorAll('.isoFlavorChip').forEach(btn=>btn.onclick=e=>{
      e.stopPropagation();
      const f=fs[Number(btn.dataset.isoIndex)||0];
      ISO100_SELECTED[String(p.id)]=f;
      if(main){main.src=f.image;main.alt=`${p.name} - ${f.name}`;}
      if(label)label.textContent=f.name;
      panel.querySelectorAll('.isoFlavorChip').forEach(x=>x.classList.remove('active'));
      btn.classList.add('active');
    });
  }

function relatedProductDetailHTML(p){
    if(!p || !Array.isArray(window.PRODUCTS)) return '';
    const pool=window.PRODUCTS.filter(x=>x.id!==p.id && (norm(x.category||'')===norm(p.category||'') || norm(x.brand||'')===norm(p.brand||'')));
    const rel=pool.sort((a,b)=>((norm(b.category||'')===norm(p.category||''))?2:0)-((norm(a.category||'')===norm(p.category||''))?2:0)).slice(0,4);
    if(!rel.length) return '';
    return `<div class="liftRelated"><div class="liftRelatedTitle">También te puede interesar</div><div class="liftRelatedGrid">${rel.map(x=>`<button type="button" class="liftRelatedItem" onclick="openLiftProductById(${x.id})"><img loading="lazy" decoding="async" src="${x.image}" alt="${esc(x.name)}"><span>${esc(x.name)}</span><b>${fmt(priceOf(x))}</b></button>`).join('')}</div></div>`;
  }


  const LIFT_PRODUCT_PAGES = {
    16: '/productos/iso100-dymatize-5-lbs.html'
  };
  
function liftProductSlug(text){ return window.liftProductSlug(text); }
function liftPublicProductUrl(p){ return window.liftPublicProductUrl(p); }
function liftProductPageUrl(p){
  return liftPublicProductUrl(p);
}
// Usa las URLs HTML ya publicadas; nunca reemplaza la pagina individual por ?producto=.
function liftExistingIndividualUrl(p){
  if(!p || p.__private)return '';
  return typeof window.liftStaticProductUrl==='function' ? window.liftStaticProductUrl(p) : '';
}
function liftProductIdFromParam(value){
  const m=String(value||'').match(/^(\d+)/);
  return m ? m[1] : '';
}
function liftSetProductUrl(p, mode='push'){
  const rel=liftPublicProductUrl(p);
  if(!rel) return;
  const current=location.pathname+location.search;
  if(current===rel) return;
  history[mode==='replace'?'replaceState':'pushState']({liftProduct:String(p.id)},'',rel);
}
function liftClearProductUrl(){
  const u=new URL(location.href);
  if(!u.searchParams.has('producto')) return;
  u.searchParams.delete('producto');
  const clean=u.pathname+(u.searchParams.toString()?('?'+u.searchParams.toString()):'')+u.hash;
  history.replaceState({},'',clean);
}
function liftEnsureMeta(selector, attr, value){
  let el=document.querySelector(selector);
  if(!el){
    el=document.createElement('meta');
    const [k,v]=attr.split('=');
    el.setAttribute(k,v);
    document.head.appendChild(el);
  }
  el.setAttribute('content',value);
}
function liftUpdateProductSeo(p){
  if(!p || p.__private) return;
  const title=`${p.name}${p.brand?' | '+p.brand:''} | Lift Nutrientes`;
  const desc=[p.name,p.brand,p.presentation].filter(Boolean).join(' · ')+' disponible en Lift Nutrientes.';
  const abs=new URL(liftPublicProductUrl(p),location.origin).href;
  document.title=title;
  liftEnsureMeta('meta[name="description"]','name=description',desc);
  liftEnsureMeta('meta[property="og:title"]','property=og:title',title);
  liftEnsureMeta('meta[property="og:description"]','property=og:description',desc);
  liftEnsureMeta('meta[property="og:url"]','property=og:url',abs);
  let canonical=document.querySelector('link[rel="canonical"]');
  if(!canonical){canonical=document.createElement('link');canonical.rel='canonical';document.head.appendChild(canonical);}
  canonical.href=abs;
  let schema=document.getElementById('liftProductSchema');
  if(!schema){schema=document.createElement('script');schema.type='application/ld+json';schema.id='liftProductSchema';document.head.appendChild(schema);}
  schema.textContent=JSON.stringify({
    '@context':'https://schema.org',
    '@type':'Product',
    name:p.name,
    image:p.image?[p.image]:undefined,
    brand:p.brand?{'@type':'Brand',name:p.brand}:undefined,
    url:abs,
    offers:{
      '@type':'Offer',
      priceCurrency:'COP',
      price:String(Number(p.price||0)),
      availability:'https://schema.org/InStock',
      url:abs
    }
  });
}


  function openLiftProduct(pOrId){
  const p=typeof pOrId==='object' ? pOrId : (window.PRODUCTS||[]).find(x=>String(x.id)===String(pOrId));
  if(!p) return;
  goLiftStaticProduct(p.id);
}

function renderProductDetail(p){
    if(!p) return;
    currentProductId=p.id;
    window.currentProductId=p.id;
    
    const list=navProducts();
    const idx=Math.max(0,list.findIndex(x=>String(x.id)===String(p.id)));
    const price = typeof priceOf==='function' ? priceOf(p) : p.price;
    const money = typeof fmt==='function' ? fmt(price) : '$'+Number(price||0).toLocaleString('es-CO');
    panelBody.innerHTML=`
      <div class="liftMonoBody">
        <div class="liftMonoVisual">
          <div class="liftMonoImg" id="liftMonoZoomArea" title="Haz clic o doble clic para ampliar">
            <img id="liftMonoMainImg" draggable="false" src="${String(p.image||'').replace(/"/g,'&quot;')}" alt="${String(p.name||'').replace(/"/g,'&quot;')}">
            
          </div>
          <div class="detailShareBelowImage"><button class="cardShareImageBtn detailShareImageBtn" type="button" title="Compartir imagen del producto" aria-label="Compartir imagen del producto" onclick="event.stopPropagation();shareLiftProductImage(${Number(p.id)})"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="2.5"></circle><circle cx="6" cy="12" r="2.5"></circle><circle cx="18" cy="19" r="2.5"></circle><path d="M8.2 10.8 15.8 6.3M8.2 13.2l7.6 4.5"></path></svg></button><button type="button" class="liftProviderShareBtn liftProviderDetailBtn" title="Consultar proveedor" aria-label="Consultar proveedor" onclick="event.preventDefault();event.stopPropagation();window.liftOpenProviderShare(Number(window.currentProductId))"><svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v12H7l-3 3V5z"/><path d="M8 10h8"/><path d="M8 13h5"/></svg></button></div>
          <div class="liftMonoRelatedWide liftRelatedUnderImage">${relatedProductDetailHTML(p)}</div>
        </div>
        <div class="liftMonoInfo">
          <div class="liftMonoBrandCategory"><button type="button" class="liftMonoBrand liftDetailFilter" data-filter="brand">${p.brand||''}</button><span class="liftDetailSeparator">·</span><button type="button" class="liftMonoCategory liftDetailFilter" data-filter="category">${p.category||''}</button></div>
          <h2 class="liftMonoTitle">${p.name||''}</h2>
          <div class="liftMonoPriceArea">${typeof priceHTML==='function' ? priceHTML(p) : `<div class="liftMonoPrice">${money}</div>`}</div>
          <div class="liftMonoBtns liftMonoAddRow">
            <div class="liftMonoQuantity" aria-label="Cantidad del producto"><div class="liftMonoQtyControls"><button type="button" id="liftMonoQtyMinus" aria-label="Disminuir cantidad">−</button><output id="liftMonoQtyValue" aria-live="polite">1</output><button type="button" id="liftMonoQtyPlus" aria-label="Aumentar cantidad">+</button></div></div>
            <button type="button" id="liftMonoAdd"><span class="liftActionIcon">＋</span><span>Agregar</span></button>
          </div>
          <div class="liftMonoPaymentMethods" aria-label="Medios de pago aceptados">
            <div class="liftMonoPaymentLogos">
              <img loading="lazy" src="https://static.wixstatic.com/media/251da0_059f710a3ef941aa902cb0b5b15a758f~mv2.png" alt="Medio de pago" />
              <img loading="lazy" src="https://static.wixstatic.com/media/251da0_e8038c896294432097472dcdedb54889~mv2.png" alt="Medio de pago" />
              <img loading="lazy" src="https://static.wixstatic.com/media/251da0_3e18c7ef59f44fd7b2d5870cee2b7206~mv2.png" alt="Medio de pago" />
            </div>
          </div>
        <div class="liftMonoService liftMonoServiceWide liftDeliveryAccordion">
          <details>
            <summary><span class="liftServiceIcon">✓</span><span><b>Disponibilidad y tarifas</b><small>Consulta existencias y valor del envío</small></span><span class="liftServiceChevron">⌄</span></summary>
            <div class="liftDeliveryContent">Confirmamos las existencias antes de programar el pedido. <strong>El valor del domicilio depende de la ciudad, dirección y cantidad de productos.</strong> El costo exacto se informa antes de confirmar la compra. No se cobra ningún envío adicional sin avisarte.</div>
          </details>
          <details>
            <summary><span class="liftServiceIcon">⌁</span><span><b>Entregas en Medellín</b><small>Mismo día según horario y disponibilidad</small></span><span class="liftServiceChevron">⌄</span></summary>
            <div class="liftDeliveryContent">Pedidos confirmados antes de las <strong>2:00 p. m.</strong> pueden salir en la ruta del mismo día, sujeto a disponibilidad y cobertura. Los pedidos posteriores se programan para la siguiente ruta disponible. <strong>No manejamos hora exacta de entrega</strong>, porque el mensajero realiza varias entregas. El valor del domicilio se confirma según la dirección.</div>
          </details>
          <details>
            <summary><span class="liftServiceIcon">→</span><span><b>Envíos nacionales</b><small>1 a 3 días hábiles después de la guía</small></span><span class="liftServiceChevron">⌄</span></summary>
            <div class="liftDeliveryContent">Ciudades principales: aproximadamente <strong>1 día hábil</strong> después de generar la guía. Otros destinos: <strong>2 a 3 días hábiles</strong>, según la transportadora y la cobertura. El costo se cotiza según destino y pedido. Para envíos nacionales se confirma el pago antes del despacho. Los tiempos son estimados.</div>
          </details>
          <details>
            <summary><span class="liftServiceIcon">↺</span><span><b>Cambios, averías y devoluciones</b><small>Cómo reportar un problema con tu pedido</small></span><span class="liftServiceChevron">⌄</span></summary>
            <div class="liftDeliveryContent">Si tu producto llega golpeado, abierto, derramado, con el sello alterado o diferente al solicitado, <strong>repórtalo preferiblemente dentro de los 2 días hábiles siguientes a la entrega</strong>. Escríbenos por WhatsApp con el número de pedido y fotografías del producto y del empaque. Revisaremos el caso para gestionar el cambio, reposición o devolución que corresponda. <strong>Este plazo de reporte no limita las garantías ni los derechos legales del consumidor.</strong> Conserva el producto y su empaque mientras revisamos la novedad.</div>
          </details>
        </div>
          <div id="liftMonoActionStatus" class="liftMonoActionStatus" aria-live="polite"></div>
          ${liftExistingIndividualUrl(p)?`<a class="liftMonoPageLink" href="${liftExistingIndividualUrl(p)}" title="Abrir la ficha individual del producto">↗ Ver página individual del producto</a>`:''}
          ${p.description?`<details class="liftMonoDescription" open><summary>Descripción</summary><div>${esc(p.description)}</div></details>`:''}
        </div>
        <div class="liftMonoVariantsBelow">
          ${iso100FlavorStrip(p)}
          ${pdfFlavorStrip(p)}
        </div>

      </div>`;
    liftPlaceServiceNotices();
    liftSecondaryRender(p);
    bindIso100Flavors(p);
    bindPdfFlavors(p);
    liftInjectGroupVariantPicker(p.id);
    bindProductZoom();
    let liftDetailQty=1;
    const qtyOutput=panel.querySelector('#liftMonoQtyValue');
    const setDetailQty=(n)=>{liftDetailQty=Math.max(1,Math.min(99,Math.floor(Number(n)||1)));if(qtyOutput)qtyOutput.textContent=String(liftDetailQty);};
    panel.querySelector('#liftMonoQtyMinus').onclick=()=>setDetailQty(liftDetailQty-1);
    panel.querySelector('#liftMonoQtyPlus').onclick=()=>setDetailQty(liftDetailQty+1);
    panel.querySelector('#liftMonoAdd').onclick=(event)=>{
      event.preventDefault();
      event.stopPropagation();
      const btn=panel.querySelector('#liftMonoAdd');
      const status=panel.querySelector('#liftMonoActionStatus');
      // Leer el número visible, no una variable que otro render puede reiniciar.
      const quantity=Math.max(1,Math.min(99,parseInt(panel.querySelector('#liftMonoQtyValue')?.textContent,10)||1));
      const f=ISO100_SELECTED[String(p.id)];
      const grouped=liftGroupByProductId(p.id);
      let cartKey=String(p.id);
      let targetProduct=p;
      let variantMeta=null;
      let flavor='';
      let variantImage=p.image;
      if(grouped){
        const variants=liftGroupVariants(grouped);
        const selected=variants.find(v=>String(v.id)===String(window.LIFT_SELECTED_GROUP_VARIANT[String(grouped.id)]))||variants[0];
        if(selected){
          targetProduct=liftVariantProduct(selected)||p;
          flavor=String(selected.sabor||'Variación');
          variantImage=String(selected.imagen||targetProduct.image||grouped.imagen||'');
          variantMeta={groupId:Number(grouped.id),variantId:Number(selected.id),variantPrice:liftVariantSalePrice(grouped,selected,targetProduct),variantNormalPrice:liftVariantNormalPrice(grouped,selected,targetProduct),variantOffer:false};
        }
      }else if(f){
        flavor=String(f.name||'');
        variantImage=f.image||p.image;
      }
      cartKey=flavor?`${targetProduct.id}::${flavor}`:String(targetProduct.id);
      // Una sola escritura al carrito con la cantidad seleccionada.
      // Evita los manejadores antiguos que agregaban una unidad por defecto.
      if(flavor){
        const legacyKey=String(targetProduct.id);
        if(cart[legacyKey]){delete cart[legacyKey];delete cartMeta[legacyKey];}
        cartMeta[cartKey]={flavor,image:variantImage,...(variantMeta||{})};
        window.LIFT_CART_META=cartMeta;
      }
      cart[cartKey]=(Number(cart[cartKey])||0)+quantity;
      saveCart();
      renderCart();
      btn.disabled=true;
      btn.classList.add('success');
      btn.innerHTML='<span class="liftActionIcon">✓</span><span>Agregado</span>';
      if(status)status.textContent=`✓ ${quantity} unidad${quantity===1?'':'es'} agregada${quantity===1?'':'s'}.`;
      openOff('cart');
      setTimeout(()=>{
        if(!btn?.isConnected)return;
        btn.disabled=false;
        btn.classList.remove('success');
        btn.innerHTML='<span class="liftActionIcon">＋</span><span>Agregar</span>';
        if(status)status.textContent='';
      },1400);
    };
  }

  function bindProductZoom(){
    const area=panel?.querySelector('#liftMonoZoomArea');
    const img=panel?.querySelector('#liftMonoMainImg');
    if(!area||!img)return;
    area.title='Abrir imagen en pantalla completa';
    area.style.cursor='zoom-in';
    area.addEventListener('click',e=>{
      if(e.target.closest('.liftSecondaryRail,.liftMonoCounter,.liftZoomTools,button'))return;
      window.liftOpenImageViewer(img.currentSrc||img.src,img.alt||'Imagen del producto');
    });
    area.addEventListener('keydown',e=>{
      if((e.key==='Enter'||e.key===' ')&&e.target===area){e.preventDefault();window.liftOpenImageViewer(img.currentSrc||img.src,img.alt||'Imagen del producto');}
    });
    area.tabIndex=0;
    area.setAttribute('role','button');
    area.setAttribute('aria-label','Ampliar imagen del producto en pantalla completa');
  }

  function navigateProduct(step){
    const list=navProducts();
    if(!list.length) return;
    let idx=list.findIndex(x=>String(x.id)===String(currentProductId));
    if(idx<0) idx=0;
    idx=(idx+step+list.length)%list.length;
    renderProductDetail(list[idx]);
  }

  function openProduct(card){
    ensureOffcanvas();
    const p=productFromCard(card);
    if(!p) return;
    renderProductDetail(p);
    panel.classList.add('open');
    backdrop.classList.add('open');
    document.body.style.overflow='hidden';
  }

  window.openLiftProductById=function(id){
    ensureOffcanvas();
    const p=PRODUCTS.find(x=>String(x.id)===String(id));
    if(!p) return;
    renderProductDetail(p);
    panel.classList.add('open');
    backdrop.classList.add('open');
    document.body.style.overflow='hidden';
  };

  function closeProduct(){
    panel?.classList.remove('open');
    backdrop?.classList.remove('open');
    document.body.style.overflow='';
    liftClearProductUrl();
  }

  function installCardClick(){
    document.addEventListener('click',e=>{
      const searchImg=e.target.closest('.searchThumb[data-lift-product]');
      if(searchImg){
        e.preventDefault();
        e.stopPropagation();
        if(typeof closeQuickSearch==='function') closeQuickSearch();
        window.openLiftProductById(searchImg.dataset.liftProduct);
        return;
      }

      if(panel?.contains(e.target)) return;
      if(e.target.closest('button,a,input,select,textarea,label,[role="button"]')) return;
      const card=e.target.closest('.card,[class*="product-card"]');
      if(card) openProduct(card);
    });
  }

  // ============================================================
  // 5. SABORES
  // ============================================================
  let flavorData={products:{}};
  let flavorLoaded=false;

  async function loadFlavors(){
    try{
      const r=await fetch('./sabores.json?v=3',{cache:'no-store'});
      if(r.ok) flavorData=await r.json();
    }catch(e){ console.warn('Lift: sabores.json no disponible',e); }
    flavorLoaded=true;
  }

  function flavorsFor(id){
    const row=flavorData?.products?.[String(id)];
    return Array.isArray(row?.flavors)?row.flavors.filter(Boolean):[];
  }

  function ensureFlavorDialog(){
    if(document.getElementById('liftFlavorMono')) return;
    const wrap=document.createElement('div');
    wrap.id='liftFlavorMono';
    wrap.style.cssText='position:fixed;inset:0;z-index:10020;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.48);padding:18px';
    wrap.innerHTML=`
      <div style="width:min(390px,94vw);max-height:86vh;overflow:auto;background:#fff;border-radius:18px;padding:20px;box-shadow:0 24px 70px rgba(0,0,0,.3)">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
          <h3 style="margin:0">Elige el sabor</h3>
          <button type="button" id="liftFlavorX" style="border:0;background:none;font-size:28px;cursor:pointer">×</button>
        </div>
        <div id="liftFlavorList" style="display:grid;gap:8px;margin-top:16px"></div>
      </div>`;
    document.body.appendChild(wrap);
    wrap.querySelector('#liftFlavorX').onclick=()=>wrap.style.display='none';
    wrap.addEventListener('click',e=>{if(e.target===wrap)wrap.style.display='none'});
  }

  function chooseFlavor(id, callback){
    const fs=flavorsFor(id);
    if(!fs.length){callback('');return;}
    ensureFlavorDialog();
    const wrap=document.getElementById('liftFlavorMono');
    const list=document.getElementById('liftFlavorList');
    list.innerHTML=fs.map(f=>`<button type="button" data-f="${String(f).replace(/"/g,'&quot;')}" style="min-height:46px;border:1px solid #ddd;border-radius:12px;background:#fff;text-align:left;padding:10px 12px;cursor:pointer">${f}</button>`).join('');
    list.querySelectorAll('[data-f]').forEach(btn=>btn.onclick=()=>{
      wrap.style.display='none';
      callback(btn.dataset.f||'');
    });
    wrap.style.display='flex';
  }

  function installFlavorHooks(){
    if(typeof add!=='function' || window.__liftMonoFlavorInstalled) return false;
    window.__liftMonoFlavorInstalled=true;

    const originalAdd=add;
    add=function(id,flavor){
      if(typeof flavor==='string' && flavor) return originalAdd(id,flavor);
      if(!flavorLoaded || !flavorsFor(id).length) return originalAdd(id);
      chooseFlavor(id,f=>{
        // Si la base actual soporta sabor como segundo argumento, lo aprovecha.
        // Si no, al menos conserva el flujo normal del carrito.
        try{ originalAdd(id,f); }catch{ originalAdd(id); }
      });
    };

    if(typeof buyProduct==='function'){
      const originalBuy=buyProduct;
      buyProduct=function(id){
        if(!flavorLoaded || !flavorsFor(id).length) return originalBuy(id);
        chooseFlavor(id,()=>originalBuy(id));
      };
    }
    return true;
  }

  // ============================================================
  // ARRANQUE
  // ============================================================
  function refresh(){
    try{
      reclassify();
      updateProductImages();
      syncSharedProductImages();
      forceProductImageOverrides();
      if(typeof render==='function') render();
      if(typeof renderFilters==='function') renderFilters();
      if(typeof renderCart==='function') renderCart();
    }catch(e){console.error('Lift monolith refresh',e);}
  }

  function boot(){
    installCardStyles();
    reclassify();
    updateProductImages();
    syncSharedProductImages();
    forceProductImageOverrides();
    ensureOffcanvas();
    installCardClick();
    loadFlavors().finally(()=>installFlavorHooks());

    // La base ya renderizó antes de llegar aquí. Volvemos a renderizar
    // para que categorías e imágenes queden reflejadas en pantalla.
    refresh();

    let tries=0;
    const t=setInterval(()=>{
      tries++;
      installFlavorHooks();
      if(tries>30 || window.__liftMonoFlavorInstalled) clearInterval(t);
    },100);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();

})();
