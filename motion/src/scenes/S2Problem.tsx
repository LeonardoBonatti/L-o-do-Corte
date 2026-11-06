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

const PAINS = [
  ["01", "Agenda no caderno"],
  ["02", "WhatsApp lotado de “tem horário?”"],
  ["03", "Estoque no escuro"],
];

export const S2Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill name="O problema" style={{ fontFamily: inter }}>
      <Backdrop />
      <BrandCorner />

      <AbsoluteFill
        name="Conteúdo"
        style={{ justifyContent: "center", padding: 150 }}
      >
        <Interactive.Div
          name="Sobretítulo"
          style={{
            fontSize: 38,
            fontWeight: 600,
            letterSpacing: 12,
            textTransform: "uppercase",
            color: "#d4af37",
            marginBottom: 26,
            opacity: interpolate(frame, [0, 0.6 * fps], [0, 1], {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          Hoje
        </Interactive.Div>

        <Interactive.Div
          name="Título"
          style={{
            fontFamily: bebas,
            fontSize: 130,
            lineHeight: 0.98,
            letterSpacing: 3,
            color: "#f3f1ec",
            marginBottom: 60,
            opacity: interpolate(frame, [0.15 * fps, 0.9 * fps], [0, 1], {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            translate: interpolate(
              frame,
              [0.15 * fps, 0.9 * fps],
              ["0px 44px", "0px 0px"],
              {
                easing: Easing.bezier(0.16, 1, 0.3, 1),
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              },
            ),
          }}
        >
          O corte é afiado.
          <br />
          <span style={{ color: "#d4af37" }}>A gestão, nem tanto.</span>
        </Interactive.Div>

        {PAINS.map(([num, label], i) => {
          return (
            <div
              key={num}
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 34,
                marginBottom: 24,
                opacity: interpolate(
                  frame,
                  [1.1 * fps + i * 9, 1.8 * fps + i * 9],
                  [0, 1],
                  {
                    easing: Easing.bezier(0.16, 1, 0.3, 1),
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  },
                ),
                translate: interpolate(
                  frame,
                  [1.1 * fps + i * 9, 1.8 * fps + i * 9],
                  ["-46px 0px", "0px 0px"],
                  {
                    easing: Easing.bezier(0.16, 1, 0.3, 1),
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  },
                ),
              }}
            >
              <span
                style={{
                  fontFamily: bebas,
                  fontSize: 78,
                  color: "#d4af37",
                  letterSpacing: 2,
                  minWidth: 106,
                }}
              >
                {num}
              </span>
              <span style={{ fontSize: 58, color: "#b9b6ae" }}>{label}</span>
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
