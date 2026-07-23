export default function SkillPill({ children, tone = "teal" }) {
  const styles = tone === "orange" ? "border-pink-300/25 text-pink-100 shadow-[0_0_18px_rgba(244,114,182,0.09)]" : "border-cyan-300/25 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.09)]";
  return <span className={`neon-pill rounded-lg px-2.5 py-1 text-xs font-semibold transition hover:-translate-y-0.5 ${styles}`}>{children}</span>;
}
