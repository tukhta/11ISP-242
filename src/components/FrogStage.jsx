export function FrogStage({
  moodLabel,
  frogRef,
  carryingFly,
  onFeed
}) {
  return (
    <button
      type="button"
      ref={frogRef}
      className={`frog-stage ${carryingFly ? "frog-stage--ready" : ""}`}
      onClick={(event) => {
        event.stopPropagation();
        onFeed();
      }}
      aria-label="Лягушка"
    >
      <img className="frog-stage__frog" src="/assets/frog.svg" alt="" />
      <div className="frog-stage__bubble">{moodLabel}</div>
      <div className="frog-stage__shadow" />
    </button>
  );
}
