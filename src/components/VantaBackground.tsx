import "./VantaBackground.css";

export default function VantaBackground({ variant = 'fixed' as 'fixed' | 'local' }) {
  return <div className={variant === 'fixed' ? "vanta-background" : "vanta-background-local"}></div>;
}

