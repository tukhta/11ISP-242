import { useEffect, useState } from "react";

function readWindowSize() {
  if (typeof window === "undefined") {
    return { width: 1280, height: 720 };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight
  };
}

export function useWindowSize() {
  const [windowSize, setWindowSize] = useState(readWindowSize);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize(readWindowSize());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowSize;
}
