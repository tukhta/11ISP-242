import { assetUrl } from "../utils/assets";

export function Fly({ fly, onCatch }) {
  return (
    <button
      type="button"
      className={`fly ${fly.caught ? "fly--caught" : ""}`}
      style={{
        left: `${fly.x}px`,
        top: `${fly.y}px`,
        width: `${fly.size}px`,
        height: `${fly.size}px`,
        transform: `rotate(${fly.angle}deg) scale(${fly.caught ? 0.55 : 1})`,
        transitionDuration: fly.caught ? "700ms" : `${fly.duration}ms`
      }}
      onClick={(event) => {
        event.stopPropagation();
        onCatch(fly.id);
      }}
      disabled={fly.caught}
      aria-label="Поймать муху"
    >
      <img src={assetUrl("fly.svg")} alt="" />
    </button>
  );
}
