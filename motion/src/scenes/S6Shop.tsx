import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Backdrop, BrandCorner } from "../Backdrop";
import { bebas, inter } from "../fonts";

/* Sem os asteriscos do WhatsApp: na conversa real eles viram negrito,
   mostrá-los cru pareceria defeito. */
const MESSAGE = `Pedido — Leo do Corte

1x Camiseta Oversized (M) · R$ 89,90
1x Boné Aba Curva (Único) · R$ 69,90

Subtotal: R$ 159,80
Combo Corte + Peça (5%): −R$ 7,99
Total: R$ 151,81`;

export const S6Shop: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const typed = MESSAGE.slice(
    0,
    Math.round(
      interpolate(frame, [2 * fps, 6 * fps], [0, MESSAGE.length], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    ),
  );

  return (
    <AbsoluteFill name="Vestuário" style={{ fontFamily: inter }}>
      <Backdrop />
      <BrandCorner />

      <AbsoluteFill
        name="Conteúdo"
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 150,
          gap: 90,
        }}
      >
        <div style={{ flex: 1 }}>
          <Interactive.Div
            name="Sobretítulo"
            style={{
              fontSize: 36,
              fontWeight: 600,
              letterSpacing: 12,
              textTransform: "uppercase",
              color: "#d4af37",
              marginBottom: 24,
              opacity: interpolate(frame, [0, 0.6 * fps], [0, 1], {
                easing: Easing.bezier(0.16, 1, 0.3, 1),
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            Vestuário
          </Interactive.Div>

          <Interactive.Div
            name="Título"
            style={{
              fontFamily: bebas,
              fontSize: 124,
              lineHeight: 0.96,
              letterSpacing: 3,
              color: "#f3f1ec",
              marginBottom: 36,
              opacity: interpolate(frame, [0.15 * fps, 0.9 * fps], [0, 1], {
                easing: Easing.bezier(0.16, 1, 0.3, 1),
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              translate: interpolate(
                frame,
                [0.15 * fps, 0.9 * fps],
                ["-50px 0px", "0px 0px"],
                {
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                },
              ),
            }}
          >
            A loja dentro
            <br />
            do <span style={{ color: "#d4af37" }}>agendamento.</span>
          </Interactive.Div>

          <Interactive.Div
            name="Apoio"
            style={{
              fontSize: 44,
              lineHeight: 1.5,
              color: "#b9b6ae",
              maxWidth: 640,
              opacity: interpolate(frame, [0.7 * fps, 1.4 * fps], [0, 1], {
                easing: Easing.bezier(0.16, 1, 0.3, 1),
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            Sem pagamento online. O pedido chega no seu WhatsApp já formatado,
            com tamanhos, totais e promoções aplicadas.
          </Interactive.Div>
        </div>

        <Interactive.Div
          name="Conversa do WhatsApp"
          style={{
            width: 880,
            borderRadius: 30,
            border: "1px solid #2a2a35",
            backgroundColor: "#0b141a",
            overflow: "hidden",
            opacity: interpolate(frame, [0.9 * fps, 1.6 * fps], [0, 1], {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            translate: interpolate(
              frame,
              [0.9 * fps, 1.6 * fps],
              ["56px 0px", "0px 0px"],
              {
                easing: Easing.bezier(0.16, 1, 0.3, 1),
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              },
            ),
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              padding: 26,
              backgroundColor: "#1f2c33",
            }}
          >
            <div
              style={{
                width: 62,
                height: 62,
                borderRadius: 999,
                backgroundColor: "#1fa855",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: bebas,
                fontSize: 40,
                color: "#ffffff",
                paddingTop: 4,
              }}
            >
              L
            </div>
            <div>
              <div style={{ fontSize: 36, fontWeight: 700, color: "#f3f1ec" }}>
                Leo do Corte
              </div>
              <div style={{ fontSize: 26, color: "#8fa3ad" }}>online</div>
            </div>
          </div>

          <div
            style={{
              padding: 32,
              minHeight: 520,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
            }}
          >
            <div
              style={{
                alignSelf: "flex-end",
                maxWidth: "96%",
                padding: 28,
                borderRadius: "22px 22px 6px 22px",
                backgroundColor: "#005c4b",
                fontSize: 31,
                lineHeight: 1.6,
                color: "#f3f1ec",
                whiteSpace: "pre-wrap",
              }}
            >
              {typed}
              <span
                style={{
                  display: "inline-block",
                  width: 3,
                  height: 28,
                  marginLeft: 3,
                  verticalAlign: -4,
                  backgroundColor: "#ffffff",
                  opacity: interpolate(frame, [6 * fps, 6.3 * fps], [1, 0], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }),
                }}
              />
              <span
                style={{
                  display: "block",
                  textAlign: "right",
                  fontSize: 24,
                  color: "rgba(255,255,255,0.55)",
                  marginTop: 12,
                }}
              >
                agora ✓✓
              </span>
            </div>
          </div>
        </Interactive.Div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
