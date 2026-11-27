import DesignStageViewer from "./design-viewer/DesignStageViewer";
import type { JerseyDesign } from "../lib/designs";

type Props = {
  design: JerseyDesign;
  designs: JerseyDesign[];
  index: number;
  opener: HTMLElement | null;
  onSelect: (id: string) => void;
  onClose: () => void;
};

/** Backwards-compatible entry point for the full-screen design stage. */
export default function Design3DModal({
  design,
  designs,
  index,
  opener,
  onSelect,
  onClose,
}: Props) {
  return (
    <DesignStageViewer
      design={design}
      designs={designs}
      index={index}
      opener={opener}
      onSelect={onSelect}
      onClose={onClose}
    />
  );
}
