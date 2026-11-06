import { Composition, Folder } from "remotion";
import { LeoDoCorte } from "./LeoDoCorte";
import { S1Opening } from "./scenes/S1Opening";
import { S2Problem } from "./scenes/S2Problem";
import { S3Booking } from "./scenes/S3Booking";
import { S4Rule } from "./scenes/S4Rule";
import { S5Cancel } from "./scenes/S5Cancel";
import { S6Shop } from "./scenes/S6Shop";
import { S7Dashboard } from "./scenes/S7Dashboard";
import { S8Promos } from "./scenes/S8Promos";
import { S9Closing } from "./scenes/S9Closing";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="LeoDoCorte"
        component={LeoDoCorte}
        durationInFrames={1524}
        fps={30}
        width={1920}
        height={1080}
      />

      <Folder name="Cenas">
        <Composition
          id="S1-Abertura"
          component={S1Opening}
          durationInFrames={120}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="S2-Problema"
          component={S2Problem}
          durationInFrames={150}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="S3-Agendamento"
          component={S3Booking}
          durationInFrames={240}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="S4-Regra45"
          component={S4Rule}
          durationInFrames={180}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="S5-Cancelamento"
          component={S5Cancel}
          durationInFrames={150}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="S6-Vestuario"
          component={S6Shop}
          durationInFrames={255}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="S7-Painel"
          component={S7Dashboard}
          durationInFrames={210}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="S8-Promocoes"
          component={S8Promos}
          durationInFrames={180}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="S9-Fecho"
          component={S9Closing}
          durationInFrames={135}
          fps={30}
          width={1920}
          height={1080}
        />
      </Folder>
    </>
  );
};
