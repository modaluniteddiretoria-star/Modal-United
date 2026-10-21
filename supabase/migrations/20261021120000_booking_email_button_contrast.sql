-- Botão do WhatsApp legível também no modo escuro do Gmail

create or replace function public.notify_new_booking()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_key text;
  v_to text;
  v_date text := to_char(new.visit_date, 'DD/MM/YYYY');
  v_phone_fmt text;
  v_wa text := 'https://wa.me/55' || new.phone;
  v_html text;
begin
  select decrypted_secret into v_key
  from vault.decrypted_secrets where name = 'resend_api_key' limit 1;
  if v_key is null then
    return new;
  end if;

  select decrypted_secret into v_to
  from vault.decrypted_secrets where name = 'booking_notify_email' limit 1;
  if v_to is null then
    select a.email into v_to from public.agent_profile a where a.id = 1;
  end if;
  if v_to is null then
    return new;
  end if;

  v_phone_fmt := case
    when length(new.phone) = 11 then format('(%s) %s-%s', substr(new.phone, 1, 2), substr(new.phone, 3, 5), substr(new.phone, 8))
    when length(new.phone) = 10 then format('(%s) %s-%s', substr(new.phone, 1, 2), substr(new.phone, 3, 4), substr(new.phone, 7))
    else new.phone
  end;

  v_html := format(
    '<div style="font-family:Arial,sans-serif;font-size:15px;color:#222">'
    || '<h2 style="margin:0 0 12px">Nova visita agendada</h2>'
    || '<p><b>Imóvel:</b> %s</p>'
    || '<p><b>Data:</b> %s às %s</p>'
    || '<p><b>Visitante:</b> %s</p>'
    || '<p><b>Telefone:</b> %s</p>'
    || '%s%s'
    || '<p><b>Código:</b> %s</p>'
    || '<p><a href="%s" style="display:inline-block;background:#075E54;color:#ffffff;font-weight:bold;padding:12px 18px;border-radius:6px;text-decoration:none"><span style="color:#ffffff">Falar com o visitante no WhatsApp</span></a></p>'
    || '</div>',
    public.html_escape(new.property_title),
    v_date,
    new.visit_time,
    public.html_escape(new.name),
    v_phone_fmt,
    case when new.email is not null then format('<p><b>E-mail:</b> %s</p>', public.html_escape(new.email)) else '' end,
    case when new.note is not null then format('<p><b>Observação:</b> %s</p>', public.html_escape(new.note)) else '' end,
    new.code,
    v_wa
  );

  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || v_key,
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'from', 'Modal United <onboarding@resend.dev>',
      'to', jsonb_build_array(v_to),
      'subject', format('Nova visita: %s — %s às %s', new.property_title, v_date, new.visit_time),
      'html', v_html
    )
  );

  return new;
exception when others then
  -- O aviso nunca pode impedir o agendamento
  raise warning 'notify_new_booking falhou: %', sqlerrm;
  return new;
end;
$$;
