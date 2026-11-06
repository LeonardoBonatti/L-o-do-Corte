-- ============================================================
-- Léo do Corte — dados iniciais
-- Idempotente: `on conflict do nothing` em tudo, então rodar de novo não
-- duplica nem sobrescreve o que o barbeiro já editou no painel.
--
-- O usuário admin NÃO está aqui de propósito: ele é criado pelo
-- scripts/migrate.mjs a partir de ADMIN_EMAIL e ADMIN_PASSWORD_HASH, para
-- que nenhuma credencial viva no repositório.
-- ============================================================

insert into settings (id, shop_name, whatsapp, address, open_time, close_time, slot_minutes, closed_weekdays)
values (
  1,
  'Léo do Corte',
  '5519999287339',
  'R. Olívio Saciloto, 25 - Jardim Brasil, Americana - SP, 13474-111',
  '10:00',
  '19:00',
  30,
  '{0}'
)
on conflict (id) do nothing;

insert into services (id, name, price, duration, descr, sort) values
  ('svc_corte',       'Corte',               40.00, 30, 'Máquina, tesoura e finalização.',          1),
  ('svc_corte_sobr',  'Corte + Sobrancelha', 45.00, 30, 'Corte completo com design de sobrancelha.', 2),
  ('svc_corte_barba', 'Corte + Barba',       60.00, 45, 'Corte, barba na navalha e toalha quente.',  3)
on conflict (id) do nothing;

insert into products (id, title, price, active, image, descr, sort) values
  ('p_1', 'Camiseta Oversized Preta',  89.90, true,
   'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=70',
   'Algodão pesado, caimento oversized.', 1),
  ('p_2', 'Camisa Social Chumbo',     139.90, true,
   'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=70',
   'Tecido acetinado, manga longa.', 2),
  ('p_3', 'Short Sarja Masculino',     99.90, true,
   'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=800&q=70',
   'Sarja com elastano, bolso traseiro.', 3),
  ('p_4', 'Boné Aba Curva Dourado',    69.90, true,
   'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=70',
   'Bordado Léo do Corte em fio dourado.', 4),
  ('p_5', 'Moletom Capuz Grafite',    179.90, true,
   'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=70',
   'Moletom flanelado, bolso canguru.', 5),
  ('p_6', 'Pomada Modeladora Matte',   49.90, true,
   'https://images.unsplash.com/photo-1626808642875-0aa545482dfb?auto=format&fit=crop&w=800&q=70',
   'Fixação forte, efeito seco. 120g.', 6)
on conflict (id) do nothing;

insert into product_sizes (product_id, size, qty, sort) values
  ('p_1', 'P',     4, 1), ('p_1', 'M',  6, 2), ('p_1', 'G',  5, 3), ('p_1', 'GG', 2, 4),
  ('p_2', 'M',     3, 1), ('p_2', 'G',  3, 2), ('p_2', 'GG', 1, 3),
  ('p_3', '38',    2, 1), ('p_3', '40', 4, 2), ('p_3', '42', 4, 3), ('p_3', '44', 0, 4),
  ('p_4', 'Único', 9, 1),
  ('p_5', 'M',     2, 1), ('p_5', 'G',  3, 2), ('p_5', 'GG', 2, 3),
  ('p_6', '120g', 12, 1)
on conflict (product_id, size) do nothing;

insert into weekday_rules (id, label, weekday, percent, scope, service_id, active) values
  ('wd_1', 'Quarta do Corte', 3, 10.00, 'servicos', null, true)
on conflict (id) do nothing;

insert into combo_rules (id, label, min_services, min_products, percent, active) values
  ('cb_1', 'Corte + Peça de Vestuário', 1, 1, 5.00, true)
on conflict (id) do nothing;
