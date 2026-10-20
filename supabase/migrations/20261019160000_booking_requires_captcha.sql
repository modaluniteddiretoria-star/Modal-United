-- Agendamentos passam a exigir captcha: só a Edge Function create-booking
-- (que valida o Cloudflare Turnstile e usa o service_role) pode criar visitas.
revoke execute on function public.create_booking(text, date, text, text, text, text, text) from anon, authenticated;
grant execute on function public.create_booking(text, date, text, text, text, text, text) to service_role;
