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

const TRACK = ["17:00", "17:30", "18:00", "18:30"];

export const S4Rule: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill name="Regra dos 45 min" style={{ fontFamily: inter }}>
      <Backdrop />
      <BrandCorner />

      <AbsoluteFill
        name="Conteúdo"
        style={{
          alignItems: "center",
          justifyContent: "center",
          padding: 120,
        }}
      >
        <Interactive.Div
          name="Título"
          style={{
            fontFamily: bebas,
            fontSize: 136,
            lineHeight: 0.98,
            letterSpacing: 3,
            color: "#f3f1ec",
            textAlign: "center",
            marginBottom: 80,
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
          Serviço de 45 min
          <br />
          <span style={{ color: "#d4af37" }}>reserva dois slots.</span>
        </Interactive.Div>

        {/* A barra dourada fica ACIMA da trilha, nunca por cima dos horários */}
        <div style={{ position: "relative", width: 1400, height: 298 }}>
          <Interactive.Div
            name="Bloco do serviço"
            style={{
              position: "absolute",
              top: 0,
              left: 720,
              height: 96,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 16,
              border: "1px solid #d4af37",
              backgroundImage:
                "linear-gradient(135deg, rgba(212,175,55,0.34), rgba(212,175,55,0.12))",
              overflow: "hidden",
              width: interpolate(frame, [1.6 * fps, 2.6 * fps], [0, 680], {
                easing: Easing.bezier(0.16, 1, 0.3, 1),
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            <span
              style={{
                fontFamily: bebas,
                fontSize: 52,
                letterSpacing: 3,
                color: "#e7c967",
                whiteSpace: "nowrap",
              }}
            >
              Corte + Barba · 45 min
            </span>
          </Interactive.Div>

          <div
            style={{
              position: "absolute",
              top: 128,
              left: 0,
              display: "grid",
              gridTemplateColumns: "repeat(4, 320px)",
              gap: 40,
            }}
          >
            {TRACK.map((time, i) => {
              const isTaken = time === "18:00" || time === "18:30";

              return (
                <div
                  key={time}
                  style={{
                    height: 170,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 20,
                    border: isTaken ? "1px solid #d4af37" : "1px dashed #2a2a35",
                    backgroundColor: "rgba(255,255,255,0.02)",
                    fontSize: 64,
                    fontWeight: 700,
                    color: isTaken ? "#d4af37" : "#b9b6ae",
                    opacity: interpolate(
                      frame,
                      [0.6 * fps + i * 4, 1.1 * fps + i * 4],
                      [0, 1],
                      {
                        easing: Easing.bezier(0.16, 1, 0.3, 1),
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                      },
                    ),
                  }}
                >
                  {time}
                </div>
              );
            })}
          </div>
        </div>

        <Interactive.Div
          name="Conclusão"
          style={{
            fontSize: 50,
            lineHeight: 1.45,
            color: "#b9b6ae",
            textAlign: "center",
            marginTop: 80,
            maxWidth: 1640,
            opacity: interpolate(frame, [3.1 * fps, 3.8 * fps], [0, 1], {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            translate: interpolate(
              frame,
              [3.1 * fps, 3.8 * fps],
              ["0px 32px", "0px 0px"],
              {
                easing: Easing.bezier(0.16, 1, 0.3, 1),
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              },
            ),
          }}
        >
          Por isso <span style={{ color: "#d4af37" }}>18:30 some da lista</span>{" "}
          — terminaria depois das 19h.
        </Interactive.Div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
