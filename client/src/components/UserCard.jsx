import { Award, Send } from "lucide-react";
import SkillPill from "./SkillPill.jsx";

export default function UserCard({ user, onRequest }) {
  return (
    <article className="panel p-4">
      <div className="flex items-start gap-3">
        <img className="h-12 w-12 rounded-full object-cover" src={user.profilePicture || `https://api.dicebear.com/9.x/initials/svg?seed=${user.name}`} alt="" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate font-semibold">{user.name}</h3>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">{user.category}</span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{user.bio || "Ready to exchange skills and learn with peers."}</p>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <div>
          <p className="mb-2 text-xs font-bold uppercase text-slate-500">Offers</p>
          <div className="flex flex-wrap gap-2">{user.skillsOffered?.map((skill) => <SkillPill key={skill}>{skill}</SkillPill>)}</div>
        </div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase text-slate-500">Wants</p>
          <div className="flex flex-wrap gap-2">{user.skillsWanted?.map((skill) => <SkillPill key={skill} tone="orange">{skill}</SkillPill>)}</div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1 text-sm text-slate-500"><Award size={16} /> {user.ratingAverage || 0}/5</div>
        <button onClick={() => onRequest(user)} className="btn-primary"><Send size={16} /> Request</button>
      </div>
    </article>
  );
}
