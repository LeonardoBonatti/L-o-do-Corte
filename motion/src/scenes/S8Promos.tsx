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

export const S8Promos: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill name="Promoções" style={{ fontFamily: inter }}>
      <Backdrop />
      <BrandCorner />

      <AbsoluteFill
        name="Conteúdo"
        style={{
          alignItems: "center",
          justifyContent: "center",
          padding: 140,
        }}
      >
        <Interactive.Div
          name="Título"
          style={{
            fontFamily: bebas,
            fontSize: 100,
            lineHeight: 1,
            letterSpacing: 3,
            color: "#f3f1ec",
            textAlign: "center",
            marginBottom: 56,
            whiteSpace: "nowrap",
            opacity: interpolate(frame, [0, 0.8 * fps], [0, 1], {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            translate: interpolate(
              frame,
              [0, 0.8 * fps],
              ["0px 40px", "0px 0px"],
              {
                easing: Easing.bezier(0.16, 1, 0.3, 1),
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              },
            ),
          }}
        >
          Você cria a regra.
          <span style={{ color: "#d4af37" }}> O sistema aplica.</span>
        </Interactive.Div>

        <div style={{ display: "flex", gap: 34, marginBottom: 64 }}>
          <Interactive.Div
            name="Promoção por dia"
            style={{
              width: 680,
              padding: 42,
              borderRadius: 26,
              border: "1px dashed rgba(212,175,55,0.45)",
              backgroundColor: "rgba(212,175,55,0.14)",
              opacity: interpolate(frame, [0.8 * fps, 1.4 * fps], [0, 1], {
                easing: Easing.bezier(0.16, 1, 0.3, 1),
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              translate: interpolate(
                frame,
                [0.8 * fps, 1.4 * fps],
                ["-44px 0px", "0px 0px"],
                {
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                },
              ),
            }}
          >
            <div style={{ fontFamily: bebas, fontSize: 62, color: "#e7c967" }}>
              Quarta do Corte
            </div>
            <div style={{ fontSize: 40, color: "#b9b6ae", marginTop: 10 }}>
              Toda quarta, 10% nos serviços.
            </div>
          </Interactive.Div>

          <Interactive.Div
            name="Promoção combo"
            style={{
              width: 680,
              padding: 42,
              borderRadius: 26,
              border: "1px dashed rgba(212,175,55,0.45)",
              backgroundColor: "rgba(212,175,55,0.14)",
              opacity: interpolate(frame, [1 * fps, 1.6 * fps], [0, 1], {
                easing: Easing.bezier(0.16, 1, 0.3, 1),
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              translate: interpolate(
                frame,
                [1 * fps, 1.6 * fps],
                ["44px 0px", "0px 0px"],
                {
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                },
              ),
            }}
          >
            <div style={{ fontFamily: bebas, fontSize: 62, color: "#e7c967" }}>
              Corte + Peça
            </div>
            <div style={{ fontSize: 40, color: "#b9b6ae", marginTop: 10 }}>
              1 serviço + 1 peça, 5% no total.
            </div>
          </Interactive.Div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 40,
          }}
        >
          <Interactive.Div
            name="Preço cheio"
            style={{
              fontSize: 58,
              fontWeight: 600,
              color: "#7d7a74",
              textDecoration: "line-through",
              opacity: interpolate(frame, [2.1 * fps, 2.6 * fps], [0, 1], {
                easing: Easing.bezier(0.16, 1, 0.3, 1),
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            R$ 40,00
          </Interactive.Div>

          <Interactive.Div
            name="Seta"
            style={{
              fontSize: 58,
              color: "#d4af37",
              opacity: interpolate(frame, [2.4 * fps, 2.8 * fps], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            ›
          </Interactive.Div>

          <Interactive.Div
            name="Preço com desconto"
            style={{
              fontFamily: bebas,
              fontSize: 150,
              lineHeight: 1,
              letterSpacing: 2,
              color: "#d4af37",
              opacity: interpolate(frame, [2.6 * fps, 3.1 * fps], [0, 1], {
                easing: Easing.bezier(0.16, 1, 0.3, 1),
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              scale: interpolate(frame, [2.6 * fps, 3.1 * fps], [0.82, 1], {
                easing: Easing.bezier(0.16, 1, 0.3, 1),
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                output: "perceptual-scale",
              }),
            }}
          >
            R$ 36,00
          </Interactive.Div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
