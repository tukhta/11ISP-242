import { useEffect, useMemo, useRef, useState } from "react";
import { Fly } from "./components/Fly";
import { FrogStage } from "./components/FrogStage";
import { Plate } from "./components/Plate";
import { StatBar } from "./components/StatBar";
import { useWindowSize } from "./hooks/useWindowSize";

const FLY_COUNT = 7;
const HUNGER_START = 68;
const FLY_MOVE_INTERVAL = 2200;
const FLY_PADDING_X = 60;
const FLY_PADDING_Y = 90;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function getLayoutZones(bounds) {
  const pagePadding = bounds.width <= 900 ? 18 : 24;
  const hudWidth =
    bounds.width <= 900
      ? Math.max(220, bounds.width - pagePadding * 2)
      : Math.min(360, bounds.width * 0.8);
  const hudHeight = bounds.width <= 900 ? 220 : 205;
  const centerWidth = bounds.width <= 640 ? Math.min(bounds.width - 36, 320) : Math.min(bounds.width * 0.62, 580);
  const centerHeight = bounds.width <= 640 ? 360 : 330;
  const centerTopRatio = bounds.width <= 640 ? 0.64 : bounds.width <= 900 ? 0.62 : 0.56;
  const centerTop = bounds.height * centerTopRatio - centerHeight / 2;

  return {
    pagePadding,
    hud: {
      left: pagePadding,
      top: pagePadding,
      right: pagePadding + hudWidth,
      bottom: pagePadding + hudHeight
    },
    center: {
      left: bounds.width / 2 - centerWidth / 2,
      top: centerTop,
      right: bounds.width / 2 + centerWidth / 2,
      bottom: centerTop + centerHeight
    }
  };
}

function normalizeLane(rect) {
  return {
    ...rect,
    left: Math.max(rect.left, FLY_PADDING_X),
    top: Math.max(rect.top, FLY_PADDING_Y),
    right: Math.min(rect.right, rect.boundsWidth - FLY_PADDING_X),
    bottom: Math.min(rect.bottom, rect.boundsHeight - FLY_PADDING_Y)
  };
}

function getFlightLanes(bounds) {
  const { pagePadding, hud, center } = getLayoutZones(bounds);
  const laneGap = bounds.width <= 640 ? 22 : 34;
  const rawLanes = [
    {
      name: "top",
      left: hud.right + laneGap,
      top: pagePadding,
      right: bounds.width - pagePadding,
      bottom: center.top - laneGap,
      boundsWidth: bounds.width,
      boundsHeight: bounds.height
    },
    {
      name: "left",
      left: pagePadding,
      top: hud.bottom + laneGap,
      right: center.left - laneGap,
      bottom: bounds.height - pagePadding,
      boundsWidth: bounds.width,
      boundsHeight: bounds.height
    },
    {
      name: "right",
      left: center.right + laneGap,
      top: pagePadding,
      right: bounds.width - pagePadding,
      bottom: bounds.height - pagePadding,
      boundsWidth: bounds.width,
      boundsHeight: bounds.height
    },
    {
      name: "bottom",
      left: pagePadding,
      top: center.bottom + laneGap,
      right: bounds.width - pagePadding,
      bottom: bounds.height - pagePadding,
      boundsWidth: bounds.width,
      boundsHeight: bounds.height
    }
  ];

  return rawLanes
    .map(normalizeLane)
    .filter((lane) => lane.right - lane.left >= 120 && lane.bottom - lane.top >= 90);
}

function getLanePoint(lane) {
  return {
    x: randomBetween(lane.left, Math.max(lane.left + 1, lane.right)),
    y: randomBetween(lane.top, Math.max(lane.top + 1, lane.bottom))
  };
}

function pickNextLane(lanes, currentLaneName) {
  if (!lanes.length) {
    return null;
  }

  if (lanes.length === 1) {
    return lanes[0];
  }

  const currentIndex = lanes.findIndex((lane) => lane.name === currentLaneName);

  if (currentIndex === -1) {
    return lanes[Math.floor(Math.random() * lanes.length)];
  }

  const laneOffset = Math.random() > 0.5 ? 1 : -1;
  const nextIndex = (currentIndex + laneOffset + lanes.length) % lanes.length;
  return lanes[nextIndex];
}

function getNextFlightTarget(bounds, currentLaneName) {
  const lanes = getFlightLanes(bounds);
  const lane = pickNextLane(lanes, currentLaneName);

  if (!lane) {
    return {
      lane: "free",
      x: randomBetween(FLY_PADDING_X, Math.max(FLY_PADDING_X + 1, bounds.width - FLY_PADDING_X)),
      y: randomBetween(FLY_PADDING_Y, Math.max(FLY_PADDING_Y + 1, bounds.height - FLY_PADDING_Y))
    };
  }

  const point = getLanePoint(lane);
  return {
    lane: lane.name,
    x: point.x,
    y: point.y
  };
}

function createFly(id, bounds) {
  const position = getNextFlightTarget(bounds, null);

  return {
    id,
    x: position.x,
    y: position.y,
    lane: position.lane,
    size: randomBetween(44, 60),
    angle: randomBetween(-20, 20),
    duration: randomBetween(2800, 5200),
    caught: false
  };
}

function createFlySet(bounds) {
  return Array.from({ length: FLY_COUNT }, (_, index) => createFly(index + 1, bounds));
}

