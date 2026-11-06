# Léo do Corte — aplicação web da barbearia

Aplicação web responsiva com autenticação, agendamento, catálogo de vestuário
com carrinho integrado ao WhatsApp e painel administrativo do barbeiro.

**Barbearia.** R. Olívio Saciloto, 25 — Jardim Brasil, Americana/SP, 13474-111 ·
(19) 99928-7339. Os dados ficam em *Ajustes* no painel do barbeiro e podem ser
trocados sem mexer no código.

**Front-end sem build** — HTML + CSS + JavaScript clássico, sem bundler — sobre
**Postgres na Vercel** com funções serverless em `/api`.

A agenda é compartilhada: o horário que a cliente marca no celular dela aparece
na agenda do barbeiro, e dois clientes não conseguem pegar o mesmo horário.
Como a app depende da API, **ela não abre mais por duplo clique no arquivo**.

---

## Como rodar

São três passos. Nada para instalar.

**1. Criar as tabelas.** Cole [db/setup.sql](db/setup.sql) inteiro no SQL
Editor do Neon e rode. Cria as tabelas e já insere serviços, produtos,
promoções e os dados da barbearia. Pode rodar de novo sem medo: nada é
duplicado e nada que o barbeiro editou no painel é sobrescrito.

**2. Uma variável na Vercel.** Em *Settings → Environment Variables*, marcando
*Production* **e** *Preview*:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Esse valor é o `AUTH_SECRET`, que assina o cookie de sessão. Sem ele o login
responde erro 500. Trocá-lo depois desloga todo mundo de uma vez.

A URL do banco já vem da integração do Neon ou do Vercel Postgres — o código
aceita `DATABASE_URL` e `POSTGRES_URL`, então não há nada a fazer aqui.

**3. A conta do barbeiro.** Crie pela própria tela **Criar conta** do site, com
a senha que quiser, e então rode uma linha no SQL Editor:

```sql
update users set role = 'admin' where lower(email) = 'seu@email.com';
```

No próximo login aparece o Painel do Barbeiro.

> **Nenhuma credencial vive no repositório.** A senha é gravada pela própria
> app como hash `scrypt` com salt, nunca em texto puro, e a tela de login não
> anuncia o acesso do barbeiro — ela é a área do cliente.

### Rodar local (opcional)

Só se você quiser mexer no back-end. Precisa da CLI da Vercel:

```bash
vercel env pull .env.development.local
npm install
npm run migrate    # mesmo SQL do passo 1, por linha de comando
vercel dev
```

---

## Estrutura

```
index.html
assets/
  css/styles.css        tokens de cor, componentes e responsividade
  js/store.js           cliente da API, cache em memória, consultas e utilitários
  js/discounts.js       motor de descontos (dia da semana + combo)
  js/auth.js            cadastro, login, sessão e tela de acesso
  js/booking.js         agendamento: serviço, dia, slots e confirmação
  js/shop.js            catálogo, carrinho e envio do pedido ao WhatsApp
  js/my-bookings.js     "Meus Agendamentos" (próximos, histórico, cancelamento)
  js/admin.js           painel do barbeiro (agenda, estoque, promoções, pedidos, ajustes)
  js/app.js             roteador por hash, navegação, home, modais e toasts
api/
  _db.js                pool do Postgres e transações
  _auth.js              hash scrypt da senha e cookie de sessão assinado
  _slots.js             regras de horário no servidor
  _shape.js             linha do banco -> formato que o cliente espera
  bootstrap.js          GET: tudo que a app precisa, filtrado por papel
  auth/                 register, login, logout, me
  appointments/         criar, remarcar, cancelar
  products/, rules/     CRUD do painel
  orders.js, settings.js
db/
  setup.sql             tabelas + dados iniciais, numa colagem só
scripts/
  migrate.mjs           roda o setup.sql por linha de comando (opcional)
  hash-password.mjs     gera um hash de senha, se precisar criar admin por SQL
apresentacao.html       apresentação animada (arquivo único, toca no navegador)
motion/                 projeto Remotion que gera o vídeo .mp4 da apresentação
```

Os scripts do front são carregados na ordem acima e cada um publica seu módulo
em `window.App`. Não há `type="module"` nem bundler: os arquivos vão para o
navegador como estão.

