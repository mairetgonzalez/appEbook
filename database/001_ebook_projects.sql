create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.ebook_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  ebook_data jsonb not null default '{}'::jsonb,
  template text not null default 'professional',
  font_size text not null default 'medium',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists ebook_projects_set_updated_at on public.ebook_projects;
create trigger ebook_projects_set_updated_at
before update on public.ebook_projects
for each row
execute function public.set_updated_at();

alter table public.ebook_projects enable row level security;

drop policy if exists "Usuários veem seus projetos" on public.ebook_projects;
create policy "Usuários veem seus projetos"
on public.ebook_projects
for select
using (auth.uid() = user_id);

drop policy if exists "Usuários criam seus projetos" on public.ebook_projects;
create policy "Usuários criam seus projetos"
on public.ebook_projects
for insert
with check (auth.uid() = user_id);

drop policy if exists "Usuários atualizam seus projetos" on public.ebook_projects;
create policy "Usuários atualizam seus projetos"
on public.ebook_projects
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Usuários removem seus projetos" on public.ebook_projects;
create policy "Usuários removem seus projetos"
on public.ebook_projects
for delete
using (auth.uid() = user_id);
