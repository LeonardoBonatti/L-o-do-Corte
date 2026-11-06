import { AbsoluteFill } from "remotion";
import { bebas } from "./fonts";

/** Fundo escuro com brilho dourado, comum a todas as cenas. */
export const Backdrop: React.FC = () => {
  return (
    <AbsoluteFill
      name="Fundo"
      style={{
        backgroundColor: "#08080a",
        backgroundImage:
          "radial-gradient(1400px 700px at 78% -8%, rgba(212,175,55,0.13), transparent 60%), radial-gradient(900px 500px at 4% 6%, rgba(255,255,255,0.045), transparent 60%)",
      }}
    />
  );
};

/** Assinatura discreta no canto, usada nas cenas internas. */
export const BrandCorner: React.FC = () => {
  return (
    <AbsoluteFill
      name="Assinatura"
      style={{
        alignItems: "flex-start",
        justifyContent: "flex-start",
        padding: 70,
        flexDirection: "row",
        gap: 18,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 18,
          border: "1px solid rgba(212,175,55,0.45)",
          backgroundImage: "linear-gradient(145deg, #1d1a12, #0e0e11)",
          color: "#d4af37",
          fontFamily: bebas,
          fontSize: 44,
          paddingTop: 6,
        }}
      >
        L
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span
          style={{
            fontFamily: bebas,
            fontSize: 38,
            letterSpacing: 2,
            color: "#f3f1ec",
            lineHeight: 1.05,
          }}
        >
          Leo do Corte
        </span>
        <span
          style={{
            fontSize: 15,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#d4af37",
          }}
        >
          Barbearia
        </span>
      </div>
    </AbsoluteFill>
  );
};
