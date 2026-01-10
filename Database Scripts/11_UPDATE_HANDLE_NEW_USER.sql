-- Update handle_new_user to include team_id from metadata AND create team for leaders
create or replace function public.handle_new_user()
returns trigger as $$
declare
  is_admin boolean;
  new_team_id uuid;
  generated_code text;
  team_name_input text;
begin
  is_admin := (lower(new.email) = 'eiadmokhtar67@gmail.com');
  team_name_input := new.raw_user_meta_data->>'team_name';

  -- 1. Insert Profile
  insert into public.profiles (
    id, full_name, role, status, level, english_level, avatar_url, governorate, membership_number, email, phone_number,
    xp_total, overall_progress, data_progress, english_progress, soft_progress, streak_days, team_id
  )
  values (
    new.id, 
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 
    case 
        when is_admin then 'admin'::app_role 
        when new.raw_user_meta_data->>'role' = 'team_leader' then 'team_leader'::app_role
        else 'learner'::app_role 
    end,
    case when is_admin then 'approved' else 'pending' end,
    'Beginner',
    'B',
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'governorate',
    new.raw_user_meta_data->>'membership_number',
    new.email,
    new.raw_user_meta_data->>'phone_number',
    0, 0, 0, 0, 0, 0,
    (new.raw_user_meta_data->>'team_id')::uuid
  )
  on conflict (id) do update set 
    role = excluded.role, 
    status = excluded.status, 
    full_name = excluded.full_name,
    team_id = excluded.team_id;

  -- 2. Create Admin Role if needed
  if is_admin then
    insert into public.user_roles (user_id, role) values (new.id, 'admin'::app_role) on conflict (user_id, role) do nothing;
  end if;

  -- 3. Create Team if Leader and has Name
  if (new.raw_user_meta_data->>'role' = 'team_leader' AND team_name_input IS NOT NULL) then
      -- Generate simple unique code (8 chars)
      -- Loop to ensure uniqueness (basic recursion avoidance)
      LOOP
          generated_code := upper(substring(md5(random()::text) from 1 for 8));
          IF NOT EXISTS (SELECT 1 FROM public.teams WHERE code = generated_code) THEN
              EXIT;
          END IF;
      END LOOP;

      INSERT INTO public.teams (name, leader_id, code)
      VALUES (team_name_input, new.id, generated_code)
      RETURNING id INTO new_team_id;

      -- Update Profile to link to this new team
      UPDATE public.profiles SET team_id = new_team_id WHERE id = new.id;
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;
