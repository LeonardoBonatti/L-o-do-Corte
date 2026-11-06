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

export const S7Dashboard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const atendimentos = Math.round(
    interpolate(frame, [1 * fps, 2.4 * fps], [0, 6], {
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );

  const receita = interpolate(frame, [1.1 * fps, 2.6 * fps], [0, 285], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const clientes = Math.round(
    interpolate(frame, [1.2 * fps, 2.8 * fps], [0, 38], {
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );

  return (
    <AbsoluteFill name="Painel do barbeiro" style={{ fontFamily: inter }}>
      <Backdrop />
      <BrandCorner />

      <AbsoluteFill
        name="Conteúdo"
        style={{
          alignItems: "center",
          justifyContent: "center",
          padding: 150,
        }}
      >
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
          Painel do barbeiro
        </Interactive.Div>

        <Interactive.Div
          name="Título"
          style={{
            fontFamily: bebas,
            fontSize: 132,
            lineHeight: 1,
            letterSpacing: 3,
            color: "#f3f1ec",
            textAlign: "center",
            marginBottom: 64,
            whiteSpace: "nowrap",
            opacity: interpolate(frame, [0.15 * fps, 0.9 * fps], [0, 1], {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            translate: interpolate(
              frame,
              [0.15 * fps, 0.9 * fps],
              ["0px 40px", "0px 0px"],
              {
                easing: Easing.bezier(0.16, 1, 0.3, 1),
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              },
            ),
          }}
        >
          O dia inteiro <span style={{ color: "#d4af37" }}>numa tela só.</span>
        </Interactive.Div>

        <div style={{ display: "flex", gap: 34 }}>
          <Interactive.Div
            name="Indicador de atendimentos"
            style={{
              width: 440,
              padding: 44,
              borderRadius: 26,
              border: "1px solid #1e1e27",
              backgroundColor: "#121217",
              opacity: interpolate(frame, [0.8 * fps, 1.4 * fps], [0, 1], {
                easing: Easing.bezier(0.16, 1, 0.3, 1),
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              translate: interpolate(
                frame,
                [0.8 * fps, 1.4 * fps],
                ["0px 44px", "0px 0px"],
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
                fontSize: 30,
                letterSpacing: 5,
                textTransform: "uppercase",
                color: "#7d7a74",
                whiteSpace: "nowrap",
              }}
            >
              Hoje
            </div>
            <div
              style={{
                fontFamily: bebas,
                fontSize: 148,
                lineHeight: 1.08,
                color: "#d4af37",
                marginTop: 10,
              }}
            >
              {atendimentos}
            </div>
          </Interactive.Div>

          <Interactive.Div
            name="Indicador de receita"
            style={{
              width: 440,
              padding: 44,
              borderRadius: 26,
              border: "1px solid #1e1e27",
              backgroundColor: "#121217",
              opacity: interpolate(frame, [0.9 * fps, 1.5 * fps], [0, 1], {
                easing: Easing.bezier(0.16, 1, 0.3, 1),
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              translate: interpolate(
                frame,
                [0.9 * fps, 1.5 * fps],
                ["0px 44px", "0px 0px"],
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
                fontSize: 30,
                letterSpacing: 5,
                textTransform: "uppercase",
                color: "#7d7a74",
                whiteSpace: "nowrap",
              }}
            >
              Receita do dia
            </div>
            <div
              style={{
                fontFamily: bebas,
                fontSize: 104,
                lineHeight: 1.54,
                color: "#d4af37",
                marginTop: 10,
              }}
            >
              {receita.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </div>
          </Interactive.Div>

          <Interactive.Div
            name="Indicador de clientes"
            style={{
              width: 440,
              padding: 44,
              borderRadius: 26,
              border: "1px solid #1e1e27",
              backgroundColor: "#121217",
              opacity: interpolate(frame, [1 * fps, 1.6 * fps], [0, 1], {
                easing: Easing.bezier(0.16, 1, 0.3, 1),
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              translate: interpolate(
                frame,
                [1 * fps, 1.6 * fps],
                ["0px 44px", "0px 0px"],
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
                fontSize: 30,
                letterSpacing: 5,
                textTransform: "uppercase",
                color: "#7d7a74",
                whiteSpace: "nowrap",
              }}
            >
              Clientes
            </div>
            <div
              style={{
                fontFamily: bebas,
                fontSize: 148,
                lineHeight: 1.08,
                color: "#d4af37",
                marginTop: 10,
              }}
            >
              {clientes}
            </div>
          </Interactive.Div>
        </div>

        <Interactive.Div
          name="Conclusão"
          style={{
            fontSize: 48,
            color: "#b9b6ae",
            textAlign: "center",
            marginTop: 58,
            opacity: interpolate(frame, [3.4 * fps, 4 * fps], [0, 1], {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          Agenda, estoque, pedidos e promoções no mesmo lugar.
        </Interactive.Div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
