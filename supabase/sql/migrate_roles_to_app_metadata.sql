-- Migrate trusted roles into app_metadata and scrub user-controlled copies.
with role_candidates as (
  select
    id,
    app_metadata,
    user_metadata,
    case
      when app_metadata->>'role' in ('admin', 'seller') then app_metadata->>'role'
      when user_metadata->>'role' in ('admin', 'seller') then user_metadata->>'role'
      else null
    end as role
  from auth.users
)
select
  auth.admin.update_user_by_id(
    uid := id,
    app_metadata := coalesce(app_metadata, '{}'::jsonb) || jsonb_build_object('role', role),
    user_metadata := user_metadata - 'role'
  )
from role_candidates
where role is not null;
