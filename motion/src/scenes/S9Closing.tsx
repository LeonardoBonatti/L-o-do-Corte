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

export const S9Closing: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill name="Fecho" style={{ fontFamily: inter }}>
      <Backdrop />

      <AbsoluteFill
        name="Conteúdo"
        style={{
          alignItems: "center",
          justifyContent: "center",
          padding: 120,
        }}
      >
      <Interactive.Div
        name="Marca"
        style={{
          width: 148,
          height: 148,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 38,
          border: "1px solid rgba(212,175,55,0.45)",
          backgroundImage: "linear-gradient(145deg, #1d1a12, #0e0e11)",
          color: "#d4af37",
          fontFamily: bebas,
          fontSize: 104,
          paddingTop: 12,
          marginBottom: 46,
          opacity: interpolate(frame, [0, 0.6 * fps], [0, 1], {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          scale: interpolate(frame, [0, 0.8 * fps], [0.8, 1], {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            output: "perceptual-scale",
          }),
        }}
      >
        L
      </Interactive.Div>

      <Interactive.Div
        name="Título"
        style={{
          fontFamily: bebas,
          fontSize: 210,
          lineHeight: 0.96,
          letterSpacing: 8,
          color: "#f3f1ec",
          textAlign: "center",
          opacity: interpolate(frame, [0.3 * fps, 1.1 * fps], [0, 1], {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate: interpolate(
            frame,
            [0.3 * fps, 1.1 * fps],
            ["0px 46px", "0px 0px"],
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
        name="Assinatura"
        style={{
          fontSize: 54,
          lineHeight: 1.45,
          color: "#b9b6ae",
          textAlign: "center",
          marginTop: 26,
          opacity: interpolate(frame, [0.9 * fps, 1.6 * fps], [0, 1], {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        Agenda cheia, estoque no controle
        <br />e o cliente marcando sozinho.
      </Interactive.Div>

      <Interactive.Div
        name="Selo"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 58,
          padding: "30px 64px",
          borderRadius: 999,
          backgroundImage: "linear-gradient(145deg, #e7c967, #b8942a)",
          color: "#16130a",
          fontSize: 48,
          fontWeight: 700,
          opacity: interpolate(frame, [1.5 * fps, 2.1 * fps], [0, 1], {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          scale: interpolate(frame, [1.5 * fps, 2.1 * fps], [0.88, 1], {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            output: "perceptual-scale",
          }),
        }}
      >
        Pronto para usar
      </Interactive.Div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
