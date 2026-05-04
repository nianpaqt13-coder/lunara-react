import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Home, Newspaper, Clapperboard, Compass, Users, MessageCircle, Gamepad2,
  Wallet, User, Settings, Search, Bell, Heart, MessageSquare, Share2, Camera,
  Video, Image, Send, Lock, Shield, Eye, Globe, LogOut, Edit3, MoreHorizontal,
  Star, Rocket, Moon, X, Trash2, Save, Flag, ArrowLeft, Check, UserPlus,
  Flame, Laugh, Smile, Frown, Zap, Paperclip, Mic, FileText, Forward, Reply,
  Copy, Crown, Sparkles, Gift, Trophy, Plus, Hash, UserCheck
} from "lucide-react";

import { auth, db, storage } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";
import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit, onSnapshot,
  orderBy, query, runTransaction, serverTimestamp, setDoc, updateDoc,
  where, increment, arrayUnion
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const demoUsers = [
  { id: "luna", name: "Luna Hart", username: "luna", online: true, followers: "24.8K", bio: "Mooncore creator and cozy gamer." },
  { id: "kai", name: "Kai Nova", username: "kai", online: true, followers: "9.1K", bio: "Short videos, edits, and vibes." },
  { id: "maya", name: "Maya Sol", username: "maya", online: false, followers: "13.2K", bio: "Digital art and study notes." },
  { id: "zion", name: "Zion Cruz", username: "zion", online: true, followers: "31.5K", bio: "Games, music, and live rooms." }
];

const demoContacts = [
  {
    id: "maria",
    name: "Maria K.",
    username: "maria",
    online: true,
    mutuals: 8,
    unread: 1,
    isGroup: false,
    messages: [
      { id: makeId(), from: "them", text: "Hey! Loved your new moon artwork!", type: "text", reactions: [] },
      { id: makeId(), from: "me", text: "Thanks! It was so peaceful to draw.", type: "text", reactions: [] },
      { id: makeId(), from: "them", text: "The shading is beautiful.", type: "text", reactions: ["💜"] }
    ]
  },
  {
    id: "creators",
    name: "Lunara Creators",
    username: "group",
    online: true,
    mutuals: 12,
    unread: 2,
    isGroup: true,
    messages: [
      { id: makeId(), from: "them", text: "Welcome to the creator lounge!", type: "text", reactions: [] },
      { id: makeId(), from: "them", text: "Start a scrambled word game anytime.", type: "text", reactions: ["🔥"] }
    ]
  },
  {
    id: "ben",
    name: "Ben C.",
    username: "ben",
    online: true,
    mutuals: 3,
    unread: 0,
    isGroup: false,
    messages: [
      { id: makeId(), from: "them", text: "Telescope setup complete!", type: "text", reactions: [] },
      { id: makeId(), from: "me", text: "That sounds amazing.", type: "text", reactions: [] }
    ]
  },
  {
    id: "lily",
    name: "Lily R.",
    username: "lily",
    online: false,
    mutuals: 6,
    unread: 0,
    isGroup: false,
    messages: [{ id: makeId(), from: "them", text: "Loved your art!", type: "text", reactions: [] }]
  }
];

const groups = [
  { name: "Lunara Creators", category: "Creator Hub", members: "18.4K", desc: "Grow, collab, and unlock future creator payouts.", color: "purple" },
  { name: "Moon Art Club", category: "Art", members: "8.7K", desc: "Share edits, portraits, prompts, and cozy artwork.", color: "pink" },
  { name: "Gaming Lounge", category: "Games", members: "22.1K", desc: "Play mini-games, join challenges, and earn Luna Coins.", color: "blue" },
  { name: "Study Buddies", category: "School", members: "5.6K", desc: "Notes, reminders, productivity, and group motivation.", color: "teal" }
];

const reels = [
  { user: "Luna Hart", caption: "Moonlight desk setup reveal 🌙", likes: "45.2K" },
  { user: "Kai Nova", caption: "POV: your group chat starts a word game", likes: "28.9K" },
  { user: "Maya Sol", caption: "Drawing a dreamy glass profile card", likes: "19.4K" }
];

const wordBank = [
  { word: "LUNARA", clue: "The name of our social universe" },
  { word: "CREATOR", clue: "Someone who posts content" },
  { word: "MESSAGE", clue: "You send this in chat" },
  { word: "FOLLOW", clue: "Do this to see more posts" },
  { word: "GROUP", clue: "A space for communities" }
];

const defaultUserProfile = (firebaseUser, extra = {}) => ({
  uid: firebaseUser.uid,
  name: extra.name || firebaseUser.displayName || "Lunara User",
  username: extra.username || "user",
  email: firebaseUser.email || "",
  bio: extra.bio || "New to Lunara. Making my social universe cute.",
  location: extra.location || "Not set",
  birthday: extra.birthday || "Not set",
  website: extra.website || "Not set",
  joined: extra.joined || new Date().toLocaleDateString(),
  avatar: extra.avatar || "",
  cover: extra.cover || "",
  followers: extra.followers || 0,
  following: extra.following || 0,
  friends: extra.friends || 0,
  coins: extra.coins || 120,
  creator: extra.creator || false
});

function usernameKey(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9._]/g, "");
}

function isStrongPassword(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password);
}

async function uploadFile(path, file) {
  if (!file) return "";
  const fileRef = ref(storage, `${path}/${Date.now()}-${file.name}`);
  await uploadBytes(fileRef, file);
  return await getDownloadURL(fileRef);
}

