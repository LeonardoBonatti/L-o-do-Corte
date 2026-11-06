import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { S1Opening } from "./scenes/S1Opening";
import { S2Problem } from "./scenes/S2Problem";
import { S3Booking } from "./scenes/S3Booking";
import { S4Rule } from "./scenes/S4Rule";
import { S5Cancel } from "./scenes/S5Cancel";
import { S6Shop } from "./scenes/S6Shop";
import { S7Dashboard } from "./scenes/S7Dashboard";
import { S8Promos } from "./scenes/S8Promos";
import { S9Closing } from "./scenes/S9Closing";

/**
 * 9 cenas = 1620 frames; 8 transições de 12 frames sobrepõem 96.
 * Duração total: 1524 frames (50,8s a 30fps).
 */
export const LeoDoCorte: React.FC = () => {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence name="Abertura" durationInFrames={120}>
        <S1Opening />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 12 })}
      />

      <TransitionSeries.Sequence name="O problema" durationInFrames={150}>
        <S2Problem />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 12 })}
      />

      <TransitionSeries.Sequence name="Agendamento" durationInFrames={240}>
        <S3Booking />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 12 })}
      />

      <TransitionSeries.Sequence name="Regra dos 45 min" durationInFrames={180}>
        <S4Rule />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 12 })}
      />

      <TransitionSeries.Sequence name="Cancelamento" durationInFrames={150}>
        <S5Cancel />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 12 })}
      />

      <TransitionSeries.Sequence name="Vestuário" durationInFrames={255}>
        <S6Shop />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 12 })}
      />

      <TransitionSeries.Sequence name="Painel" durationInFrames={210}>
        <S7Dashboard />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 12 })}
      />

      <TransitionSeries.Sequence name="Promoções" durationInFrames={180}>
        <S8Promos />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 12 })}
      />

      <TransitionSeries.Sequence name="Fecho" durationInFrames={135}>
        <S9Closing />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
