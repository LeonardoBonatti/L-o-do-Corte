import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Backdrop, BrandCorner } from "../Backdrop";
import { bebas, inter } from "../fonts";

const SLOTS = [
  { time: "10:00", off: false },
  { time: "10:30", off: true },
  { time: "11:00", off: false },
  { time: "11:30", off: false },
  { time: "14:00", off: false },
  { time: "14:30", off: false },
  { time: "15:00", off: true },
  { time: "15:30", off: false },
  { time: "17:00", off: false },
  { time: "17:30", off: false },
  { time: "18:00", off: false },
  { time: "18:30", off: true },
];

export const S3Booking: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill name="Agendamento" style={{ fontFamily: inter }}>
      <Backdrop />
      <BrandCorner />

      <AbsoluteFill
        name="Conteúdo"
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 150,
          gap: 70,
        }}
      >
      <div style={{ width: 480 }}>
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
          Cliente
        </Interactive.Div>

        <Interactive.Div
          name="Título"
          style={{
            fontFamily: bebas,
            fontSize: 148,
            lineHeight: 0.94,
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
          Agenda em
          <br />
          <span style={{ color: "#d4af37" }}>3 toques</span>
        </Interactive.Div>

        <Interactive.Div
          name="Apoio"
          style={{
            fontSize: 48,
            lineHeight: 1.45,
            color: "#b9b6ae",
            opacity: interpolate(frame, [0.7 * fps, 1.4 * fps], [0, 1], {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          Serviço, dia e horário.
          <br />
          Confirmação na hora.
        </Interactive.Div>
      </div>

      <div style={{ width: 1066 }}>
        <Interactive.Div
          name="Serviço escolhido"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 30,
            marginBottom: 34,
            borderRadius: 20,
            border: "1px solid #d4af37",
            backgroundImage: "linear-gradient(170deg, #1b1810, #0b0b0e)",
            opacity: interpolate(frame, [0.4 * fps, 1.1 * fps], [0, 1], {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            translate: interpolate(
              frame,
              [0.4 * fps, 1.1 * fps],
              ["0px -30px", "0px 0px"],
              {
                easing: Easing.bezier(0.16, 1, 0.3, 1),
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              },
            ),
          }}
        >
          <span style={{ fontSize: 50, fontWeight: 700, color: "#f3f1ec" }}>
            Corte + Barba
          </span>
          <span style={{ fontSize: 44, color: "#b9b6ae" }}>45 min</span>
          <span
            style={{ fontFamily: bebas, fontSize: 62, color: "#d4af37" }}
          >
            R$ 60,00
          </span>
        </Interactive.Div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 250px)",
            gap: 22,
          }}
        >
          {SLOTS.map((slot, i) => {
            const isPick = slot.time === "18:00";

            return (
              <div
                key={slot.time}
                style={{
                  height: 118,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 16,
                  border: "1px solid #2a2a35",
                  fontSize: 56,
                  fontWeight: 700,
                  textDecoration: slot.off ? "line-through" : "none",
                  backgroundColor: isPick
                    ? interpolateColors(
                        frame,
                        [4.9 * fps, 5.4 * fps],
                        ["#181820", "#d4af37"],
                      )
                    : slot.off
                      ? "#08080a"
                      : "#181820",
                  color: isPick
                    ? interpolateColors(
                        frame,
                        [4.9 * fps, 5.4 * fps],
                        ["#f3f1ec", "#16130a"],
                      )
                    : slot.off
                      ? "#7d7a74"
                      : "#f3f1ec",
                  opacity: interpolate(
                    frame,
                    [1.3 * fps + i * 3, 1.8 * fps + i * 3],
                    [0, slot.off ? 0.4 : 1],
                    {
                      easing: Easing.bezier(0.16, 1, 0.3, 1),
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    },
                  ),
                  scale: interpolate(
                    frame,
                    [1.3 * fps + i * 3, 1.8 * fps + i * 3],
                    [0.86, 1],
                    {
                      easing: Easing.bezier(0.16, 1, 0.3, 1),
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                      output: "perceptual-scale",
                    },
                  ),
                }}
              >
                {slot.time}
              </div>
            );
          })}
        </div>

        <Interactive.Div
          name="Confirmação"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 18,
            marginTop: 34,
            padding: 24,
            borderRadius: 999,
            border: "1px solid rgba(76,167,113,0.5)",
            backgroundColor: "rgba(76,167,113,0.14)",
            color: "#7fd0a1",
            fontSize: 44,
            fontWeight: 700,
            opacity: interpolate(frame, [5.9 * fps, 6.5 * fps], [0, 1], {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            scale: interpolate(frame, [5.9 * fps, 6.5 * fps], [0.9, 1], {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              output: "perceptual-scale",
            }),
          }}
        >
          Horário confirmado · quinta, 30 out · 18:00
        </Interactive.Div>
      </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