function Avatar({ src, size = "normal" }) {
  return (
    <div className={`avatar avatar-${size}`} style={src ? { backgroundImage: `url(${src})` } : undefined} />
  );
}

function MediaIcon({ type }) {
  if (type === "rocket") return <Rocket />;
  if (type === "camera") return <Camera />;
  if (type === "video") return <Video />;
  if (type === "stars") return <Star />;
  return <Moon />;
}

export default function App() {
  const [authMode, setAuthMode] = useState("signup");
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [page, setPage] = useState("dashboard");
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState({});
  const [contacts, setContacts] = useState(demoContacts);
  const [activeContactId, setActiveContactId] = useState("maria");
  const [postMenuId, setPostMenuId] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const userRef = doc(db, "users", firebaseUser.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        setUser(defaultUserProfile(firebaseUser, snap.data()));
      } else {
        const profile = defaultUserProfile(firebaseUser);
        await setDoc(userRef, profile, { merge: true });
        setUser(profile);
      }

      setLoading(false);
    });

    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(50));
    const unsub = onSnapshot(q, (snapshot) => {
      const onlinePosts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (onlinePosts.length === 0) {
        setPosts([
          {
            id: "demo-1",
            uid: "demo",
            name: "Luna Hart",
            username: "luna",
            text: "Welcome to Lunara — where Facebook, TikTok, Messenger, and Instagram vibes meet glassmorphism.",
            media: "moon",
            theme: "",
            image: "",
            video: "",
            reactions: { like: 12, love: 8, fire: 4 },
            createdAtLabel: "Demo"
          },
          {
            id: "demo-2",
            uid: "demo2",
            name: "Kai Nova",
            username: "kai",
            text: "Group chats now have games. Try Scrambled Words with your friends.",
            media: "rocket",
            theme: "blue",
            image: "",
            video: "",
            reactions: { like: 22, wow: 5, haha: 3 },
            createdAtLabel: "Demo"
          }
        ]);
      } else {
        setPosts(onlinePosts);
      }
    });

    return unsub;
  }, [user]);

  const activeContact = useMemo(
    () => contacts.find((contact) => contact.id === activeContactId) || contacts[0],
    [contacts, activeContactId]
  );

  async function handleAuth(event) {
    event.preventDefault();
    setAuthError("");

    const form = new FormData(event.currentTarget);
    const username = usernameKey(form.get("username"));
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    const name = String(form.get("name") || "").trim() || username;

    try {
      if (authMode === "signup") {
        if (!username || username.length < 3) throw new Error("Username must be at least 3 characters.");
        if (!isStrongPassword(password)) {
          throw new Error("Use a strong password: 8+ chars, uppercase, lowercase, number, and symbol.");
        }

        const usernameRef = doc(db, "usernames", username);

        await runTransaction(db, async (transaction) => {
          const taken = await transaction.get(usernameRef);
          if (taken.exists()) throw new Error("Username is already taken.");

          const credential = await createUserWithEmailAndPassword(auth, email, password);
          await updateProfile(credential.user, { displayName: name });

          const profile = defaultUserProfile(credential.user, {
            name,
            username,
            email,
            creator: false
          });

          transaction.set(doc(db, "users", credential.user.uid), profile);
          transaction.set(usernameRef, { uid: credential.user.uid, email, username });
        });
      } else {
        const usernameSnap = await getDoc(doc(db, "usernames", username));
        if (!usernameSnap.exists()) throw new Error("Username not found.");

        const linkedEmail = usernameSnap.data().email;
        await signInWithEmailAndPassword(auth, linkedEmail, password);
      }

      setPage("dashboard");
    } catch (error) {
      setAuthError(error.message);
    }
  }

  async function logout() {
    await signOut(auth);
    setUser(null);
    setPage("dashboard");
  }

  function openPage(nextPage) {
    setPage(nextPage);
    setPostMenuId(null);
    setMobileChatOpen(false);
    setTimeout(() => document.querySelector(".content")?.scrollTo({ top: 0, behavior: "smooth" }), 0);
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="brand"><div className="logo-mark" /><span>Lunara</span></div>
        <p>Loading your universe...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen authMode={authMode} setAuthMode={setAuthMode} handleAuth={handleAuth} authError={authError} />;
  }

  return (
    <section className="app-shell glass">
      <Sidebar page={page} openPage={openPage} />

      <main className="main">
        <Topbar user={user} logout={logout} />
        <section className="content">
          {page === "dashboard" && <DashboardPage user={user} posts={posts} setPosts={setPosts} contacts={contacts} openPage={openPage} postMenuId={postMenuId} setPostMenuId={setPostMenuId} setEditingPost={setEditingPost} />}
          {page === "feed" && <FeedPage user={user} posts={posts} setPosts={setPosts} comments={comments} setComments={setComments} postMenuId={postMenuId} setPostMenuId={setPostMenuId} setEditingPost={setEditingPost} />}
          {page === "reels" && <ReelsPage />}
          {page === "explore" && <ExplorePage openPage={openPage} />}
          {page === "groups" && <GroupsPage />}
          {page === "messages" && <MessagesPage contacts={contacts} setContacts={setContacts} activeContact={activeContact} setActiveContactId={setActiveContactId} mobileChatOpen={mobileChatOpen} setMobileChatOpen={setMobileChatOpen} user={user} />}
          {page === "friends" && <FriendsPage currentUser={user} />}
          {page === "games" && <GamesPage user={user} setUser={setUser} />}
          {page === "wallet" && <WalletPage user={user} />}
          {page === "profile" && <ProfilePage user={user} setUser={setUser} posts={posts} setPosts={setPosts} postMenuId={postMenuId} setPostMenuId={setPostMenuId} setEditingPost={setEditingPost} />}
          {page === "settings" && <SettingsPage user={user} setUser={setUser} logout={logout} />}
        </section>
      </main>

      {editingPost && <EditPostModal editingPost={editingPost} setEditingPost={setEditingPost} setPosts={setPosts} />}
    </section>
  );
}

