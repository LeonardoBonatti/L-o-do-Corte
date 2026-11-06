# Leo do Corte — aplicação web da barbearia

Aplicação web responsiva com autenticação, agendamento, catálogo de vestuário
com carrinho integrado ao WhatsApp e painel administrativo do barbeiro.

**Sem build, sem dependências, sem servidor.** HTML + CSS + JavaScript clássico.
Basta abrir `index.html` no navegador (duplo clique funciona).

---

## Como rodar

Abra `index.html` no Chrome, Edge ou Firefox.

Se preferir servir por HTTP (opcional — não é necessário):

```bash
npx --yes serve .
```

### Contas

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Barbeiro (admin) | `leo@leodocorte.com` | `leo123` |
| Cliente | crie pela tela **Criar conta** | — |

> São credenciais de demonstração, gravadas em texto puro no seed. Em produção,
> troque por um backend com hash de senha.

---

## Estrutura

```
index.html
assets/
  css/styles.css        tokens de cor, componentes e responsividade
  js/store.js           persistência (localStorage), seed, consultas e utilitários
  js/discounts.js       motor de descontos (dia da semana + combo)
  js/auth.js            cadastro, login, sessão e tela de acesso
  js/booking.js         agendamento: serviço, dia, slots e confirmação
  js/shop.js            catálogo, carrinho e envio do pedido ao WhatsApp
  js/my-bookings.js     "Meus Agendamentos" (próximos, histórico, cancelamento)
  js/admin.js           painel do barbeiro (agenda, estoque, promoções, pedidos, ajustes)
  js/app.js             roteador por hash, navegação, home, modais e toasts
apresentacao.html       apresentação animada (arquivo único, toca no navegador)
motion/                 projeto Remotion que gera o vídeo .mp4 da apresentação
```

Os scripts são carregados na ordem acima e cada um publica seu módulo em
`window.App`. Não há `type="module"`, justamente para que a aplicação funcione
abrindo o arquivo direto do disco (`file://`).

### Dados

Tudo vive no `localStorage` do navegador, na chave `leodocorte.v1`
(carrinho em `leodocorte.v1.cart.<usuário>`). Limpar os dados do site apaga
agendamentos, clientes, produtos e regras. O painel tem o botão
**Restaurar dados de demonstração** em *Ajustes*.

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

- **Sem backend.** Os dados são locais ao navegador e não sincronizam entre
  dispositivos. Para produção, o próximo passo natural é trocar `store.js` por
  chamadas a uma API — a interface já está isolada atrás dele.
- **Estoque não é baixado no checkout.** Como a venda é negociada no WhatsApp e
  a retirada é na loja, o barbeiro ajusta a quantidade no painel quando a venda
  se concretiza.
- **Um atendimento por vez.** A agenda assume um único barbeiro; não há recurso
  de múltiplas cadeiras.
- **Imagens por URL.** Produtos usam URL de foto (seed aponta para o Unsplash);
  se a imagem não carregar, o card cai no espaço reservado da loja.
- **Verificação.** O código foi revisado estaticamente, mas não foi executado em
  navegador nesta sessão — convém clicar pelos fluxos principais na primeira
  abertura.

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
