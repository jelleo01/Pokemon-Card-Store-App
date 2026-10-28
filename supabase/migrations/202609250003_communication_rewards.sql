-- Apply after migration 002. Rewards apply to new activity after installation.
begin;
create or replace function public.card_reward_action()
returns trigger language plpgsql security definer set search_path = '' as $$
declare author uuid;
begin
  if TG_TABLE_NAME = 'profiles' then
    perform public.card_credit(new.id, 20, 'welcome', 'welcome');
  elsif TG_TABLE_NAME = 'posts' then
    if new.category::text = 'news' and new.shop_id is not null then
      perform public.card_credit(new.user_id, 3, 'report', 'report:' || new.id);
    elsif new.category::text = 'ask' then
      perform public.card_credit(new.user_id, 1, 'question', 'question:' || new.id);
    end if;
  elsif TG_TABLE_NAME = 'comments' then
    -- Authors also earn for participating in discussion on their own posts.
    perform public.card_credit(new.user_id, 1, 'comment', 'comment:' || new.id);
  elsif TG_TABLE_NAME = 'hearts' then
    select user_id into author from public.posts where id = new.post_id;
    if author <> new.user_id then
      perform public.card_credit(new.user_id, 1, 'like', 'like:' || new.post_id);
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.card_reward_action() from public, anon, authenticated;
commit;