function AuthScreen({ authMode, setAuthMode, handleAuth, authError }) {
  return (
    <section className="auth-screen">
      <div className="auth-card glass">
        <div className="auth-panel">
          <div className="brand auth-brand"><div className="logo-mark" /><span>Lunara</span></div>
          <h1>Welcome to Lunara</h1>
          <p className="auth-subtitle">A cute glass social universe for posts, reels, friends, real-time chats, groups, mini-games, and creators.</p>

          <div className="auth-tabs">
            <button className={`auth-tab ${authMode === "signup" ? "active" : ""}`} onClick={() => setAuthMode("signup")} type="button">Sign up</button>
            <button className={`auth-tab ${authMode === "login" ? "active" : ""}`} onClick={() => setAuthMode("login")} type="button">Log in</button>
          </div>

          <form className="auth-form" onSubmit={handleAuth}>
            {authMode === "signup" && (
              <>
                <label><span>Display Name</span><input name="name" placeholder="Sarah J." required /></label>
                <label><span>Email Address</span><input name="email" type="email" placeholder="you@lunara.net" required /></label>
              </>
            )}

            <label><span>Username</span><input name="username" placeholder="yourusername" required /></label>
            <label><span>Password</span><input name="password" type="password" placeholder="Strong password" required /></label>

            {authMode === "signup" && <p className="tiny-note">Password must include uppercase, lowercase, number, symbol, and 8+ characters. Username must be unique.</p>}
            {authError && <p className="error-box">{authError}</p>}

            <button className="primary-btn" type="submit">{authMode === "signup" ? "Create Account" : "Log In"}</button>
          </form>
        </div>

        <div className="auth-art">
          <div className="planet"><div className="orbit" /></div>
          <h2>Share your orbit.</h2>
          <p>Facebook feed, Messenger chats, TikTok reels, and Instagram-style profiles in one Lunara universe.</p>
        </div>
      </div>
    </section>
  );
}

function Sidebar({ page, openPage }) {
  const items = [
    { id: "dashboard", label: "Home", icon: Home },
    { id: "feed", label: "Feed", icon: Newspaper },
    { id: "reels", label: "Reels", icon: Clapperboard },
    { id: "explore", label: "Explore", icon: Compass },
    { id: "groups", label: "Groups", icon: Hash },
    { id: "messages", label: "Messages", icon: MessageCircle, badge: 2 },
    { id: "friends", label: "Friends", icon: Users },
    { id: "games", label: "Games", icon: Gamepad2 },
    { id: "wallet", label: "Creator", icon: Wallet },
    { id: "profile", label: "Profile", icon: User },
    { id: "settings", label: "Settings", icon: Settings }
  ];

  return (
    <aside className="sidebar">
      <div className="brand sidebar-brand"><div className="logo-mark" /><span>Lunara</span></div>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button key={item.id} className={`nav-item ${page === item.id ? "active" : ""}`} onClick={() => openPage(item.id)} aria-label={item.label}>
            <Icon />
            <span className="nav-label">{item.label}</span>
            {item.badge && <span className="badge">{item.badge}</span>}
          </button>
        );
      })}
    </aside>
  );
}

function Topbar({ user, logout }) {
  return (
    <header className="topbar">
      <div className="search-box"><Search /><input placeholder="Search Lunara..." /></div>
      <div className="top-actions">
        <button className="icon-btn notification-btn"><Bell /><span className="badge">3</span></button>
        <Avatar src={user.avatar} />
        <div className="top-user"><strong>{user.name}</strong><button onClick={logout}>Log Out</button></div>
      </div>
    </header>
  );
}

function Stories({ openPage }) {
  const storyList = [{name:"You", self:true}, ...demoUsers];
  return (
    <div className="stories-row">
      {storyList.map((s) => (
        <button className="story-card" key={s.name} onClick={() => openPage?.("reels")}>
          <div className="story-avatar">{s.self ? <Plus /> : <Sparkles />}</div>
          <span>{s.name}</span>
        </button>
      ))}
    </div>
  );
}

