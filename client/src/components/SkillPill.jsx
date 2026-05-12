export default function SkillPill({ children, tone = "teal" }) {
  const styles = tone === "orange" ? "bg-orange-50 text-orange-800 dark:bg-orange-950 dark:text-orange-200" : "bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-200";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles}`}>{children}</span>;
}
