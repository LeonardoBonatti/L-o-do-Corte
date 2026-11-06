import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Backdrop } from "../Backdrop";
import { bebas, inter } from "../fonts";

export const S1Opening: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill name="Abertura" style={{ fontFamily: inter }}>
      <Backdrop />

      {/* O conteúdo vai num AbsoluteFill próprio: sendo posicionado, ele pinta
          acima do Backdrop. Conteúdo em fluxo normal ficaria atrás dele. */}
      <AbsoluteFill
        name="Conteúdo"
        style={{
          alignItems: "center",
          justifyContent: "center",
          padding: 120,
        }}
      >
      <Interactive.Div
        name="Sobretítulo"
        style={{
          fontSize: 42,
          fontWeight: 600,
          letterSpacing: 16,
          textTransform: "uppercase",
          color: "#d4af37",
          marginBottom: 36,
          opacity: interpolate(frame, [0, 0.7 * fps], [0, 1], {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate: interpolate(
            frame,
            [0, 0.7 * fps],
            ["0px -34px", "0px 0px"],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
        }}
      >
        Barbearia
      </Interactive.Div>

      <Interactive.Div
        name="Título"
        style={{
          fontFamily: bebas,
          fontSize: 228,
          lineHeight: 0.94,
          letterSpacing: 8,
          color: "#f3f1ec",
          textAlign: "center",
          opacity: interpolate(frame, [0.25 * fps, 1.1 * fps], [0, 1], {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate: interpolate(
            frame,
            [0.25 * fps, 1.1 * fps],
            ["0px 54px", "0px 0px"],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
        }}
      >
        LEO DO CORTE
      </Interactive.Div>

      <Interactive.Div
        name="Fio dourado"
        style={{
          width: 560,
          height: 4,
          marginTop: 44,
          marginBottom: 44,
          backgroundImage:
            "linear-gradient(90deg, transparent, #d4af37, transparent)",
          scale: interpolate(frame, [0.8 * fps, 1.6 * fps], ["0 1", "1 1"], {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />

      <Interactive.Div
        name="Subtítulo"
        style={{
          fontSize: 54,
          lineHeight: 1.45,
          color: "#b9b6ae",
          textAlign: "center",
          maxWidth: 1340,
          opacity: interpolate(frame, [1.1 * fps, 1.9 * fps], [0, 1], {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate: interpolate(
            frame,
            [1.1 * fps, 1.9 * fps],
            ["0px 38px", "0px 0px"],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
        }}
      >
        Agendamento online, loja de vestuário e painel do barbeiro
      </Interactive.Div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
