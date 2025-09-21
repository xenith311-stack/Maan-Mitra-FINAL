import { useEffect, useRef } from "react";
import * as THREE from "three";
import FOG from "vanta/dist/vanta.fog.min";
import "./VantaBackground.css";

export default function VantaBackground({ variant = 'fixed' as 'fixed' | 'local' }) {
  const vantaRef = useRef<HTMLDivElement | null>(null);
  const vantaEffect = useRef<any>(null);

  useEffect(() => {
    if (!vantaEffect.current && vantaRef.current) {
      vantaEffect.current = FOG({
        el: vantaRef.current,
        THREE: THREE,
        minHeight: 200.0,
        minWidth: 200.0,
        highlightColor: 0xbed4c3,
        midtoneColor: 0xffffff,
        lowlightColor: 0xdbeddb,
        baseColor: 0xb3cfbd,
        blurFactor: 0.35,
        speed: 0.8,
      });
    }

    return () => {
      if (vantaEffect.current) {
        vantaEffect.current.destroy();
      }
    };
  }, []);

  return <div ref={vantaRef} className={variant === 'fixed' ? "vanta-background" : "vanta-background-local"}></div>;
}

