-- ============================================================
-- Léo do Corte — cria o banco inteiro.
--
-- COMO USAR: cole este arquivo todo no SQL Editor do Neon e rode. Uma vez.
--
-- Pode rodar de novo sem medo: as tabelas são `if not exists` e os dados
-- iniciais são `on conflict do nothing`, então nada é duplicado e nada que
-- o barbeiro editou no painel é sobrescrito.
--
-- Depois disso a app salva tudo aqui: agendamentos, pedidos, valor vendido,
-- estoque, promoções e os ajustes da barbearia.
--
-- `desc` é palavra reservada em SQL, por isso a coluna se chama `descr`.
-- ============================================================


-- ------------------------------------------------------------
-- TABELAS
-- ------------------------------------------------------------

create table if not exists users (
  id            text primary key,
  name          text        not null,
  email         text        not null,
  phone         text        not null default '',
  password_hash text        not null,
  role          text        not null default 'cliente'
                            check (role in ('cliente', 'admin')),
  created_at    timestamptz not null default now()
);

-- E-mail único ignorando caixa: o login normaliza para minúsculas.
create unique index if not exists users_email_key on users (lower(email));

create table if not exists services (
  id       text          primary key,
  name     text          not null,
  price    numeric(10,2) not null check (price >= 0),
  duration integer       not null check (duration > 0),
  descr    text          not null default '',
  sort     integer       not null default 0
);

create table if not exists products (
  id     text          primary key,
  title  text          not null,
  price  numeric(10,2) not null check (price >= 0),
  active boolean       not null default true,
  image  text          not null default '',
  descr  text          not null default '',
  sort   integer       not null default 0
);

create table if not exists product_sizes (
  product_id text    not null references products (id) on delete cascade,
  size       text    not null,
  qty        integer not null default 0 check (qty >= 0),
  sort       integer not null default 0,
  primary key (product_id, size)
);

create table if not exists appointments (
  id            text          primary key,
  user_id       text          not null references users (id) on delete cascade,
  service_id    text          not null references services (id),
  service_name  text          not null,
  duration      integer       not null check (duration > 0),
  slot_date     date          not null,
  slot_time     text          not null,
  price_base    numeric(10,2) not null,
  discount      numeric(10,2) not null default 0,
  price_final   numeric(10,2) not null,
  applied_rules jsonb         not null default '[]'::jsonb,
  status        text          not null default 'confirmado'
                              check (status in ('confirmado', 'cancelado')),
  created_at    timestamptz   not null default now()
);

create index if not exists appointments_date_idx on appointments (slot_date);
create index if not exists appointments_user_idx on appointments (user_id);

-- ------------------------------------------------------------
-- A garantia contra agendamento duplo.
--
-- Uma linha por slot de 30 min ocupado, com data e hora como chave
-- primária. Um serviço de 45 min grava DOIS slots (o escolhido e o
-- seguinte). Se um segundo cliente tentar qualquer um deles, o insert
-- viola a chave e a transação inteira é desfeita.
--
-- É isto que torna a regra confiável: ela vive no banco, não na tela.
-- ------------------------------------------------------------
create table if not exists appointment_slots (
  slot_date      date not null,
  slot_time      text not null,
  appointment_id text not null references appointments (id) on delete cascade,
  primary key (slot_date, slot_time)
);

create index if not exists appointment_slots_appointment_idx
  on appointment_slots (appointment_id);

-- Vendas: um pedido por carrinho enviado ao WhatsApp.
create table if not exists orders (
  id         text          primary key,
  user_id    text          not null references users (id) on delete cascade,
  user_name  text          not null,
  subtotal   numeric(10,2) not null,
  discount   numeric(10,2) not null default 0,
  total      numeric(10,2) not null,
  status     text          not null default 'enviado',
  created_at timestamptz   not null default now()
);

create index if not exists orders_user_idx on orders (user_id);

create table if not exists order_items (
  id         bigserial     primary key,
  order_id   text          not null references orders (id) on delete cascade,
  product_id text          not null,
  title      text          not null,
  size       text          not null,
  qty        integer       not null check (qty > 0),
  unit_price numeric(10,2) not null
);

create index if not exists order_items_order_idx on order_items (order_id);

create table if not exists weekday_rules (
  id         text         primary key,
  label      text         not null,
  weekday    integer      not null check (weekday between 0 and 6),
  percent    numeric(5,2) not null check (percent > 0 and percent <= 100),
  scope      text         not null
                          check (scope in ('servicos', 'servico', 'produtos', 'total')),
  service_id text         references services (id) on delete set null,
  active     boolean      not null default true
);

create table if not exists combo_rules (
  id           text         primary key,
  label        text         not null,
  min_services integer      not null default 1 check (min_services >= 0),
  min_products integer      not null default 1 check (min_products >= 0),
  percent      numeric(5,2) not null check (percent > 0 and percent <= 100),
  active       boolean      not null default true
);

-- Linha única: o check no id impede uma segunda.
create table if not exists settings (
  id              integer   primary key default 1 check (id = 1),
  shop_name       text      not null,
  whatsapp        text      not null,
  address         text      not null default '',
  open_time       text      not null default '10:00',
  close_time      text      not null default '19:00',
  slot_minutes    integer   not null default 30,
  closed_weekdays integer[] not null default '{0}'
);

-- Sessões ficam em cookie assinado, sem tabela. Para invalidar todas de uma
-- vez, troque o AUTH_SECRET nas variáveis de ambiente da Vercel.


-- ------------------------------------------------------------
-- DADOS INICIAIS
-- ------------------------------------------------------------

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
  ('svc_corte',       'Corte',               40.00, 30, 'Máquina, tesoura e finalização.',           1),
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


-- ------------------------------------------------------------
-- E a conta do barbeiro?
--
-- Não precisa de SQL nem de gerar hash. Crie a conta pela própria tela
-- "Criar conta" do site, com a senha que você quiser — a app grava o hash
-- sozinha. Depois rode esta linha UMA vez, trocando o e-mail:
--
--   update users set role = 'admin' where lower(email) = 'seu@email.com';
--
-- Pronto: no próximo login aparece o Painel do Barbeiro.
-- ------------------------------------------------------------