export default function App() {
  const size = useWindowSize();
  const frogRef = useRef(null);
  const plateRef = useRef({ x: 0, y: 0 });
  const speechTimeoutRef = useRef(null);
  const [flies, setFlies] = useState(() => createFlySet(size));
  const [hunger, setHunger] = useState(HUNGER_START);
  const [plateCount, setPlateCount] = useState(0);
  const [carryingFly, setCarryingFly] = useState(false);
  const [message, setMessage] = useState("Лягушка проголодалась. Поймай несколько мух.");
  const [mousePosition, setMousePosition] = useState({ x: size.width / 2, y: size.height / 2 });
  const [frogSpeech, setFrogSpeech] = useState("");

  const happiness = useMemo(() => clamp(100 - hunger + plateCount * 4, 12, 100), [hunger, plateCount]);

  useEffect(() => {
    setFlies((current) => {
      if (current.length) {
        return current.map((fly) =>
          fly.caught ? fly : createFly(fly.id, size)
        );
      }

      return createFlySet(size);
    });
  }, [size.height, size.width]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setFlies((current) =>
        current.map((fly) =>
          fly.caught
            ? fly
            : (() => {
                const position = getNextFlightTarget(size, fly.lane);
                return {
                  ...fly,
                  lane: position.lane,
                  x: position.x,
                  y: position.y,
                  angle: randomBetween(-25, 25),
                  duration: randomBetween(2600, 5200)
                };
              })()
        )
      );
    }, FLY_MOVE_INTERVAL);

    return () => window.clearInterval(timer);
  }, [size.height, size.width]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHunger((value) => clamp(value + 3, 0, 100));
    }, 4500);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (speechTimeoutRef.current) {
        window.clearTimeout(speechTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (hunger >= 80) {
      setMessage("Лягушка очень голодна. Лучше срочно её покормить.");
      return;
    }

    if (hunger <= 28) {
      setMessage("Лягушка сыта и довольна. Можно поймать ещё мух про запас.");
      return;
    }

    if (plateCount > 0 && !carryingFly) {
      setMessage("В тарелке уже есть мухи. Нажми на тарелку и покорми лягушку.");
      return;
    }

    if (carryingFly) {
      setMessage("Поднеси муху к лягушке или нажми мимо, чтобы вернуть её в тарелку.");
      return;
    }

    setMessage("Мухи летают по экрану. Лови их и отправляй в тарелку.");
  }, [carryingFly, hunger, plateCount]);

  const moodLabel = useMemo(() => {
    if (happiness >= 80) {
      return "Ква! Я счастлива";
    }

    if (happiness >= 55) {
      return "Мне впринципе и норм "  +
          "и впринципе не норм";
    }

    if (happiness >= 30) {
      return "Покорми меня пж";
    }

    return "моросишь";
  }, [happiness]);

  const sayFrog = (text) => {
    setFrogSpeech(text);

    if (speechTimeoutRef.current) {
      window.clearTimeout(speechTimeoutRef.current);
    }

    speechTimeoutRef.current = window.setTimeout(() => {
      setFrogSpeech("");
      speechTimeoutRef.current = null;
    }, 1600);
  };

  const catchFly = (flyId) => {
    const stageBounds = frogRef.current?.getBoundingClientRect();
    const plateTarget = stageBounds
      ? {
          x: stageBounds.left - 120,
          y: stageBounds.top + stageBounds.height / 2 + 40
        }
      : {
          x: size.width / 2 - 220,
          y: size.height / 2 + 50
        };

    plateRef.current = plateTarget;

    setFlies((current) =>
      current.map((fly) =>
        fly.id === flyId
          ? {
              ...fly,
              caught: true,
              x: plateTarget.x,
              y: plateTarget.y,
              angle: 0
            }
          : fly
      )
    );

    window.setTimeout(() => {
      setPlateCount((value) => value + 1);
      setFlies((current) =>
        current.map((fly) =>
          fly.id === flyId ? createFly(fly.id, size) : fly
        )
      );
    }, 700);
  };

  const feedFrog = () => {
    if (!carryingFly || plateCount <= 0) {
      sayFrog("Ква!");
      return;
    }

    setCarryingFly(false);
    setPlateCount((value) => Math.max(0, value - 1));
    setHunger((value) => clamp(value - 18, 0, 100));
    sayFrog("мм вкусно бл");
    setMessage("Лягушка с удовольствием съела муху.");
  };

  const takeFlyFromPlate = () => {
    setCarryingFly(true);
  };

  const releaseFly = () => {
    if (!carryingFly) {
      return;
    }

    setCarryingFly(false);
    setMessage("Муха возвращена в тарелку. Можно попробовать ещё раз.");
  };

  return (
    <main
      className={`page ${carryingFly ? "page--carrying" : ""}`}
      onClick={releaseFly}
      onMouseMove={(event) => {
        setMousePosition({ x: event.clientX, y: event.clientY });
      }}
    >
      <img className="page__background" src="/assets/background.svg" alt="" />

      <section className="hud">
        <div className="hud__title">
          <p>Лягушка, тарелка и мухи</p>
        </div>

        <div className="hud__stats">
          <StatBar label="Голод" value={hunger} tone="danger" />
          <StatBar label="Счастье" value={happiness} tone="joy" />
        </div>

        <p className="hud__message">{message}</p>
      </section>

      <section className="playground">
        {flies.map((fly) => (
          <Fly key={fly.id} fly={fly} onCatch={catchFly} />
        ))}

        <div className="playground__center">
          <Plate plateCount={plateCount} carryingFly={carryingFly} onSelect={takeFlyFromPlate} />
          <FrogStage
            moodLabel={frogSpeech || moodLabel}
            frogRef={frogRef}
            carryingFly={carryingFly}
            onFeed={feedFrog}
          />
        </div>
      </section>

      {carryingFly ? (
        <img
          className="cursor-fly"
          src="/assets/fly.svg"
          alt=""
          style={{
            left: `${mousePosition.x + 8}px`,
            top: `${mousePosition.y + 4}px`
          }}
        />
      ) : null}
    </main>
  );
}
