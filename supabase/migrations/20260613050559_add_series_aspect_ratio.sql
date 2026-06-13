alter table public.series
  add column if not exists aspect_ratio text not null default 'portrait';

alter table public.series
  drop constraint if exists series_aspect_ratio_check;

alter table public.series
  add constraint series_aspect_ratio_check
  check (aspect_ratio in ('portrait', 'landscape'));

comment on column public.series.aspect_ratio is
  'Display/playback format: portrait for vertical series, landscape for horizontal series.';