### Dados

O banco é a fonte de verdade. A app busca tudo numa chamada a
`GET /api/bootstrap` no carregamento e guarda em memória — é isso que permite
manter as leituras síncronas espalhadas pelas telas (`store.get()`,
`slotAvailability()`…) sem reescrever o código de renderização. Só as escritas
são assíncronas. Ao voltar para a aba, a app rebusca, porque outra pessoa pode
ter reservado um horário nesse meio-tempo.

**A resposta é filtrada por papel.** Cliente recebe os próprios agendamentos e
pedidos por inteiro; os de terceiros chegam apenas como "slot ocupado", sem
nome, telefone, serviço ou valor. O barbeiro recebe tudo, mais a lista de
clientes. Hash de senha não sai do servidor em nenhum caso.

A única exceção é o **carrinho**, que continua no `localStorage` em
`leodocorte.v1.cart.<usuário>`: é rascunho por navegador, e migra para a conta
no login. Não segue o cliente entre aparelhos.

### Por que dois clientes não pegam o mesmo horário

A tabela `appointment_slots` tem uma linha por slot de 30 min ocupado, com
`(data, hora)` como chave primária. O agendamento e os seus slots nascem na
mesma transação — um serviço de 45 min grava **dois** slots, o escolhido e o
seguinte. Se outra pessoa chegou primeiro, o insert viola a chave e a transação
inteira é desfeita.

A grade que aparece na tela é só exibição e pode estar segundos atrasada. Quem
decide é o banco, mais a validação em `api/_slots.js` — um cliente que adultere
o JavaScript não contorna nenhum dos dois.

---

## Módulos

### Autenticação

Dois perfis: **cliente** e **barbeiro (admin)**. Login é obrigatório para
confirmar um agendamento e para enviar um pedido de vestuário — ao tentar sem
estar logado, a aplicação guarda o destino, leva à tela de acesso e devolve o
usuário ao ponto onde parou. O carrinho montado antes do login é migrado para a
conta.

### Agendamento

- Serviços: Corte R$ 40 (30 min), Corte + Sobrancelha R$ 45 (30 min),
  Corte + Barba R$ 60 (45 min).
- Expediente 10:00–19:00, slots de 30 minutos (10:00 … 18:30). Domingo fechado
  (configurável em *Ajustes*).
- **Serviço de 45 min ocupa dois slots** — o escolhido e o seguinte. Por isso
  18:30 fica indisponível para Corte + Barba (terminaria depois das 19h), e um
  horário vizinho já reservado bloqueia o slot anterior.
- Horários ocupados, passados ou em dia fechado aparecem riscados, com o motivo
  no `title`.
- O slot é revalidado no momento de confirmar, caso tenha sido tomado enquanto a
  tela estava aberta.

### Meus Agendamentos

Abas **Próximos** e **Histórico**, com totais do cliente. Agendamentos futuros
podem ser cancelados com confirmação; o horário volta a ficar livre na agenda.

### Vestuário

Grade de produtos com foto, descrição, tamanhos e estoque por tamanho. Tamanho
esgotado não é selecionável e o carrinho respeita o estoque disponível.

Não há pagamento online: **Finalizar pedido no WhatsApp** abre o
`wa.me` do barbeiro com o resumo já formatado (itens, tamanhos, quantidades,
promoções, total e o próximo horário marcado do cliente, se houver). O pedido
fica registrado na aba *Pedidos* do painel.

### Contato e localização

Em todas as páginas há um **botão flutuante de WhatsApp** que abre a conversa
com o barbeiro já com uma mensagem pronta ("Vim pelo site…"). Ele não aparece
quando o próprio barbeiro está logado.

O rodapé e o bloco *Onde estamos* da home mostram o endereço e o telefone, e
tanto o endereço quanto o botão **Obter rota** abrem a rota no Google Maps —
`maps/dir/?api=1&destination=<endereço>`, que no celular cai no app de mapas.

Tudo sai de *Ajustes*: trocar o endereço ou o WhatsApp no painel muda os links
na hora, sem tocar no código.

### Painel do barbeiro

- **Agenda** — visão de dia ou semana, navegação por data, com cancelar,
  remarcar (valida a disponibilidade da nova data/hora para a duração do
  serviço) e atalho de WhatsApp para o cliente.
