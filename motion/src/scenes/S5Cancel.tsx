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

export const S5Cancel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill name="Cancelamento" style={{ fontFamily: inter }}>
      <Backdrop />
      <BrandCorner />

      <AbsoluteFill
        name="Conteúdo"
        style={{
          alignItems: "center",
          justifyContent: "center",
          padding: 130,
        }}
      >
        <Interactive.Div
          name="Título"
          style={{
            fontFamily: bebas,
            fontSize: 118,
            lineHeight: 1,
            letterSpacing: 3,
            color: "#f3f1ec",
            textAlign: "center",
            marginBottom: 70,
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
          Cancelou?
          <span style={{ color: "#d4af37" }}> A vaga reabre na hora.</span>
        </Interactive.Div>

        <Interactive.Div
          name="Agendamento mantido"
          style={{
            width: 1400,
            display: "flex",
            alignItems: "center",
            gap: 40,
            padding: 28,
            marginBottom: 26,
            borderRadius: 22,
            border: "1px solid #1e1e27",
            backgroundColor: "rgba(255,255,255,0.015)",
            opacity: interpolate(frame, [0.7 * fps, 1.3 * fps], [0, 1], {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            translate: interpolate(
              frame,
              [0.7 * fps, 1.3 * fps],
              ["44px 0px", "0px 0px"],
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
              fontSize: 80,
              color: "#d4af37",
              minWidth: 180,
            }}
          >
            14:30
          </span>
          <span style={{ flex: 1, fontSize: 50, color: "#f3f1ec" }}>
            Corte + Sobrancelha
          </span>
          <span style={{ fontFamily: bebas, fontSize: 62, color: "#d4af37" }}>
            R$ 45,00
          </span>
          <span
            style={{
              padding: "14px 26px",
              borderRadius: 999,
              border: "1px solid rgba(76,167,113,0.5)",
              backgroundColor: "rgba(76,167,113,0.14)",
              color: "#7fd0a1",
              fontSize: 32,
              fontWeight: 700,
              minWidth: 212,
              textAlign: "center",
            }}
          >
            Confirmado
          </span>
        </Interactive.Div>

        <Interactive.Div
          name="Agendamento cancelado"
          style={{
            width: 1400,
            display: "flex",
            alignItems: "center",
            gap: 40,
            padding: 28,
            borderRadius: 22,
            border: "1px solid #1e1e27",
            backgroundColor: "rgba(255,255,255,0.015)",
            opacity: interpolate(
              frame,
              [0.9 * fps, 1.5 * fps, 2.8 * fps, 3.3 * fps],
              [0, 1, 1, 0.55],
              {
                easing: [
                  Easing.bezier(0.16, 1, 0.3, 1),
                  Easing.linear,
                  Easing.bezier(0.16, 1, 0.3, 1),
                ],
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              },
            ),
            translate: interpolate(
              frame,
              [0.9 * fps, 1.5 * fps],
              ["44px 0px", "0px 0px"],
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
              fontSize: 80,
              color: "#d4af37",
              minWidth: 180,
            }}
          >
            18:00
          </span>

          <span
            style={{
              flex: 1,
              fontSize: 50,
              color: "#f3f1ec",
              position: "relative",
            }}
          >
            Corte + Barba
            <Interactive.Div
              name="Risco"
              style={{
                position: "absolute",
                left: 0,
                top: 30,
                width: 338,
                height: 4,
                borderRadius: 2,
                backgroundColor: "#d9534f",
                transformOrigin: "left center",
                scale: interpolate(
                  frame,
                  [2.6 * fps, 3.1 * fps],
                  ["0 1", "1 1"],
                  {
                    easing: Easing.bezier(0.16, 1, 0.3, 1),
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  },
                ),
              }}
            />
          </span>

          <span style={{ fontFamily: bebas, fontSize: 62, color: "#d4af37" }}>
            R$ 60,00
          </span>

          <span style={{ position: "relative", minWidth: 212, height: 64 }}>
            <span
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                padding: "14px 26px",
                borderRadius: 999,
                border: "1px solid rgba(76,167,113,0.5)",
                backgroundColor: "rgba(76,167,113,0.14)",
                color: "#7fd0a1",
                fontSize: 32,
                fontWeight: 700,
                textAlign: "center",
                opacity: interpolate(frame, [2.7 * fps, 3.1 * fps], [1, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              Confirmado
            </span>
            <span
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                padding: "14px 26px",
                borderRadius: 999,
                border: "1px solid rgba(217,83,79,0.5)",
                backgroundColor: "rgba(217,83,79,0.14)",
                color: "#ef9b98",
                fontSize: 32,
                fontWeight: 700,
                textAlign: "center",
                opacity: interpolate(frame, [2.9 * fps, 3.4 * fps], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              Cancelado
            </span>
          </span>
        </Interactive.Div>

        <Interactive.Div
          name="Conclusão"
          style={{
            fontSize: 48,
            color: "#b9b6ae",
            marginTop: 60,
            opacity: interpolate(frame, [3.6 * fps, 4.2 * fps], [0, 1], {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          O cliente cancela sozinho. O horário volta para a agenda.
        </Interactive.Div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
