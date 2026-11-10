-- SUPGO · Calculadora: agrega el objetivo "bajar" (déficit calórico) a las metas.
alter table public.lift_fit_metas drop constraint if exists lift_fit_metas_objetivo_check;
alter table public.lift_fit_metas add constraint lift_fit_metas_objetivo_check check (objetivo in ('mantener','ganar','bajar'));
