-- ============================================================
-- Léo do Corte — schema do Postgres
-- Idempotente: pode rodar de novo sem quebrar nada.
-- `desc` é palavra reservada em SQL, então a coluna é `descr`.
-- ============================================================

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

-- E-mail é único ignorando caixa: o login normaliza para minúsculas.
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
-- Uma linha por slot de 30 min ocupado, com a data e a hora como chave
-- primária. Um serviço de 45 min grava DOIS slots (o escolhido e o seguinte),
-- exatamente como occupiedStarts() faz no cliente. Se um segundo cliente tentar
-- qualquer um desses horários, o insert viola a chave primária e a transação
-- inteira é desfeita — o agendamento não nasce.
--
-- É isso que torna a regra confiável: ela vive no banco, não na tela.
-- ------------------------------------------------------------
create table if not exists appointment_slots (
  slot_date      date not null,
  slot_time      text not null,
  appointment_id text not null references appointments (id) on delete cascade,
  primary key (slot_date, slot_time)
);

create index if not exists appointment_slots_appointment_idx
  on appointment_slots (appointment_id);

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
  id         text    primary key,
  label      text    not null,
  weekday    integer not null check (weekday between 0 and 6),
  percent    numeric(5,2) not null check (percent > 0 and percent <= 100),
  scope      text    not null
                     check (scope in ('servicos', 'servico', 'produtos', 'total')),
  service_id text    references services (id) on delete set null,
  active     boolean not null default true
);

create table if not exists combo_rules (
  id           text    primary key,
  label        text    not null,
  min_services integer not null default 1 check (min_services >= 0),
  min_products integer not null default 1 check (min_products >= 0),
  percent      numeric(5,2) not null check (percent > 0 and percent <= 100),
  active       boolean not null default true
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
-- vez, troque o AUTH_SECRET nas variáveis de ambiente.