- **Estoque** — cadastrar, editar, publicar/ocultar e excluir produtos;
  atualização rápida de quantidades por tamanho.
- **Promoções** — regras por dia da semana e regras de combo.
- **Pedidos** — histórico dos carrinhos enviados ao WhatsApp.
- **Ajustes** — nome, WhatsApp, endereço, horário de funcionamento, dias
  fechados e restauração dos dados.

---

## Motor de descontos

Duas famílias de regra, ambas criadas e editadas no painel:

**1. Dia da semana** — `{ weekday, percent, scope, serviceId }`

| `scope` | Incide sobre |
| --- | --- |
| `servicos` | todos os serviços |
| `servico` | apenas o serviço indicado em `serviceId` |
| `produtos` | apenas o vestuário |
| `total` | serviço + vestuário |

Seed: *Quarta do Corte* — toda quarta-feira, 10% nos serviços.

**2. Combo (cross-selling)** — `{ minServices, minProducts, percent }`

Dispara quando o contexto tem pelo menos N serviços **e** N peças; o percentual
incide sobre o total. Seed: *Corte + Peça de Vestuário* — 1 serviço + 1 peça,
5% no total.

**Acúmulo.** Cada regra calcula o desconto sobre a própria base e os valores são
**somados** (não compostos), limitados ao subtotal. Cada desconto é rateado
entre serviço e produtos na proporção da base que o originou — assim o
agendamento guarda a parte dele e o pedido do WhatsApp a sua.

A aplicação é automática: o resumo do agendamento e o carrinho mostram cada
regra pelo nome, o percentual e o valor abatido. Dias promocionais aparecem com
um ponto dourado no seletor de data.

---

## Decisões e limites

- **Depende da API.** Sem banco a app não abre: mostra "não conseguimos
  carregar a agenda" e um botão de tentar de novo. Não existe modo offline,
  justamente para ninguém marcar horário num banco de mentira achando que o
  recado chegou.
- **Descontos são calculados no cliente.** O servidor grava o preço base do
  serviço vindo do banco e limita o desconto ao intervalo possível, então não
  nasce agendamento de valor negativo — mas o percentual em si vem da tela. Em
  pedidos de vestuário o servidor recalcula o subtotal pelos preços do banco.
  Como o pagamento é combinado pessoalmente, nenhum dinheiro depende disso.
- **Uma cadeira, um barbeiro.** O bloqueio por slot assume um único
  atendimento simultâneo; atender dois clientes ao mesmo tempo exigiria
  repensar `appointment_slots`.
- **Estoque não é baixado no checkout.** Como a venda é negociada no WhatsApp e
  a retirada é na loja, o barbeiro ajusta a quantidade no painel quando a venda
  se concretiza.
- **Imagens por URL.** Produtos usam URL de foto (seed aponta para o Unsplash);
  se a imagem não carregar, o card cai no espaço reservado da loja.
- **Verificação.** Os fluxos foram exercitados em navegador na versão anterior,
  que guardava tudo no `localStorage`: cadastro, agendamento de 45 min com
  18:30 indisponível, persistência após sair e voltar, agenda do barbeiro,
  carrinho e pedido no WhatsApp, e remarcação pelo painel.
  **Nada disso foi reexecutado contra o Postgres** — esta versão passou só por
  `node --check`. Antes de apontar cliente para cá, repita os fluxos no preview
  deploy e teste em especial duas sessões disputando o mesmo horário, que é o
  caminho novo.

---

## Material de apresentação

Duas peças para mostrar o sistema a um cliente, com o mesmo roteiro de 9 cenas:

| Arquivo | O que é | Quando usar |
| --- | --- | --- |
| `apresentacao.html` | Animação autocontida que toca no navegador, com tela cheia e navegação por teclado | Apresentar ao vivo, mandar o arquivo por e-mail |
| `motion/` | Projeto Remotion que renderiza `out/LeoDoCorte.mp4` (1920×1080, 30fps, 50,8s) | Mandar vídeo por WhatsApp, subir em rede social |

O vídeo é uma versão redesenhada, não uma gravação da página: em vídeo o texto
precisa ser muito maior, então cada cena carrega bem menos conteúdo. Detalhes e
comandos em [motion/README.md](motion/README.md).