function Composer({ user, setPosts }) {
  const [text, setText] = useState("");
  const [draftFile, setDraftFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [posting, setPosting] = useState(false);

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setDraftFile(file);
    setPreview(URL.createObjectURL(file));
  }

  async function createPost(mediaType) {
    if (!text.trim() && !draftFile) {
      alert("Write something or upload a file first.");
      return;
    }

    setPosting(true);

    try {
      let fileUrl = "";
      let videoUrl = "";

      if (draftFile) {
        const uploaded = await uploadFile(`posts/${user.uid}`, draftFile);
        if (draftFile.type.startsWith("video/")) videoUrl = uploaded;
        else fileUrl = uploaded;
      }

      await addDoc(collection(db, "posts"), {
        uid: user.uid,
        name: user.name,
        username: user.username,
        avatar: user.avatar || "",
        text: text.trim() || "Shared something new.",
        media: mediaType,
        theme: mediaType === "video" ? "blue" : mediaType === "camera" ? "pink" : "",
        image: fileUrl,
        video: videoUrl,
        reactions: {},
        shares: 0,
        commentsCount: 0,
        createdAt: serverTimestamp(),
        createdAtLabel: "Just now"
      });

      setText("");
      setDraftFile(null);
      setPreview("");
    } catch (error) {
      alert(error.message);
    }

    setPosting(false);
  }

  return (
    <div className="card composer">
      <div className="composer-row">
        <Avatar src={user.avatar} />
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="What's happening on Lunara?" />
      </div>

      {preview && (
        <div className="composer-preview">
          {draftFile?.type.startsWith("video/") ? <video src={preview} controls /> : <img src={preview} alt="Preview" />}
          <button className="remove-preview" onClick={() => { setDraftFile(null); setPreview(""); }}><X /></button>
        </div>
      )}

      <div className="composer-actions">
        <label className="secondary-btn file-btn"><Image /> Photo / Video <input type="file" accept="image/*,video/*" onChange={handleFile} /></label>
        <button className="secondary-btn" onClick={() => createPost("camera")} disabled={posting}><Camera /> Post</button>
        <button className="secondary-btn" onClick={() => createPost("video")} disabled={posting}><Video /> Reel</button>
        <button className="secondary-btn" onClick={() => createPost("stars")} disabled={posting}><Star /> Mood</button>
      </div>
    </div>
  );
}

function PostList({ user, posts, setPosts, postMenuId, setPostMenuId, setEditingPost, comments, setComments }) {
  async function deletePost(post) {
    if (post.uid !== user.uid && post.id.startsWith("demo") === false) {
      alert("You can only delete your own posts.");
      return;
    }

    if (post.id.startsWith("demo")) {
      setPosts((current) => current.filter((p) => p.id !== post.id));
    } else {
      await deleteDoc(doc(db, "posts", post.id));
    }

    setPostMenuId(null);
  }

  async function react(post, reaction) {
    if (post.id.startsWith("demo")) return;
    await updateDoc(doc(db, "posts", post.id), {
      [`reactions.${reaction}`]: increment(1)
    });
  }

  async function share(post) {
    if (!post.id.startsWith("demo")) {
      await updateDoc(doc(db, "posts", post.id), { shares: increment(1) });
    }
    alert("Post shared to your Lunara circle.");
  }

  function addComment(postId, text) {
    if (!text.trim()) return;
    setComments?.((current) => ({
      ...current,
      [postId]: [...(current?.[postId] || []), { user: user.name, text }]
    }));
  }

  return (
    <>
      {posts.map((post) => (
        <article className="card post" key={post.id}>
          <div className="post-head">
            <Avatar src={post.avatar || (post.uid === user.uid ? user.avatar : "")} />
            <div className="post-meta">
              <strong>{post.name}</strong>
              <span>@{post.username || "lunara"} • {post.createdAtLabel || "Now"}</span>
            </div>

            <button className="more" onClick={() => setPostMenuId(postMenuId === post.id ? null : post.id)}><MoreHorizontal /></button>

            {postMenuId === post.id && (
              <div className="post-menu glass">
                <button onClick={() => { setEditingPost(post); setPostMenuId(null); }}><Edit3 /> Edit post</button>
                <button onClick={() => alert("Post saved.")}><Save /> Save post</button>
                <button onClick={() => alert("Post reported.")}><Flag /> Report post</button>
                <button className="danger-text" onClick={() => deletePost(post)}><Trash2 /> Delete post</button>
              </div>
            )}
          </div>

          <p className="post-text">{post.text}</p>

          {post.video ? (
            <div className="media"><video src={post.video} controls /></div>
          ) : post.image ? (
            <div className="media"><img src={post.image} alt="Uploaded post" /></div>
          ) : (
            <div className={`media ${post.theme || ""}`}><MediaIcon type={post.media} /></div>
          )}

          <div className="reaction-bar">
            {["like", "love", "haha", "wow", "sad", "fire"].map((r) => (
              <button key={r} onClick={() => react(post, r)}>{reactionEmoji(r)} {post.reactions?.[r] || ""}</button>
            ))}
          </div>

          <PostActions onShare={() => share(post)} />

          {setComments && <CommentBox comments={comments?.[post.id] || []} onComment={(text) => addComment(post.id, text)} />}
        </article>
      ))}
    </>
  );
}

function reactionEmoji(type) {
  return { like: "👍", love: "💜", haha: "😂", wow: "😮", sad: "😢", fire: "🔥" }[type] || "👍";
}

function PostActions({ onShare }) {
  const [liked, setLiked] = useState(false);
  return (
    <div className="post-actions">
      <button className={liked ? "liked" : ""} onClick={() => setLiked(!liked)}><Heart /><span>{liked ? "Liked" : "Like"}</span></button>
      <button onClick={() => alert("Scroll down to comment box.")}><MessageSquare /><span>Comment</span></button>
      <button onClick={onShare}><Share2 /><span>Share</span></button>
    </div>
  );
}

