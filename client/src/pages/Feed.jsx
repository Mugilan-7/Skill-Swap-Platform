import { useEffect, useState } from "react";
import { Bookmark, Bot, Heart, Mic, MessageCircle, Send, UserPlus, Volume2 } from "lucide-react";
import api from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import SkillPill from "../components/SkillPill.jsx";

export default function Feed() {
  const { user, setUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [filters, setFilters] = useState({ search: "", tag: "", sort: "latest" });
  const [feedMode, setFeedMode] = useState("all");
  const [postForm, setPostForm] = useState({ title: "", content: "", tags: "" });
  const [comments, setComments] = useState({});
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([{ role: "ai", text: "Ask for post ideas, networking tips, or skill-learning guidance." }]);
  const [voiceStatus, setVoiceStatus] = useState("");

  async function loadPosts(mode = feedMode) {
    const query = new URLSearchParams(filters);
    const url = mode === "following" ? "/posts/feed/following" : `/posts?${query}`;
    const { data } = await api.get(url);
    setPosts(data);
  }

  useEffect(() => {
    loadPosts().catch(() => {});
  }, [feedMode]);

  async function createPost(e) {
    e.preventDefault();
    await api.post("/posts", postForm);
    setPostForm({ title: "", content: "", tags: "" });
    loadPosts("all");
  }

  async function likePost(postId) {
    await api.post(`/posts/${postId}/like`);
    loadPosts();
  }

  async function bookmarkPost(postId) {
    const { data } = await api.post(`/posts/${postId}/bookmark`);
    const updated = { ...user, bookmarks: data.bookmarks };
    setUser(updated);
    localStorage.setItem("skillswap_user", JSON.stringify(updated));
  }

  async function commentPost(e, postId) {
    e.preventDefault();
    const text = comments[postId];
    if (!text?.trim()) return;
    await api.post(`/posts/${postId}/comments`, { text });
    setComments((prev) => ({ ...prev, [postId]: "" }));
    loadPosts();
  }

  async function followUser(userId) {
    const { data } = await api.post(`/posts/users/${userId}/follow`);
    const updated = { ...user, following: data.following };
    setUser(updated);
    localStorage.setItem("skillswap_user", JSON.stringify(updated));
    loadPosts();
  }

  function startVoiceInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceStatus("Speech recognition is not supported in this browser. Use Chrome or Edge.");
      return;
    }
    if (!window.isSecureContext) {
      setVoiceStatus("Voice input needs HTTPS or localhost.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setVoiceStatus("Listening...");
    recognition.onresult = (event) => {
      setChatInput(event.results[0][0].transcript);
      setVoiceStatus("Voice captured. Review it, then send.");
    };
    recognition.onerror = (event) => {
      const help = event.error === "not-allowed" ? "Microphone permission was blocked. Allow microphone access in the browser." : `Voice error: ${event.error}`;
      setVoiceStatus(help);
    };
    recognition.onend = () => setVoiceStatus((current) => (current === "Listening..." ? "No speech detected. Try again." : current));
    try {
      recognition.start();
    } catch {
      setVoiceStatus("Voice recognition is already active. Wait a moment and try again.");
    }
  }

  function speak(text) {
    if (!("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  }

  async function askAi(e) {
    e.preventDefault();
    const message = chatInput.trim();
    if (!message) return;
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", text: message }]);
    try {
      const { data } = await api.post("/chat", { message });
      setChatMessages((prev) => [...prev, { role: "ai", text: data.reply }]);
      speak(data.reply);
    } catch (error) {
      const text = error.response?.data?.message || "AI chat failed.";
      setChatMessages((prev) => [...prev, { role: "ai", text }]);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Social Feed</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Share learning updates, follow skill partners, and discover useful posts.</p>
        </div>

        <form onSubmit={createPost} className="panel p-5">
          <h2 className="font-semibold">Create post</h2>
          <div className="mt-4 grid gap-3">
            <input className="field" placeholder="Title" value={postForm.title} onChange={(e) => setPostForm({ ...postForm, title: e.target.value })} />
            <textarea className="field min-h-28" placeholder="Content" value={postForm.content} onChange={(e) => setPostForm({ ...postForm, content: e.target.value })} />
            <input className="field" placeholder="Tags: coding, design, music" value={postForm.tags} onChange={(e) => setPostForm({ ...postForm, tags: e.target.value })} />
          </div>
          <button className="btn-primary mt-4"><Send size={16} /> Publish</button>
        </form>

        <div className="panel grid gap-3 p-4 md:grid-cols-[1fr_160px_140px_auto_auto]">
          <input className="field" placeholder="Search posts" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
          <input className="field" placeholder="Tag" value={filters.tag} onChange={(e) => setFilters({ ...filters, tag: e.target.value })} />
          <select className="field" value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })}>
            <option value="latest">Latest</option>
            <option value="oldest">Oldest</option>
          </select>
          <button className="btn-primary" onClick={() => { setFeedMode("all"); loadPosts("all"); }}>Apply</button>
          <button className="btn-secondary" onClick={() => setFeedMode(feedMode === "following" ? "all" : "following")}>
            {feedMode === "following" ? "All" : "Following"}
          </button>
        </div>

        <div className="space-y-4">
          {posts.map((post) => {
            const liked = post.likes?.some((id) => String(id) === String(user._id));
            const bookmarked = user.bookmarks?.some((id) => String(id) === String(post._id));
            const followsAuthor = user.following?.some((id) => String(id) === String(post.user?._id));
            const isAuthor = String(post.user?._id) === String(user._id);

            return (
              <article key={post._id} className="panel p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <img className="h-11 w-11 rounded-full object-cover" src={post.user?.profilePicture || `https://api.dicebear.com/9.x/initials/svg?seed=${post.user?.name}`} alt="" />
                    <div>
                      <h2 className="text-lg font-semibold">{post.title}</h2>
                      <p className="text-sm text-slate-500">by {post.user?.name} • {new Date(post.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  {!isAuthor && (
                    <button onClick={() => followUser(post.user._id)} className="btn-secondary">
                      <UserPlus size={16} /> {followsAuthor ? "Unfollow" : "Follow"}
                    </button>
                  )}
                </div>
                <p className="mt-4 whitespace-pre-wrap text-slate-700 dark:text-slate-200">{post.content}</p>
                <div className="mt-4 flex flex-wrap gap-2">{post.tags?.map((tag) => <SkillPill key={tag}>#{tag}</SkillPill>)}</div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => likePost(post._id)} className="btn-secondary"><Heart size={16} /> {liked ? "Liked" : "Like"} ({post.likes?.length || 0})</button>
                  <button onClick={() => bookmarkPost(post._id)} className="btn-secondary"><Bookmark size={16} /> {bookmarked ? "Saved" : "Bookmark"}</button>
                </div>
                <div className="mt-4 space-y-2">
                  {post.comments?.map((comment) => (
                    <div key={comment._id} className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800">
                      <span className="font-semibold">{comment.user?.name}: </span>{comment.text}
                    </div>
                  ))}
                </div>
                <form onSubmit={(e) => commentPost(e, post._id)} className="mt-4 flex gap-2">
                  <input className="field" placeholder="Write a comment" value={comments[post._id] || ""} onChange={(e) => setComments({ ...comments, [post._id]: e.target.value })} />
                  <button className="btn-primary"><MessageCircle size={16} /></button>
                </form>
              </article>
            );
          })}
          {posts.length === 0 && <div className="panel p-5 text-slate-500">No posts found.</div>}
        </div>
      </section>

      <aside className="space-y-6">
        <section className="panel p-5">
          <h2 className="flex items-center gap-2 font-semibold"><Bot size={18} /> Voice AI Assistant</h2>
          <div className="mt-4 max-h-80 space-y-2 overflow-y-auto">
            {chatMessages.map((message, index) => (
              <div key={index} className={`rounded-lg px-3 py-2 text-sm ${message.role === "user" ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"}`}>
                {message.text}
              </div>
            ))}
          </div>
          <form onSubmit={askAi} className="mt-4 flex gap-2">
            <input className="field" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask AI..." />
            <button type="button" onClick={startVoiceInput} className="btn-secondary" title="Voice input"><Mic size={16} /></button>
            <button className="btn-primary" title="Send"><Volume2 size={16} /></button>
          </form>
          {voiceStatus && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{voiceStatus}</p>}
        </section>

        <section className="panel p-5">
          <h2 className="font-semibold">How the feed works</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Posts are searchable by title, content, and tags. The following feed shows posts from users you follow.</p>
        </section>
      </aside>
    </div>
  );
}
