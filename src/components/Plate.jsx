export function Plate({ plateCount, carryingFly, onSelect }) {
  const canTakeFly = plateCount > 0 && !carryingFly;

  return (
    <button
      type="button"
      className={`plate ${carryingFly ? "plate--active" : ""}`}
      onClick={(event) => {
        event.stopPropagation();
        if (canTakeFly) {
          onSelect();
        }
      }}
      aria-label="Тарелка с мухами"
    >
      <img className="plate__image" src="/assets/plate.svg" alt="" />
      <div className="plate__counter">{plateCount}</div>
      <div className="plate__flies">
        {Array.from({ length: Math.min(plateCount, 5) }).map((_, index) => (
          <img
            key={index}
            className={`plate__fly plate__fly--${index + 1}`}
            src="/assets/fly.svg"
            alt=""
          />
        ))}
      </div>
      <span className="plate__hint">
        {canTakeFly ? "Нажми, чтобы взять муху" : "Сначала поймай муху"}
      </span>
    </button>
  );
}