function CommentBox({ comments, onComment }) {
  const [text, setText] = useState("");
  return (
    <div className="comment-box">
      {comments.map((c, i) => <div className="comment" key={i}><strong>{c.user}</strong> {c.text}</div>)}
      <form onSubmit={(e) => { e.preventDefault(); onComment(text); setText(""); }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a comment..." />
        <button><Send /></button>
      </form>
    </div>
  );
}

function DashboardPage(props) {
  const onlineFriends = props.contacts.filter((c) => c.online).slice(0, 4);
  return (
    <>
      <h1 className="page-title">Home</h1>
      <Stories openPage={props.openPage} />
      <div className="grid-feed">
        <div>
          <Composer user={props.user} setPosts={props.setPosts} />
          <PostList {...props} />
        </div>
        <aside className="side-stack">
          <DailyCard />
          <div className="card side-card">
            <h3>Friends Online</h3>
            {onlineFriends.map((friend) => (
              <button className="friend-line" key={friend.id} onClick={() => props.openPage("messages")}>
                <Avatar size="small" /><strong>{friend.name}</strong><span className="online-dot" />
              </button>
            ))}
          </div>
          <div className="card side-card">
            <h3>Recent Messages</h3>
            {props.contacts.slice(0, 3).map((contact) => (
              <div className="message-line" key={contact.id}><Avatar size="small" /><div><strong>{contact.name}</strong><br /><span>{contact.messages.at(-1)?.text || "No messages yet."}</span></div></div>
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}

function FeedPage(props) {
  const [comments, setComments] = useState({});
  return (
    <>
      <h1 className="page-title">News Feed</h1>
      <div className="grid-feed">
        <div>
          <Composer user={props.user} setPosts={props.setPosts} />
          <PostList {...props} comments={comments} setComments={setComments} />
        </div>
        <aside className="side-stack">
          <TrendingCard />
          <CreatorPreview />
        </aside>
      </div>
    </>
  );
}

function ReelsPage() {
  return (
    <>
      <h1 className="page-title">Reels</h1>
      <div className="reels-grid">
        {reels.map((reel, index) => (
          <div className="reel-card glass" key={reel.caption}>
            <div className={`reel-art reel-${index}`}><Clapperboard /></div>
            <div className="reel-info">
              <h3>{reel.user}</h3>
              <p>{reel.caption}</p>
              <div className="reel-actions"><button><Heart /> {reel.likes}</button><button><MessageSquare /></button><button><Share2 /></button><button>Follow</button></div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function ExplorePage({ openPage }) {
  return (
    <>
      <h1 className="page-title">Explore</h1>
      <div className="explore-grid">
        <TrendingCard />
        <div className="card"><h2>Suggested Creators</h2>{demoUsers.map((u) => <CreatorRow key={u.id} user={u} />)}</div>
        <div className="card"><h2>Featured Groups</h2>{groups.slice(0,3).map((g) => <div className="group-line" key={g.name}><Hash /><div><strong>{g.name}</strong><p>{g.members} members</p></div><button onClick={() => openPage("groups")}>View</button></div>)}</div>
        <div className="card"><h2>Viral Now</h2><div className="viral-grid"><div /><div /><div /><div /></div></div>
      </div>
    </>
  );
}

function GroupsPage() {
  return (
    <>
      <h1 className="page-title">Groups</h1>
      <div className="groups-grid">
        {groups.map((group) => <div className={`card group-card ${group.color}`} key={group.name}><div className="group-cover"><Users /></div><h2>{group.name}</h2><p>{group.desc}</p><span>{group.category} • {group.members} members</span><div className="group-actions"><button className="primary-btn"><UserPlus /> Join Group</button><button className="secondary-btn"><MessageCircle /> Chat</button></div></div>)}
      </div>
    </>
  );
}

function MessagesPage({ contacts, setContacts, activeContact, setActiveContactId, mobileChatOpen, setMobileChatOpen, user }) {
  const [message, setMessage] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [game, setGame] = useState(null);
  const [answer, setAnswer] = useState("");
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [activeContact]);

  function openContact(id) {
    setActiveContactId(id);
    setMobileChatOpen(true);
    setContacts((current) => current.map((c) => c.id === id ? { ...c, unread: 0 } : c));
  }

  function addMessage(msg) {
    setContacts((current) =>
      current.map((contact) =>
        contact.id === activeContact.id
          ? { ...contact, messages: [...contact.messages, { id: makeId(), from: "me", reactions: [], replyTo: replyTo?.text || "", ...msg }] }
          : contact
      )
    );
    setReplyTo(null);
  }

  function sendMessage(event) {
    event.preventDefault();
    if (!message.trim()) return;
    addMessage({ text: message.trim(), type: "text" });
    setMessage("");
  }

  async function attachFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    const type = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "file";
    addMessage({ text: file.name, type, fileUrl: localUrl });
  }

  function reactMessage(messageId, emoji) {
    setContacts((current) =>
      current.map((contact) =>
        contact.id === activeContact.id
          ? { ...contact, messages: contact.messages.map((m) => m.id === messageId ? { ...m, reactions: [...(m.reactions || []), emoji] } : m) }
          : contact
      )
    );
  }

  function forwardMessage(msg) {
    alert(`Forwarded: ${msg.text}`);
  }

  function startGame() {
    const item = wordBank[Math.floor(Math.random() * wordBank.length)];
    const scrambled = item.word.split("").sort(() => Math.random() - 0.5).join("");
    setGame({ ...item, scrambled });
  }

  function submitGame() {
    if (!game) return;
    if (answer.trim().toUpperCase() === game.word) {
      addMessage({ text: `Solved the Scrambled Word: ${game.word}! +25 Luna Coins`, type: "game" });
      setGame(null);
      setAnswer("");
    } else {
      alert("Try again!");
    }
  }

  return (
    <>
      <h1 className="page-title">Messages</h1>
      <div className={`messages-layout ${mobileChatOpen ? "chat-open" : ""}`}>
        <div className="card contacts-panel">
          <h2>Chats</h2>
          <button className="secondary-btn create-group-btn"><Users /> Create Group Chat</button>
          <div className="search-box local-search"><Search /><input placeholder="Search conversations" /></div>
          {contacts.map((contact) => (
            <button className={`contact ${contact.id === activeContact.id ? "active" : ""}`} key={contact.id} onClick={() => openContact(contact.id)}>
              <Avatar size="small" />
              <div><strong>{contact.name}</strong><br /><small>{contact.isGroup ? "Group chat" : contact.online ? "Online" : "Last seen recently"}</small></div>
              {contact.unread > 0 && <span className="unread-dot">{contact.unread}</span>}
            </button>
          ))}
        </div>

        <div className="card chat-box">
          <div className="chat-header">
            <button className="back-chat-btn" onClick={() => setMobileChatOpen(false)}><ArrowLeft /></button>
            <Avatar size="small" />
            <div><h2>{activeContact.name}</h2><span className="active-now">{activeContact.isGroup ? "Group chat • games enabled" : activeContact.online ? "Active Now" : "Offline"}</span></div>
            {activeContact.isGroup && <button className="secondary-btn chat-game-btn" onClick={startGame}><Gamepad2 /> Play</button>}
          </div>

          {game && (
            <div className="game-strip">
              <strong>Scrambled Word:</strong> <span>{game.scrambled}</span>
              <small>{game.clue}</small>
              <input value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Your answer" />
              <button onClick={submitGame}>Submit</button>
            </div>
          )}

          <div className="chat-body" ref={chatRef}>
            {activeContact.messages.map((chat) => (
              <MessageBubble key={chat.id} chat={chat} setReplyTo={setReplyTo} reactMessage={reactMessage} forwardMessage={forwardMessage} />
            ))}
          </div>

          {replyTo && <div className="reply-preview">Replying to: {replyTo.text}<button onClick={() => setReplyTo(null)}><X /></button></div>}

          <form className="chat-input" onSubmit={sendMessage}>
            <label className="chat-tool"><Paperclip /><input type="file" accept="image/*,video/*,.pdf,.doc,.docx,.txt" onChange={attachFile} /></label>
            <button type="button" className="chat-tool" onClick={() => addMessage({ text: "Voice message 0:07", type: "voice" })}><Mic /></button>
            <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type your message..." />
            <button className="send-btn" type="submit"><Send /></button>
          </form>
        </div>
      </div>
    </>
  );
}

function MessageBubble({ chat, setReplyTo, reactMessage, forwardMessage }) {
  return (
    <div className={`bubble-wrap ${chat.from === "me" ? "me" : ""}`}>
      <div className={`bubble ${chat.from === "me" ? "me" : ""}`}>
        {chat.replyTo && <div className="reply-quote">{chat.replyTo}</div>}
        {chat.type === "image" && <img src={chat.fileUrl} alt={chat.text} />}
        {chat.type === "video" && <video src={chat.fileUrl} controls />}
        {chat.type === "file" && <div className="file-message"><FileText /> {chat.text}</div>}
        {chat.type === "voice" && <div className="voice-message"><Mic /> {chat.text}</div>}
        {chat.type === "game" && <div className="game-message"><Trophy /> {chat.text}</div>}
        {(!chat.type || chat.type === "text") && chat.text}
        <div className="message-reactions">{chat.reactions?.map((r, i) => <span key={i}>{r}</span>)}</div>
      </div>
      <div className="message-tools">
        <button onClick={() => setReplyTo(chat)}><Reply /></button>
        <button onClick={() => reactMessage(chat.id, "💜")}>💜</button>
        <button onClick={() => reactMessage(chat.id, "😂")}>😂</button>
        <button onClick={() => forwardMessage(chat)}><Forward /></button>
        <button onClick={() => navigator.clipboard?.writeText(chat.text || "")}><Copy /></button>
      </div>
    </div>
  );
}

function FriendsPage({ currentUser }) {
  const [following, setFollowing] = useState({});
  const extraFriends = [
    ...demoUsers,
    { name: "Aisha P.", username: "aisha", online: true, mutuals: 9 },
    { name: "Ethan H.", username: "ethan", online: false, mutuals: 2 },
    { name: "Dohen D.", username: "dohen", online: true, mutuals: 7 },
    { name: "Bayns P.", username: "bayns", online: false, mutuals: 1 }
  ];

  return (
    <>
      <h1 className="page-title">Friends & Following</h1>
      <div className="friends-layout">
        <div className="card">
          <h2>Pending Requests</h2>
          <div className="request-grid">
            {["Aisha P.", "Ethan M.", "Doyan C."].map((name) => (
              <div className="request" key={name}><Avatar size="small" /><div><h3>{name}</h3><p className="muted">3 mutual friends</p></div><div className="request-actions"><button className="accept"><Check /> Accept</button><button className="decline"><X /> Decline</button></div></div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2>People You May Know</h2>
          <div className="search-box local-search"><Search /><input placeholder="Search people" /></div>
          <div className="friend-card-grid">
            {extraFriends.map((friend) => (
              <div className="friend-profile-card" key={friend.username}>
                <div className="friend-square" />
                <h3>{friend.name}</h3>
                <p>@{friend.username} • {friend.mutuals || 3} mutuals</p>
                <span className={`friend-status ${friend.online ? "" : "offline"}`}>{friend.online ? "Online" : "Offline"}</span>
                <button className="mini-action-btn" onClick={() => setFollowing((f) => ({ ...f, [friend.username]: !f[friend.username] }))}>{following[friend.username] ? <UserCheck /> : <UserPlus />} {following[friend.username] ? "Following" : "Follow"}</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function ProfilePage({ user, setUser, posts, setPosts, postMenuId, setPostMenuId, setEditingPost }) {
  const [form, setForm] = useState(user);

  useEffect(() => setForm(user), [user]);

  async function uploadAvatar(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const avatar = await uploadFile(`users/${user.uid}/avatar`, file);
    const next = { ...user, avatar };
    await updateDoc(doc(db, "users", user.uid), { avatar });
    setUser(next);
  }

  async function uploadCover(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const cover = await uploadFile(`users/${user.uid}/cover`, file);
    const next = { ...user, cover };
    await updateDoc(doc(db, "users", user.uid), { cover });
    setUser(next);
  }

  async function saveProfile() {
    const next = {
      ...user,
      ...form,
      name: form.name.trim() || "User Name",
      email: form.email.trim() || user.email
    };

    await updateDoc(doc(db, "users", user.uid), {
      name: next.name,
      bio: next.bio || "",
      location: next.location || "",
      birthday: next.birthday || "",
      website: next.website || "",
      cover: next.cover || "",
      avatar: next.avatar || ""
    });

    setUser(next);
    alert("Profile saved.");
  }

  return (
    <>
      <h1 className="page-title">Profile</h1>
      <div className="card profile-header-card">
        <div className="profile-cover" style={user.cover ? { backgroundImage: `url(${user.cover})` } : undefined}>
          <label className="secondary-btn change-cover-btn"><Image /> Change Cover<input type="file" accept="image/*" onChange={uploadCover} /></label>
        </div>

        <div className="profile-avatar-wrap">
          <Avatar src={user.avatar} size="profile" />
          <label className="secondary-btn change-photo-btn"><Camera /><input type="file" accept="image/*" onChange={uploadAvatar} /></label>
        </div>

        <div className="profile-main-info">
          <h2>{user.name} {user.creator && <Crown className="creator-crown" />}</h2>
          <p className="profile-bio">{user.bio || "No bio yet."}</p>
          <div className="profile-stats"><span>{user.friends || 248} Friends</span><span>{user.followers || 1200} Followers</span><span>{user.following || 320} Following</span></div>
          <div className="profile-details"><span>Location: {user.location || "Not set"}</span><span>Email: {user.email || "Not set"}</span><span>Birthday: {user.birthday || "Not set"}</span><span>Website: {user.website || "Not set"}</span><span>Joined: {user.joined}</span></div>
          <div className="profile-actions"><button className="secondary-btn" onClick={() => document.getElementById("editProfileCard")?.scrollIntoView({ behavior: "smooth" })}><Edit3 /> Edit Profile</button></div>
        </div>
      </div>

      <div className="profile-grid">
        <div>
          <div className="card">
            <h2>Personal Information</h2>
            <div className="info-list">
              <div className="info-pill"><span>Username</span>@{user.username}</div>
              <div className="info-pill"><span>Bio</span>{user.bio || "No bio yet."}</div>
              <div className="info-pill"><span>Email</span>{user.email}</div>
              <div className="info-pill"><span>Location</span>{user.location || "Not set"}</div>
              <div className="info-pill"><span>Birthday</span>{user.birthday || "Not set"}</div>
              <div className="info-pill"><span>Website</span>{user.website || "Not set"}</div>
            </div>
          </div>

          <div id="editProfileCard" className="card">
            <h2>Edit Account</h2>
            <div className="edit-profile-form">
              <div className="field"><label>Display Name</label><input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="field"><label>Bio</label><textarea value={form.bio || ""} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
              <div className="form-grid">
                <div className="field"><label>Location</label><input value={form.location || ""} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
                <div className="field"><label>Birthday</label><input value={form.birthday || ""} onChange={(e) => setForm({ ...form, birthday: e.target.value })} /></div>
                <div className="field"><label>Website</label><input value={form.website || ""} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div>
              </div>
              <button className="primary-btn" onClick={saveProfile}>Save Profile</button>
            </div>
          </div>
        </div>

        <div className="card">
          <h2>Timeline / Posts</h2>
          <PostList user={user} posts={posts.filter((p) => p.uid === user.uid || p.id.startsWith("demo"))} setPosts={setPosts} postMenuId={postMenuId} setPostMenuId={setPostMenuId} setEditingPost={setEditingPost} />
        </div>
      </div>
    </>
  );
}

function GamesPage({ user, setUser }) {
  const [game, setGame] = useState(null);
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState("");

  function startGame() {
    const item = wordBank[Math.floor(Math.random() * wordBank.length)];
    const scrambled = item.word.split("").sort(() => Math.random() - 0.5).join("");
    setGame({ ...item, scrambled });
    setAnswer("");
    setMessage("");
  }

  async function submit() {
    if (!game) return;
    if (answer.trim().toUpperCase() === game.word) {
      const coins = (user.coins || 0) + 25;
      setUser({ ...user, coins });
      await updateDoc(doc(db, "users", user.uid), { coins });
      setMessage("Correct! +25 Luna Coins.");
      setGame(null);
    } else {
      setMessage("Not yet. Try again!");
    }
  }

  return (
    <>
      <h1 className="page-title">Games</h1>
      <div className="games-grid">
        <div className="card game-card big">
          <Trophy />
          <h2>Scrambled Words</h2>
          <p>Play solo or inside group chats. Earn demo Luna Coins.</p>
          {!game ? <button className="primary-btn" onClick={startGame}>Start Game</button> : <div className="game-play"><h3>{game.scrambled}</h3><p>{game.clue}</p><input value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Type answer" /><button className="primary-btn" onClick={submit}>Submit</button></div>}
          {message && <p className="game-message-text">{message}</p>}
        </div>
        {["Emoji Puzzle", "Memory Match", "Daily Challenge"].map((g) => <div className="card game-card" key={g}><Gamepad2 /><h2>{g}</h2><p>Coming soon in Lunara games.</p></div>)}
      </div>
    </>
  );
}

function WalletPage({ user }) {
  return (
    <>
      <h1 className="page-title">Creator Center</h1>
      <div className="wallet-grid">
        <div className="card wallet-hero"><Crown /><h2>Become a Lunara Creator</h2><p>Creator payouts will be available soon. Grow your views, followers, and engagement now.</p><button className="primary-btn"><Sparkles /> Apply Soon</button></div>
        <div className="card stat-card"><Wallet /><span>Luna Coins</span><strong>{user.coins || 120}</strong></div>
        <div className="card stat-card"><Eye /><span>Views</span><strong>18.4K</strong></div>
        <div className="card stat-card"><Heart /><span>Engagement</span><strong>82%</strong></div>
        <div className="card stat-card"><Gift /><span>Estimated Earnings</span><strong>Coming Soon</strong></div>
      </div>
    </>
  );
}

function SettingsPage({ user, setUser, logout }) {
  const [form, setForm] = useState(user);

  async function saveSettings() {
    const next = { ...user, name: form.name.trim() || "User Name", bio: form.bio || "" };
    await updateDoc(doc(db, "users", user.uid), { name: next.name, bio: next.bio });
    setUser(next);
    alert("Settings saved.");
  }

  return (
    <>
      <h1 className="page-title">Settings</h1>
      <div className="settings-layout">
        <div className="card settings-menu-card">
          <div className="setting-category active"><Lock /> Account</div>
          <div className="setting-category"><User /> Profile</div>
          <div className="setting-category"><Shield /> Security & Login</div>
          <div className="setting-category"><Eye /> Privacy</div>
          <div className="setting-category"><Bell /> Notifications</div>
          <div className="setting-category"><Settings /> Display</div>
          <div className="setting-category"><Globe /> Language</div>
        </div>

        <div className="settings-grid">
          <div className="card"><h2>Account Information</h2><div className="field"><label>Display Name</label><input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div><div className="field"><label>Username</label><input value={`@${user.username}`} disabled /></div><div className="field"><label>Bio</label><textarea value={form.bio || ""} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div><button className="primary-btn" onClick={saveSettings}>Save Changes</button></div>
          <div className="card"><h2>Connected Accounts</h2><div className="friend-line"><strong>Facebook</strong><button className="secondary-btn push-right">Soon</button></div><div className="friend-line"><strong>Google</strong><button className="secondary-btn push-right">Soon</button></div><div className="friend-line"><strong>TikTok</strong><button className="secondary-btn push-right">Soon</button></div></div>
          <div className="card"><h2>Password</h2><button className="secondary-btn">Change Password Soon</button><div className="storage-bar"><div className="storage-fill" /></div><p className="muted">Use a strong password for account safety.</p></div>
          <div className="card session-card"><h2>Account Session</h2><p className="muted session-text">You are signed in as <strong>{user.name}</strong>.</p><button className="primary-btn" onClick={logout}><LogOut /> Log Out</button></div>
          <div className="card danger-zone"><h2>Danger Zone</h2><button className="secondary-btn">Deactivate Account Soon</button><button className="decline delete-account">Permanently Delete Account Soon</button></div>
        </div>
      </div>
    </>
  );
}

function EditPostModal({ editingPost, setEditingPost, setPosts }) {
  const [text, setText] = useState(editingPost.text);

  async function saveEdit() {
    if (!editingPost.id.startsWith("demo")) {
      await updateDoc(doc(db, "posts", editingPost.id), { text });
    } else {
      setPosts((current) => current.map((p) => p.id === editingPost.id ? { ...p, text } : p));
    }
    setEditingPost(null);
  }

  return (
    <div className="modal-backdrop">
      <div className="card edit-modal">
        <button className="modal-close" onClick={() => setEditingPost(null)}><X /></button>
        <h2>Edit Post</h2>
        <textarea value={text} onChange={(e) => setText(e.target.value)} />
        <button className="primary-btn" onClick={saveEdit}>Save Post</button>
      </div>
    </div>
  );
}

function DailyCard() {
  return <div className="card daily-card"><Sparkles /><h3>Daily Reward</h3><p>Post, react, or play a game to collect Luna Coins.</p><button>Claim Soon</button></div>;
}

function TrendingCard() {
  return <div className="card side-card"><h3>Trending</h3>{["#LunaraLaunch", "#MoonVibes", "#CreatorSoon", "#GroupGames"].map((tag) => <div className="message-line" key={tag}><Hash /><strong>{tag}</strong></div>)}</div>;
}

function CreatorPreview() {
  return <div className="card side-card"><h3>Creator Rewards</h3><p className="muted">Get paid once Creator Payouts launch.</p><h2 className="reward">Soon</h2></div>;
}

function CreatorRow({ user }) {
  return <div className="creator-row"><Avatar size="small" /><div><strong>{user.name}</strong><p>@{user.username} • {user.followers}</p></div><button>Follow</button></div>;
}
