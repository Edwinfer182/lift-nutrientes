(() => {
  'use strict';

  const DRIVE = 'https://drive.google.com/thumbnail?id=';
  const groups = [
    {name:'creatinas', items:[
      {aliases:['cell tech 3 lb','cell tech 3lbs','cell tech 3 libras'],id:'1Ltfp2lD4vRKKwD_R_ERmfqUm1JOljMpb'},
      {aliases:['cell tech 6 lb','cell tech 6lbs','cell tech 6 libras'],id:'12zfD4aDhk5nH78rMWrNo9-RFBeu1phUb'},
      {aliases:['cell tech creactor 120 serv','cell tech creactor','creactor 120','creactor'],id:'1WfJJSzeLMAAc-GZOqDH_HpvSe8h_abAQ'},
      {aliases:['crea stack 60 serv','crea stack','creastack'],id:'1vwCWMGdlcATLB3ZeYG_lgtuyxdeKBtYQ'},
      {aliases:['creatina chews 90 tabletas','creatina chews','creatine chews','chews 90'],id:'1U73goE-Ej9Sou1Pfqc5iSBLuER1NGqF2'},
      {aliases:['creatina dymatize 300 gr 60 serv','creatina dymatize 300 gr','creatina dymatize','creatine dymatize','dymatize 300'],id:'1unY0XVVrUOgxhlEOJPduO-W0yBggMNc9'},
      {aliases:['creatina iron 100 serv 500 gr','creatina iron 100 serv','creatina iron','creatine iron','iron 100 serv'],id:'1WgTsfF74d80FErFRBZ_qsN_pDnB08hD_'},
      {aliases:['creatina 1200 gr 240 serv micronizada','1200 gr 240 serv micronizada','creatina on 240','creatine on 240','optimum nutrition 240','creatina optimum 240'],id:'15Se4597oGm8jWGpKMDkYOgx45h4P68ff'},
      {aliases:['creatina platinum 450 gr 90 serv micronizada','creatina platinum 90 serv 450 gr micronizada','creatina platinum 90','creatine platinum 90','platinum 90 serv','platinum creatina 60 serv 300 gr creapure'],id:'1jEUIurIkIP0eNAxAxd28hWtLspMezTFn'},
      {aliases:['simply creatina 300gr 60 serv','simply creatina 300 gr 60 serv','creatina simply 300','creatine simply 300','simply 300'],id:'1SOvlTG1-OG2DBtersnefTbk-NHAwuww8'},
      {aliases:['simply creatina 3 1 kg 200 serv','simply creatina 1 kg 200 serv','creatine simply 1 kg','creatina simply 1 kg','simply 1 kg','simply 1000'],id:'1LHbMA2OJ8SO7kQWNAeecfJyNyEV8z7i-'},
      {aliases:['legacy 50 serv','legacy 50','legacy creatine','creatina legacy'],id:'1CtXgrkeOHQCrXNjnbOQJLAcOip_WvGTP'}
    ]},
    {name:'applied', items:[
      {aliases:['iso xp 4lb','iso xp 4 lb'],id:'1jdppAiKKTQnLLJPJHSlq8kx3QQK7Qt6A'},
      {aliases:['iso xp 2lb','iso xp 2 lb'],id:'1j_4Kop2-VdRpCYSEAFn0pX5tKY5tr7RG'},
      {aliases:['protein crunch barra','protein crunch'],id:'15ZnZJzqrrqnc_Xsf2NF6UNnM5ant6z1K'},
      {aliases:['abe pump shot'],id:'1sKTJETT7aWuFNBaIJDzoVMxfG_f61me_'},
      {aliases:['abe all black everything 30serv','abe all black everything 30 serv','abe all black everything'],id:'1qHOpUobMsReVYQ1vhbJsBMTCO6rHy7Sm'},
      {aliases:['berberine 1000mg control de glucosa','berberine 1000 mg','berberine 1000mg'],id:'1KizWWgOrukNTtCDqYqZndhCmNBeWjnDl'},
      {aliases:['creatine 3000 30serv caps capsulas','creatine 3000 30serv caps','creatine 3000 30 serv caps'],id:'1HSzpa9mhUhDZWLc73DdeSDQvScji2UQt'},
      {aliases:['creatine monohydrate micronized 50serv','creatine monohydrate micronized 50 serv'],id:'16au9YOQBP6crGCz4xxLB2JA4-PtgYu4q'},
      {aliases:['beef xp clear 4lb','beef xp clear 4 lb'],id:'1saSZPU-Tj8TkseyclO_Q28QfA1jAMuWo'},
      {aliases:['gel endure naranja'],id:'1DgYrk0mT0h39WXRB7fN9vzXA5LoIb8Xw'},
      {aliases:['critical mass 12lb','critical mass 12 lb'],id:'1IpKtj-SJZ2aQgJXHbqOlmsmXbojkKHNA'},
      {aliases:['probiotic'],id:'1f7WroWPE5196eOwNhXmr_RCNzsM82ymr'},
      {aliases:['creatine + hydration','creatine hydration'],id:'1uDvwwZV5BVp-rXDdLwAHMet9brs_0PYT'},
      {aliases:['abe lata preentreno','abe lata de preentreno'],id:'1veJNyGCRt-oRPFXcJzU_WKxVKnQdwz4F'},
      {aliases:['critical whey 2lb','critical whey 2 lb'],id:'1tYhS_HCzQrtggvxdXMWgS7kOb_JskecC'},
      {aliases:['critical whey 4lb','critical whey 4 lb'],id:'1pG2iHSjmHcGCHrYLF5Lu8HlZcXxal84Z'}
    ]},
    {name:'basic', items:[
      {aliases:['basic whey 5 servicios','basic whey 5 serv'],id:'1ElqN-lMqqMrgwhRpuMlY5sSJslQEMzd3'},{aliases:['basic whey 2 lbs','basic whey 2 lb'],id:'1ZITSnP69Aav4v5wqgmkJCnLRbk5xbEVY'},{aliases:['basic whey 5 lbs','basic whey 5 lb'],id:'1rKHLt25Ifw2oLdWhRcJI6yuQaNi0GdC2'},{aliases:['basic isolate 2 lbs','basic isolate 2 lb'],id:'1dELhRARMFAm-CxHzadUP4buuvriPD_dk'},{aliases:['basic isolate 5 lbs','basic isolate 5 lb'],id:'1uOhLzMQ3Ar72p_2HVwA1lJiVlDYKvU9h'},{aliases:['basic mass gainer 6 lbs','basic mass gainer 6 lb','basic mass 6 lbs'],id:'1Z7r_uOpEchdKkPGdPah-BoYDxuFDmf98'},{aliases:['basic eaa 30 ser','basic eaa 30 serv'],id:'1VHoyRp46prnbURLRlEyM8-r3c4zAqhpe'},{aliases:['basic creatina 300 gr','basic creatina 300gr','basic creatina 300 gr 60 serv'],id:'1PMh8XsVviqmTb2gW2Hs0pRujkzWBCxQ3'},{aliases:['basic glutamina 300 gr','basic glutamina 300gr','basic glutamina 300 gr 60 serv'],id:'1tnzo1YGFMMhB9uqvc_8hNjXFo0PiIFBn'},{aliases:['basic pre 30 serv','basic pre 30serv'],id:'1fI72R-mfsfwFZZ89LX8gexI7Ej5Om__8'},{aliases:['basic burn 45 serv','basic burn 45serv'],id:'17qRVvdLuhgZPbA1OdB09VcvVWfzjRcSk'},{aliases:['basic hydration 20 sachet','basic hydration 20 sachets'],id:'1UE-4QAS4KG6_pM1xBsFHC8XjZm3oVsHo'}
    ]},
    {name:'bsn', items:[
      {aliases:['syntha 6 10 lbs','syntha 6 10 lb'],id:'1ICGqpvXh3HYqoyQqzQ3pUUHT9gX4xGFp'},{aliases:['syntha 6 5 lbs','syntha 6 5 lb'],id:'13AH4sX3CA-nhu3kVhUpnwkn02-X-Qa1x'},{aliases:['amino x 30 serv','amino x 30 servicios'],id:'1JT3c3GTCJb0JRwO1tc4FnQ248-QwP9kM'},{aliases:['amino x 70 serv','amino x 70 servicios'],id:'187Lk4ELQR11BiAGEbmyV-p0PuuJn9Sax'},{aliases:['no-xplode 30 serv','no xplode 30 serv','noxplode 30 serv'],id:'1Jjz5ps90vldNUPf8vzSUMevLMvhsczYY'},{aliases:['no-xplode 60 serv','no xplode 60 serv','noxplode 60 serv'],id:'1r3QRCzPmEp-9fIFrvPdXaI1EeCavKkUk'},{aliases:['protein crisp barra','bsn protein crisp bar','protein crisp bar','protein crisp'],id:'1pTQboDBRwohjtvucpK8m56U5OsVDoWmG'}
    ]},
    {name:'cellucor', items:[
      {aliases:['c4 original 30 serv'],id:'1YXOZRYzCGGE5PJHWhn-lP_z_2txNikj4'},{aliases:['c4 original 50 serv'],id:'1PSYV7N_p3tTLhm6wWybRr_6oaMRZOLjE'},{aliases:['c4 original energy 1 lata','c4 original energy','c4 energy 1 lata'],id:'1k5NPyqykx_zraCKqgS9C1F0u1BQAaxcH'},{aliases:['c4 energy drink pack x12 latas','c4 energy drink pack x12','c4 energy pack x12'],id:'1OWVAwa0EGcZa55PyqoLaQyNAsk6Opobq'}
    ]},
    {name:'darkness', items:[
      {aliases:['evora pw pre entreno 30 serv','evora pw 30 serv'],id:'1IDRqIdZV48ctD2F_vHA1a7Nl3Y1_u8Su'},{aliases:['creatina creapure 3g 66 serv','creatina creapure 66 serv'],id:'1p_mvE_LmEMG89Y_y12Xmg1o62PQr_o5Q'},{aliases:['vasculor pre entreno vasodilatador 300 gr','vasculor 300 gr','vasculor'],id:'1YuBPsFS6BlcHpLi3blC1ULowX7Hc8XT7'},{aliases:['evora xt 60 serv','evora xt'],id:'1cjtmBiFrOIHblZTO0ZQ1ETqzx4ucVlin'},{aliases:['whey concentrada 30g proteina 2 lb','whey concentrada 30g proteína 2lb','whey concentrada 2 lb'],id:'18fIT6Un1ZTRxM36g6i3PgtocBBCfLxce'},{aliases:['dark bar x8','dark bar darkness nation x 8 und','dark bar darkness nation'],id:'1E_BAjdlx63HCr8lp3yekgXOOz2h-lpU9'}
    ]},
    {name:'dragon', brand:'dragon pharma', items:[
      {aliases:['venom inferno 30 serv','venom inferno'],id:'1iuMXhcmz5KniY0xNpXshQnxAngQ-VUvJ'},{aliases:['venom essential 30 serv','venom essential'],id:'1aSEFshUDnDpyebVbpiEOwQpj4_oIa5FD'},{aliases:['venom fully loaded 20 serv','venom fully loaded'],id:'1J89dGAaIdGkFlTdALdrRsA5Vjds-F1aG'},{aliases:['crema de arroz'],id:'1beeBFOUageu7Oel_e0g1-IZLK3BKt9XJ'},{aliases:['black viper 90 caps','black viper'],id:'1LmPK1Ti2Aizk0762ALrdMpX9TPR4_4q8'},{aliases:['beta alanina venom 60 serv','betalalina venom 60serv','beta alanina venom'],id:'1a5vY5OVHQ3K2YCBiRUZgnD20zX6FqCfP'},{aliases:['creatina monohidratada 60 serv','creatina monohidrata 60serv','creatina monohidratada 60serv'],id:'1hnjakdAhpdMKeIk6EAOFOrXJ5gKl910p'},{aliases:['creatina monohidratada 200 serv','creatina monohidratada 200serv'],id:'1VwlVjRxK7AfL2v6GEpX_xg8EtN4eXXuN'},{aliases:['fematrope'],id:'15yzRqHGoKHL3_lxAGefAo3UaoOGw_7Bh'},{aliases:['hydra'],id:'14QU4DSucVazSnTtMbcXuxoypMkdPm3V2',exactName:true},{aliases:['dry up'],id:'1jrIyHa0JTdHwfyzbrwRBsldDoIYRmdkm'},{aliases:['dr fear'],id:'1n7PUXdOYuvwrISP8cEv2f3RdARhqQthg'},{aliases:['whey phorm 2 lbs','whey phorm 2 libras','whey phorm 2 lb'],id:'12E0cJf1KoGd5Ke7DRdWAdISwgU7T7K-2'},{aliases:['whey phorm 5 lbs','whey phorm 5 libras','whey phorm 5 lb'],id:'1-p647ZzzoVjEB5kTHhU_tH4vF7d599gY'},{aliases:['omega 3 dragon pharma','omega 3'],id:'1LyUy6CVaCpZfmhyzxaLwfo5VK8KSFX-M'},{aliases:['vitamina d3+k2','vitamina d3 k2','d3+k2'],id:'1bguPTo8UCeHhvruKru7OxvV4uIjTJR2D'},{aliases:['citrulina','l citrulina','l-citrulline'],id:'1PS9ux-SGUGFMfBMN7utrrJJ_jI8aAYE2'},{aliases:['salsa dragon','salsad dragon'],id:'1CWUF2jLwadQuDvu2bbUpF2vJYKQ2is0i'}
    ]},
    {name:'dymatize', items:[
      {aliases:['iso 100 1.3 lbs','iso100 1.3 lb','iso100 1.3 lbs'],id:'1HkTDmvSZ51yciulklQY_me0rrj2-RYAN'},{aliases:['iso 100 3 lbs','iso100 3 lb','iso100 3 lbs'],id:'1K-cwmTzwoHm9W94hLxlmzvjPYngc6pAf'},{aliases:['iso 100 5 lbs','iso100 5 lb','iso100 5 lbs'],id:'1Dc0hXGskYfHD37xr93JsGfLuz1EXMgpB'},{aliases:['super mass gainer 6 lbs','super mass 6 lbs'],id:'1IA5MMLsIGl8CuSUbYT-kKf39lxmzAMg5'},{aliases:['super mass gainer 12 lbs','super mass 12 lbs'],id:'135QeLTYS4QyGpxf9dUPFc7PR4FD4Eudk'},{aliases:['elite whey 2 lbs','whey elite 2 lbs'],id:'1uy1E8XoiIPAc9T97Ys8cC8QFBRj1NXT_'},{aliases:['elite whey 5 lbs','whey elite 5 lbs','whey elite 100%'],id:'1SqKAg0VHMqbb5Vku0ocUNj6D878v_oyr'},{aliases:['creatina dymatize 300 gr 88 serv 3 gr','creatina dymatyze 300 gr 88 serv 3 gr','creatina 300 gr 88 serv 3 gr'],id:'1wqXm26uMqFL4odl3EtSp0FE7nYC_iMxf'},{aliases:['creatina dymatize 500 gr 147 serv 3 gr','creatina dymatyze 500 gr 147 serv 3 gr','creatina 500 gr 147 serv 3 gr'],id:'1EheZUWD7-eks3btcS-ldzXmlhyLwrrHx'},{aliases:['creatina dymatize 300 gr 60 serv','creatina dymatyze 300 gr 60 serv','creatina 300 gr 60 serv','creatina dymatize 60 serv','creatina dymatyze 60 serv'],id:'13-ANgE3a10jy0nZ7IJpQ1cSRNNTr1zfX'},{aliases:['dymatize protein shake','protein shake'],id:'15KDUdpx3CgUZVaIg61IvxXhzNSz3xPS3'}
    ]},
    {name:'elite', items:[
      {aliases:['survivor pack 30 packs','survivor pack'],id:'1gZsrU7pDRCzm7D_kyP2zRR1onsCLPLzX'},{aliases:['lipocore advance 90 caps','lipocore advance'],id:'1G1QmS5BaZVPW0RLTljQPUxgxJDsV8quA'},{aliases:['organ defender'],id:'1TDYO73zON7KwLbzzvBUFkLeQMpBUVruP'},{aliases:['testabolic xtreme 120 caps','testabolic xtreme'],id:'1pVC2r9y19dg8W-ZxH9nq9OicJX6qgxqs'}
    ]},
    {name:'enhanced', items:[
      {aliases:['blue ox pct 150 caps','enhanced athlete blue ox pct 150 caps'],id:'1I2lcOVpaFUJc_hw4kZhtgJ81aYpOq_8H'},{aliases:['black ox 240 caps','enhanced athlete black ox 240 caps'],id:'1oDvZTrvYCTZQsHArxo_r59-JM2BX3KM8'},{aliases:['phytoturk 60 caps 500 mg','enhanced athlete phytoturk 60 caps 500 mg'],id:'16I2hFRr6xckNotPVVnITc7XQTHIFpYD0'},{aliases:['arachidonic acid 120 caps','enhanced athlete arachidonic acid 120 caps'],id:'1H2eMzbAcgk8xprC3-8-5GCL5Ezkvba0T'},{aliases:['shred xt 60 caps','enhanced athlete shred xt 60 caps'],id:'1dp-xmkdL0E3HXcMzLahMFiz8PsmIIKZ9'},{aliases:['slin 120 caps','enhanced athlete slin 120 caps'],id:'1Jg6qabR7BqKyDlDArlGXmMf_L5aS_mxP'},{aliases:['cardarine gw501516 10 mg 60 caps','cardarine gw501516 10mg 60 caps','enhanced athlete cardarine gw501516 10 mg 60 caps'],id:'1rH3P_aLFJ4vbNONP2pDUdId963AXk6_Y'},{aliases:['growth hormone mk677 10 mg 60 caps','growth hormone mk677 10mg 60 caps','enhanced athlete growth hormone mk677 10 mg 60 caps'],id:'1yadXKg4ELBPM6H1-HdzFKBwMU1hhdDbk'},{aliases:['ligandrol lgd4033 5 mg 60 caps','ligandrol lgd4033 5mg 60 caps','enhanced athlete ligandrol lgd4033 5 mg 60 caps'],id:'1qbHyw5sjJ4-Zufwx_sdIsBwdT-La09D6'},{aliases:['ostamuscle mk2866 10 mg 60 caps','ostamuscle mk2866 10mg 60 caps','enhanced athlete ostamuscle mk2866 10 mg 60 caps'],id:'1_Auz2m2i6IWaZt_c0D3VtU4dsqlubKVj'},{aliases:['testolone rad140 10 mg 60 caps','testolone rad140 10mg 60 caps','enhanced athlete testolone rad140 10 mg 60 caps'],id:'1AtL-0IH3CXT-0ekIPo7rsjr0Le8Gq-KQ'},{aliases:['mutant yk11 60 caps 5 mg','mutant yk11 60 caps x 5mg','enhanced athlete mutant yk11 60 caps 5 mg'],id:'1vcne2T12m4Ozjuh_izbQe_tiiDpc8KJJ'},{aliases:['dark horse 60 caps','enhanced athlete dark horse 60 caps'],id:'1e4tawt7xwMbqMwhliW6Qd3WS0bO8LmYA'},{aliases:['superbeast 60 caps','enhanced athlete superbeast 60 caps'],id:'1uUSBoSEkbT9EseJmqCP_JBk5XEWFdfPI'},{aliases:['centaurus 60 caps','enhanced athlete centaurus 60 caps'],id:'1zNqmGlUouB3p9KCbU_jfK57fM07Eq5ae'},{aliases:['ostadrol 60 caps','enhanced athlete ostadrol 60 caps'],id:'1nRHp1MeqOjdoSlLHZR4W8lzxo28j_h7G'},{aliases:['tadalafil 10 mg 60 caps','enhanced tadalafil 10mg x 60 caps','enhanced athlete tadalafil 10 mg 60 caps'],id:'1bck561Fv47w14ppRWiIP527zhM9yepkx'}
    ]},
    {name:'hard', brand:'hard supps', items:[
      {aliases:['synephrine'],id:'1QXq2EkDLay-wG7DvauRmPbUvOLUan39V'},{aliases:['citrulina'],id:'1z0_qDetPfcSAIIGW5_7m5k81wNAQHsRj'},{aliases:['multi-core','multi core'],id:'18IYr5bKHLIUfw9fnQw3FoEHF4hdLNlQ4'},{aliases:['neuro freak'],id:'1v7pVvkIe8Z9cqO2B30eWUcWdLpcfoWOa'},{aliases:['cafeina'],id:'1FUCLLkAKZCp_y-hZI87QS3wk0oYHF1yX'},{aliases:['zma'],id:'1d8C4JD9ObMkIkZB2rPNiK-lHHwx3jr3_'},{aliases:['nac'],id:'1odM8jz3GNAjMF0QRzGKUfTZdrNjG7fUf'},{aliases:['magnesium glycinate','magnesio glycinate'],id:'1GUkZPgVgzMnzC3qApw-sj9DkjfdBQKHP'},{aliases:['crea 166 serv'],id:'1WFr1tJPyqLto9DM2kWM1SHcdYW49L0F_'},{aliases:['yohimbina'],id:'1Ac6nPsFqTvp-oTEsfw9_yv3tSKsndwO-'},{aliases:['gluta'],id:'19jTBrWRUnJG6q1_mhvulPQ43e3GuilUe'},{aliases:['biozyme enzimas'],id:'1HPIY3P-rKcJvQhXuD-8A7YOhnEQnGrmP'},{aliases:['hmb'],id:'1WPzPJCUyxYJswNzQr9HoqTGRD0Larn5e'},{aliases:['testo rage'],id:'1L4j8C_uV-DRHM-gprqadakivX9oaU-SX'},{aliases:['ashwagandha'],id:'1y1iWQ4KUITPv2bV9GVZmV7uOjitCtl8Y'},{aliases:['arginina'],id:'10FUQFkttsrHl2du0csBC3V5JErFAtTz3'},{aliases:['beta-alanina','beta alanina'],id:'1acqPc-NO8K9pRsmHykv7WS8CTxZWxAMn'}
    ]},
    {name:'healthy', items:[
      {aliases:['creatina healthy sports 300 gr','creatina healthy sports 300 gramos','healthy sports creatina 300 gr'],id:'12MsRLrhi30BiHmuxtFEo9PmN7e5_1AK8'},{aliases:['creatina healthy sports 150 gr','creatina healthy sports 150 gramos','healthy sports creatina 150 gr'],id:'1qczaRDiGW4FIeWtBK_c-UZ_Cda1CcGLT'},{aliases:['vegan protein 2 lb','vegan protein','healthy sports vegan protein'],id:'1FRzZhDFbXc1lHHGdIqI3JKaXyOy90E8p'},{aliases:['turmeric 60 gomas','tumeric 60 gomas'],id:'1UDrn_ltFF-4BSno6X9NLEmEB42UYpYeu'},{aliases:['citrato de magnesio gomitas 30 serv','citrato de magnesio en gomas 30 serv','citrato de magnesio'],id:'1LnuXSNCv2sE8OeZSGs2cY-pOPn_MPyac'},{aliases:['complejo b gomitas 30 serv','complejo b gomas 30 serv','complejo b'],id:'1oFtujnApUojGJHKaiKJJY2tnKJPLMzrj'},{aliases:['probiotics 60 gomitas','probiotics 60 gomas','probiotics'],id:'1wolpo6OYKQagrcwIfNXYcbuiDbgjWQeb'}
    ]},
    {name:'hitech', items:[
      {aliases:['lipodrene hardcore'],id:'1Z37dxhu_f02ydYD2yAlV5yD6azIsImpU'},{aliases:['lipodrene xtreme'],id:'1I5wyjmNF_WL2zzj6uL10N2hCUsGlH2lO'},{aliases:['lipodrene'],id:'1xyWPMwGOBhWCdXCUF_lcZBucyRWjLW5N'},{aliases:['creatina hitech 400 g 80 serv','creatina hitech 400 gr 80 serv','creatina hi tech 400 gr 80 serv'],id:'1VZ0zmLXIGCB6yZgc7-UWfABCAcpRvH0X'},{aliases:['100 caps cafeina','cafeina 100 caps'],id:'1KWBwdsuVk_LUyB81_HqETJW3HoymVtEI'},{aliases:['magnesium glycinate 120 caps 500mg','magnesium glycinate 120 caps 500 mg'],id:'1VQS3qtHNgtyBHYFeODJjRsC-vvuILUfL'},{aliases:['resveratrol x 90 caps 500 mg','resveratrol 90 caps 500 mg'],id:'12A_H86wFkWU8_8xZTwSyilQdL8Ap8HCO'},{aliases:['nac protector hepatico 100 porciones 600 mg','nac 100 serv 600 mg'],id:'16vuDT1cGZQH4kfhPg7izQ6cLHUdI7wzK'}
    ]},
    {name:'imn', items:[
      {aliases:['creatina imn 500gr 166serv sin sabor','creatina imn 500 gr 166 serv sin sabor','creatina imn 500gr','creatina imn 500 gr','creatina 500gr 166serv','creatina 500 gr 166 serv'],id:'1yRsiOfmE4z1pqUcCmzM9LWAKAe92HyYV'},{aliases:['imn bull 68serv creatina','imn bull 68 serv creatina','bull 68serv creatina','bull 68 serv creatina','imn bull','bull creatina'],id:'14wBHJeY6msnLETzog5csW1zLoQn6I5u0'},{aliases:['imn korageem','korageem'],id:'14m9rktyIcFJMKf4AJC4_47b8OMcuFGjk'},{aliases:['imn ultimate pre workout','ultimate pre workout imn','ultimate pre workout','ultimate preworkout'],id:'17Zp0uqkdwp0JpIGERrbnKyiN6u4ypg1w'}
    ]},
    {name:'hyper', items:[
      {aliases:['just a whey 30 serv vainilla','just a whey 30serv sabor vainilla','ust a whey 30serv sabor vainilla'],id:'1_LwhKGRU1SBA8PUQmnRRZwSyYP9TLc_k'},{aliases:['phatom toronja 30 serv','phatom sabor toronja 30serv','phatom 30 serv'],id:'1LZRLp-AUxn_jpdtxwRvgbk_HqJS5svMA'},{aliases:['creatine hcl acid grape y panelada 30 serv','crtne hcl acid grape y panelada 30serv','creatina hcl acid grape y panelada 30 serv'],id:'1URwTHOTWQzl15JqyoaCongakFR91no-f'},{aliases:['the builder'],id:'15cmnQjdeMLTDy7YZjLf3jYQbBRJBLXsz'},{aliases:['factor lemon lychee 30 serv','factor sabor lemon lychee 30serv','factor sabor lemon lychee 30 serv bcaa'],id:'1rI8ACl8oUQ-4RrmImEhWdCwwHDZj3O_C'}
    ]}
  ];

  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9+.%]+/g,' ').replace(/\s+/g,' ').trim();
  const hasPhrase = (text, phrase) => ` ${norm(text)} `.includes(` ${norm(phrase)} `);

  function cardBrand(card){
    return norm([
      card.getAttribute('data-brand'), card.getAttribute('data-marca'), card.dataset?.brand, card.dataset?.marca,
      card.querySelector('.brand,.marca,[class*="brand"],[class*="marca"]')?.textContent
    ].filter(Boolean).join(' '));
  }

  function productName(card){
    return norm(card.querySelector('.name')?.textContent || card.querySelector('[class*="name"]')?.textContent || '');
  }

  function findBest(card){
    const text = card.innerText || card.textContent || '';
    const brand = cardBrand(card);
    const name = productName(card);
    let best = null;
    let bestLen = -1;
    let priority = -1;

    groups.forEach((group, groupIndex) => {
      if (group.brand && !hasPhrase(brand || text, group.brand)) return;
      group.items.forEach(item => {
        item.aliases.forEach(alias => {
          const a = norm(alias);
          const ok = item.exactName ? (name === a || name.startsWith(a + ' ')) : hasPhrase(text, alias);
          if (a && ok && (a.length > bestLen || (a.length === bestLen && groupIndex >= priority))) {
            best = item;
            bestLen = a.length;
            priority = groupIndex;
          }
        });
      });
    });
    return best;
  }

  function applyCard(card){
    if (!card || card.nodeType !== 1 || card.closest('#liftProductOffcanvas')) return;
    const signature = norm((card.querySelector('.name')?.textContent || '') + '|' + cardBrand(card) + '|' + (card.textContent || '').slice(0,180));
    if (card.dataset.liftUnifiedImageSignature === signature) return;
    card.dataset.liftUnifiedImageSignature = signature;

    const match = findBest(card);
    if (!match) return;
    const img = card.querySelector('.pic img, img');
    if (!img) return;
    const wanted = DRIVE + match.id + '&sz=w800';
    if (!String(img.src || '').includes(match.id)) img.src = wanted;
    img.dataset.liftUnifiedDriveId = match.id;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer';
    img.style.width = 'auto';
    img.style.height = 'auto';
    img.style.maxWidth = '100%';
    img.style.maxHeight = '100%';
    img.style.objectFit = 'contain';
    img.style.objectPosition = 'center';
  }

  function cardsFromNode(node){
    if (!node || node.nodeType !== 1) return [];
    const out = [];
    if (node.matches?.('.card,[class*="product-card"],article')) out.push(node);
    node.querySelectorAll?.('.card,[class*="product-card"],article').forEach(x => out.push(x));
    return out;
  }

  function applyAll(){
    document.querySelectorAll('.card,[class*="product-card"],article').forEach(applyCard);
  }

  let queuedNodes = new Set();
  let raf = 0;
  function flush(){
    raf = 0;
    const nodes = [...queuedNodes];
    queuedNodes.clear();
    nodes.forEach(node => cardsFromNode(node).forEach(applyCard));
  }

  const observer = new MutationObserver(mutations => {
    for (const m of mutations) {
      if (m.type === 'childList') m.addedNodes.forEach(n => { if (n.nodeType === 1) queuedNodes.add(n); });
      else if (m.type === 'attributes') queuedNodes.add(m.target);
    }
    if (!raf && queuedNodes.size) raf = requestAnimationFrame(flush);
  });

  function start(){
    applyAll();
    observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['data-brand','data-marca']});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true}); else start();
  window.addEventListener('hashchange', applyAll);
})();