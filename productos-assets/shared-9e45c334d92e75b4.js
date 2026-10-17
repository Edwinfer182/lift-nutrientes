
(function(){
  function fieldOf(id){var e=document.getElementById(id);return e?e.closest('.field'):null}
  function build(){
    var body=document.querySelector('#checkoutModal .checkoutBody');
    if(!body||body.querySelector('.liftCustomerCheckoutGrid'))return;
    var grid=document.createElement('div');grid.className='liftCustomerCheckoutGrid';
    var left=document.createElement('div');left.className='liftCustomerLeft';
    var right=document.createElement('div');right.className='liftCustomerRight';
    grid.append(left,right);

    var name=fieldOf('coName'), phone=fieldOf('coPhone'), wa=fieldOf('coWhatsappUser'), email=fieldOf('coEmail');
    var city=fieldOf('coCity'), address=fieldOf('coAddress'), doc=fieldOf('coDocument'), notes=fieldOf('coNotes');
    if(email)email.classList.add('liftEmailField');
    if(city)city.classList.add('liftCityMoved');
    if(address)address.classList.add('liftAddressMoved');
    if(doc)doc.classList.add('liftFull');
    if(notes)notes.classList.add('liftNotesMoved');
    [name,phone,wa,city,address,email,doc,notes].forEach(function(x){if(x)left.appendChild(x)});



    var coupon=body.querySelector('.couponBox');if(coupon)right.appendChild(coupon);
    var flavor=body.querySelector('.checkoutFlavorNote');if(flavor)right.appendChild(flavor);
    var summary=body.querySelector('.liftCheckoutSummaryCard');if(summary)right.appendChild(summary);
    var prefs=body.querySelector('.liftCheckoutPrefs');if(prefs)right.appendChild(prefs);
    var action=body.querySelector('.liftCheckoutActionArea');if(action)right.appendChild(action);

    var manual=document.getElementById('liftManualProductBox');
    if(manual)body.insertBefore(grid,manual);else body.appendChild(grid);
    if(manual)body.insertBefore(manual,grid); // admin tool stays above customer layout

    // Remove now-empty delivery/contact grids and visual headings only; IDs/functions remain intact.
    body.querySelectorAll('.liftCheckoutContact,.liftCheckoutDelivery').forEach(function(x){if(!x.children.length)x.remove()});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build);else build();
})();
