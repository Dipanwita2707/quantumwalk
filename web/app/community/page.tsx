"use client";

import { useEffect, useRef, useState } from "react";
import { ProductPage, ResourceState } from "@/components/ProductPage";
import { useResource } from "@/components/useResource";
import { ActionButton, ScienceIcon, Surface } from "@/components/ui/QuantumUI";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { api, useSession } from "@/lib/api";
import "./community.css";

type Post = { id: string; title: string; body: string; category: string; created_at: string; mine: boolean };
const categories = [{ value: "all", label: "All posts" }, { value: "discussion", label: "Discussions" }, { value: "project", label: "Projects" }, { value: "event", label: "Events" }];
const categoryLabel = (value: string) => categories.find(item => item.value === value)?.label ?? value;

export default function CommunityPage() {
  const { profile } = useSession();
  const [query, setQuery] = useState(""), [category, setCategory] = useState("all"), [offset, setOffset] = useState(0);
  const [composer, setComposer] = useState(false), [title, setTitle] = useState(""), [body, setBody] = useState(""), [postCategory, setPostCategory] = useState("discussion");
  const [consent, setConsent] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const titleInput = useRef<HTMLInputElement>(null), composeButton = useRef<HTMLButtonElement>(null);
  const posts = useResource<Post[]>(`/api/v1/community/posts?q=${encodeURIComponent(query)}&category=${category}&offset=${offset}`);
  const events = useResource<Post[]>("/api/v1/community/posts?category=event&offset=0");
  useEffect(() => { if (composer) titleInput.current?.focus(); }, [composer]);
  function closeComposer() { setComposer(false); composeButton.current?.focus(); }
  async function change(path: string, payload?: object, method = "POST") {
    if (!profile?.authenticated || busy) return false;
    setBusy(true); setError(""); setNotice("");
    try {
      await api(path, { method, ...(payload ? { body: JSON.stringify(payload) } : {}) }, profile.csrf_token);
      posts.reload(); events.reload();
      setNotice(method === "DELETE" ? "Post deleted." : path.endsWith("/report") ? "Your concern was sent for review." : "Your post was published.");
      return true;
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The request failed"); return false; }
    finally { setBusy(false); }
  }
  return <ProductPage className="q-ui-community" title="Quantum community" eyebrow="QUESTIONS, IDEAS & DISCOVERIES" description="Ask questions, share discoveries, and learn together." actions={<ActionButton ref={composeButton} onClick={() => composer ? closeComposer() : setComposer(true)} aria-expanded={composer} aria-controls="community-composer">{composer ? "Close composer" : "New post"}</ActionButton>}>
    <div className="q-ui-community-toolbar">
      <SegmentedControl label="Post category" value={category} onChange={value => { setCategory(value); setOffset(0); }} items={categories} />
      <label className="q-ui-community-search">Search posts<input type="search" maxLength={120} value={query} placeholder="Find a question or project" onChange={event => { setQuery(event.target.value); setOffset(0); }} /></label>
    </div>
    {error && <p role="alert" className="content-error">{error}</p>}{notice && <p role="status">{notice}</p>}
    <div className="q-ui-community-layout"><div className="q-ui-community-feed">
      {composer && <Surface as="section" id="community-composer" className="content-card" onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); closeComposer(); } }}>
        <h2>Start a conversation</h2><p className="science-muted">Share deliberately. Your private notebooks stay private.</p>
        <form onSubmit={async event => {
          event.preventDefault();
          if (await change("/api/v1/community/posts", { title, body, category: postCategory, consent_public: consent })) {
            setTitle(""); setBody(""); setConsent(false); closeComposer();
          }
        }}>
          <label>Title<input ref={titleInput} maxLength={120} disabled={busy} required value={title} onChange={event => setTitle(event.target.value)} /></label>
          <label>Post type<select disabled={busy} value={postCategory} onChange={event => setPostCategory(event.target.value)}>{categories.slice(1).map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
          <label>Your message<textarea disabled={busy} minLength={10} maxLength={10000} required value={body} onChange={event => setBody(event.target.value)} /></label>
          <label className="science-radio"><input disabled={busy} type="checkbox" checked={consent} required onChange={event => setConsent(event.target.checked)} />I understand this content will be visible to other community members.</label>
          <ActionButton type="submit" disabled={busy || !consent}>{busy ? "Publishing..." : "Publish post"}</ActionButton>
        </form>
      </Surface>}
      <ResourceState {...posts} />
      {!posts.loading && !posts.error && <div className="community-posts">{posts.data?.map(post => <Surface as="article" className="content-card q-ui-post" key={post.id}>
        <header><span className="q-ui-avatar" aria-hidden="true"><ScienceIcon name={post.category === "project" ? "circuit" : post.category === "event" ? "users" : "atom"} /></span><div><span>{categoryLabel(post.category)}</span><time dateTime={post.created_at}>Posted {new Date(post.created_at).toLocaleDateString()}</time></div>{post.mine && <small>Your post</small>}</header>
        <h2>{post.title}</h2><p className="q-ui-post-body">{post.body}</p>
        <details className="q-ui-post-actions"><summary>Post actions</summary><div className="card-actions">
          {post.mine && <ActionButton tone="secondary" disabled={busy} onClick={() => { if (confirm("Delete this public post?")) void change(`/api/v1/community/posts/${post.id}`, undefined, "DELETE"); }}>Delete my post</ActionButton>}
          <ActionButton tone="quiet" disabled={busy} onClick={() => { const reason = prompt("Describe the concern (at least 10 characters). A moderator will review it."); if (reason && reason.length >= 10) void change(`/api/v1/community/posts/${post.id}/report`, { reason }); }}>Report concern</ActionButton>
        </div></details>
      </Surface>)}</div>}
      {!posts.loading && !posts.error && posts.data?.length === 0 && <Surface as="section" className="q-ui-community-empty"><ScienceIcon name="users" size={32} /><h2>{query || category !== "all" ? "No posts match" : "No conversations yet"}</h2><p>{query || category !== "all" ? "Try another search or return to all conversations." : "Start with a question about an experiment or share what you learned."}</p>{(query || category !== "all") && <ActionButton tone="secondary" onClick={() => { setQuery(""); setCategory("all"); setOffset(0); }}>Reset filters</ActionButton>}</Surface>}
      <nav className="card-actions" aria-label="Post pages"><ActionButton tone="secondary" disabled={posts.loading || !offset} onClick={() => setOffset(value => Math.max(0, value - 20))}>Previous posts</ActionButton><ActionButton tone="secondary" disabled={posts.loading || (posts.data?.length ?? 0) < 20} onClick={() => setOffset(value => value + 20)}>More posts</ActionButton></nav>
    </div><Surface as="aside" className="q-ui-community-events" aria-label="Community events"><h2>Community events</h2><ResourceState {...events} />
      {!events.loading && !events.error && events.data?.slice(0, 3).map(post => <article key={post.id}><span className="q-ui-event-icon" aria-hidden="true"><ScienceIcon name="spark" /></span><div><h3>{post.title}</h3><p>{post.body}</p><time dateTime={post.created_at}>Posted {new Date(post.created_at).toLocaleDateString()}</time></div></article>)}
      {!events.loading && !events.error && events.data?.length === 0 && <p>No events have been shared yet. Community event posts will appear here.</p>}
      <ActionButton tone="secondary" onClick={() => { setCategory("event"); setOffset(0); setQuery(""); }}>Browse event posts</ActionButton>
    </Surface></div>
  </ProductPage>;
}
