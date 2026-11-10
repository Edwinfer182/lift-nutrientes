-- SUPGO · Calculadora de calorías con progreso y puntos.
-- Todo se maneja desde la función lift-progreso (service role). Las tablas tienen RLS
-- activo y sin políticas: el navegador no puede leerlas ni escribirlas directamente.

create table if not exists public.lift_fit_perfil (
  cuenta_id bigint primary key references public.lift_cuentas(id) on delete cascade,
  sexo text not null check (sexo in ('h','m')),
  fecha_nacimiento date not null,
  estatura_cm numeric(5,1) not null check (estatura_cm between 120 and 230),
  actividad text not null check (actividad in ('sedentario','ligero','moderado','alto','muy_alto')),
  grasa_pct numeric(4,1) check (grasa_pct is null or grasa_pct between 3 and 60),
  updated_at timestamptz not null default now()
);
comment on table public.lift_fit_perfil is 'Datos físicos del cliente para la calculadora de calorías. Solo vía función lift-progreso.';

create table if not exists public.lift_fit_registros (
  id bigint generated always as identity primary key,
  cuenta_id bigint not null references public.lift_cuentas(id) on delete cascade,
  fecha date not null,
  peso_kg numeric(5,1) not null check (peso_kg between 30 and 300),
  grasa_pct numeric(4,1) check (grasa_pct is null or grasa_pct between 3 and 60),
  created_at timestamptz not null default now(),
  unique (cuenta_id, fecha)
);
create index if not exists lift_fit_registros_cuenta_idx on public.lift_fit_registros (cuenta_id, fecha desc);
comment on table public.lift_fit_registros is 'Registros de peso del cliente (uno por día). Solo vía función lift-progreso.';

create table if not exists public.lift_fit_metas (
  id bigint generated always as identity primary key,
  cuenta_id bigint not null references public.lift_cuentas(id) on delete cascade,
  objetivo text not null check (objetivo in ('mantener','ganar')),
  ritmo text not null default 'suave' check (ritmo in ('suave','moderado')),
  peso_inicial numeric(5,1) not null,
  peso_meta numeric(5,1) not null check (peso_meta between 30 and 300),
  fecha_limite date,
  calorias int not null,
  proteina_g int not null,
  grasa_g int not null,
  carbos_g int not null,
  estado text not null default 'activa' check (estado in ('activa','cumplida','cancelada')),
  created_at timestamptz not null default now(),
  cerrada_en timestamptz
);
create unique index if not exists lift_fit_metas_una_activa on public.lift_fit_metas (cuenta_id) where estado = 'activa';
comment on table public.lift_fit_metas is 'Metas de peso y plan de calorías/macros. Una activa por cuenta. Solo vía función lift-progreso.';

-- Libro de puntos: positivos al ganar, negativos al canjear. "clave" evita dar dos veces el mismo premio.
create table if not exists public.lift_fit_puntos (
  id bigint generated always as identity primary key,
  cuenta_id bigint not null references public.lift_cuentas(id) on delete cascade,
  puntos int not null,
  motivo text not null,
  clave text not null,
  created_at timestamptz not null default now(),
  unique (cuenta_id, clave)
);
create index if not exists lift_fit_puntos_cuenta_idx on public.lift_fit_puntos (cuenta_id, created_at desc);
comment on table public.lift_fit_puntos is 'Puntos SUPGO ganados y canjeados. Solo vía función lift-progreso.';

create table if not exists public.lift_fit_canjes (
  id bigint generated always as identity primary key,
  cuenta_id bigint not null references public.lift_cuentas(id) on delete cascade,
  cupon_id bigint not null references public.lift_cupones(id),
  puntos int not null,
  valor numeric(14,2) not null,
  created_at timestamptz not null default now()
);
comment on table public.lift_fit_canjes is 'Cupones de un solo uso creados al canjear puntos. Solo vía función lift-progreso.';

alter table public.lift_fit_perfil enable row level security;
alter table public.lift_fit_registros enable row level security;
alter table public.lift_fit_metas enable row level security;
alter table public.lift_fit_puntos enable row level security;
alter table public.lift_fit_canjes enable row level security;
revoke all on public.lift_fit_perfil, public.lift_fit_registros, public.lift_fit_metas, public.lift_fit_puntos, public.lift_fit_canjes from anon, authenticated;

-- Canje atómico: bloquea la cuenta, revisa el saldo, crea el cupón y descuenta los puntos.
create or replace function public.lift_fit_canjear(p_cuenta bigint, p_puntos int, p_valor numeric, p_codigo text)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare saldo int; cup bigint;
begin
  perform 1 from public.lift_cuentas where id = p_cuenta for update;
  select coalesce(sum(puntos),0) into saldo from public.lift_fit_puntos where cuenta_id = p_cuenta;
  if saldo < p_puntos then return jsonb_build_object('ok',false,'reason','saldo'); end if;
  insert into public.lift_cupones (codigo,tipo_descuento,valor,activo,minimo_compra,limite_total,limite_por_celular,alcance_tipo,visible_en_cuenta,vence_en)
    values (p_codigo,'fixed',p_valor,true,p_valor*2,1,1,'all',false,now() + interval '90 days')
    returning id into cup;
  insert into public.lift_fit_canjes (cuenta_id,cupon_id,puntos,valor) values (p_cuenta,cup,p_puntos,p_valor);
  insert into public.lift_fit_puntos (cuenta_id,puntos,motivo,clave) values (p_cuenta,-p_puntos,'Canje por cupón de $'||to_char(p_valor,'FM999G999'),'canje-'||cup);
  return jsonb_build_object('ok',true,'cupon_id',cup,'saldo',saldo - p_puntos);
end $$;
revoke all on function public.lift_fit_canjear(bigint,int,numeric,text) from public, anon, authenticated;
grant execute on function public.lift_fit_canjear(bigint,int,numeric,text) to service_role;
