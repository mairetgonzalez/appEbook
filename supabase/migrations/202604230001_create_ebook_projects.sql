create table if not exists public.ebook_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  ebook_data jsonb not null,
  template text not null default 'professional',
  font_size text not null default 'medium',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_ebook_projects_updated_at
before update on public.ebook_projects
for each row execute function public.set_updated_at();

alter table public.ebook_projects enable row level security;

create policy "Users can view own projects"
on public.ebook_projects
for select using (auth.uid() = user_id);

create policy "Users can insert own projects"
on public.ebook_projects
for insert with check (auth.uid() = user_id);

create policy "Users can update own projects"
on public.ebook_projects
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can delete own projects"
on public.ebook_projects
for delete using (auth.uid() = user_id);
