# Motion — apresentação em vídeo do Leo do Corte

Projeto [Remotion](https://remotion.dev) que gera o vídeo de apresentação do
sistema da barbearia. 1920×1080, 30fps, 1524 frames (**50,8s**).

Saída: `out/LeoDoCorte.mp4`

---

## Comandos

Pré-visualizar no Studio (abre o navegador, permite editar e ver na hora):

```bash
npm run dev
```

Renderizar o vídeo final:

```bash
npx remotion render LeoDoCorte out/LeoDoCorte.mp4
```

Renderizar só alguns frames como imagem, para conferir rápido:

```bash
npx remotion render LeoDoCorte out/frames --frames=100,440,1000 --image-format=png
```

Renderizar uma cena isolada (útil ao ajustar uma só):

```bash
npx remotion render S3-Agendamento out/s3.mp4
```

---

## Estrutura

```
src/
  Root.tsx          registra as composições (o vídeo + cada cena isolada)
  LeoDoCorte.tsx    monta as 9 cenas em TransitionSeries, com fades de 12 frames
  Backdrop.tsx      fundo escuro com brilho dourado + assinatura de canto
  fonts.ts          Bebas Neue (títulos) e Inter (texto), via @remotion/google-fonts
  scenes/
    S1Opening.tsx     Abertura — logo e proposta           120 frames
    S2Problem.tsx     O problema — caderno, WhatsApp...    150
    S3Booking.tsx     Agendamento — grade de horários      240
    S4Rule.tsx        Regra dos 45 min — dois slots        180
    S5Cancel.tsx      Cancelamento — a vaga reabre         150
    S6Shop.tsx        Vestuário — pedido no WhatsApp       255
    S7Dashboard.tsx   Painel — indicadores do dia          210
    S8Promos.tsx      Promoções — R$ 40 vira R$ 36         180
    S9Closing.tsx     Fecho — marca e selo                 135
```

Cada cena também está registrada como composição própria (pasta **Cenas** no
Studio), então dá para abrir, editar e renderizar uma isolada.

### Contagem de duração

9 cenas somam 1620 frames. As 8 transições de 12 frames sobrepõem as cenas
vizinhas, encurtando 96 frames: `1620 − 96 = 1524`. Ao mudar a duração de
qualquer cena, ajuste `durationInFrames` da composição `LeoDoCorte` no
`Root.tsx` pela mesma conta.

---

## Como editar

As animações são dirigidas por `useCurrentFrame()` + `interpolate()`, com as
chamadas inline no `style` — é o formato que o Remotion Studio reconhece, então
dá para arrastar keyframes e mexer em cores direto na interface e isso volta
para o código.

CSS `animation` e `transition` **não** funcionam em render e não devem ser
usados aqui.

### Armadilha: conteúdo some atrás do fundo

Cada cena tem esta forma, e a ordem importa:

```tsx
<AbsoluteFill name="Cena">
  <Backdrop />
  <BrandCorner />
  <AbsoluteFill name="Conteúdo" style={{ /* layout */ }}>…</AbsoluteFill>
</AbsoluteFill>
```

`Backdrop` é um `AbsoluteFill`, ou seja, `position: absolute` — e elementos
posicionados são pintados **acima** de conteúdo em fluxo normal, não importa a
ordem no DOM. Se o conteúdo da cena for filho direto da raiz, ele fica atrás do
fundo opaco e **desaparece**.

O detalhe cruel: um elemento com `translate`, `scale` ou `opacity` menor que 1
cria contexto de empilhamento e escapa do problema. Então um texto que faz
fade-in aparece normalmente durante a animação e **some no frame em que a
opacidade chega a 1**. Foi exatamente o que aconteceu com os sobretítulos e as
linhas de conclusão na primeira versão.

Por isso o conteúdo vai sempre dentro do `AbsoluteFill` "Conteúdo", que é
posicionado e pinta acima do fundo. Ao criar uma cena nova, mantenha essa
estrutura.

Exceção consciente: as grades de horários (S3) e da régua (S4) são geradas com
`.map()`, e o atraso de cada item depende do índice. O Studio não consegue
editar esses keyframes pela interface — para mudar o escalonamento, altere o
multiplicador no código (`i * 3` em S3, `i * 4` em S4).

---

## Texto grande de propósito

As regras de layout para vídeo pedem, numa composição de 1920px: título a
partir de ~150px e texto de apoio a partir de ~78px. Por isso as cenas têm
muito menos conteúdo que a versão web (`../apresentacao.html`) — num vídeo o
espectador não tem tempo nem resolução para ler uma tela cheia de interface.

---

## Licença do Remotion

O Remotion é gratuito para indivíduos e times pequenos, mas **algumas empresas
precisam de licença paga**. Como esse vídeo é material comercial para um
cliente, vale conferir os termos antes de publicar:
<https://github.com/remotion-dev/remotion/blob/main/LICENSE.md>
