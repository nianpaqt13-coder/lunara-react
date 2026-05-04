import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Home,
  Newspaper,
  Users,
  MessageCircle,
  User,
  Settings,
  Search,
  Bell,
  Heart,
  MessageSquare,
  Share2,
  Camera,
  Video,
  Image,
  Send,
  Lock,
  Shield,
  Eye,
  Globe,
  LogOut,
  Edit3,
  MoreHorizontal,
  Star,
  Rocket,
  Moon,
  X,
  Trash2,
  Save,
  Flag,
  ArrowLeft,
  Check,
  UserPlus
} from "lucide-react";

const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const defaultUser = {
  name: "User Name",
  email: "user@lunara.net",
  bio: "Exploring the moonlit side of creativity, friends, and stories.",
  location: "Not set",
  birthday: "Not set",
  website: "Not set",
  joined: "March 2026",
  avatar: "",
  cover: ""
};

const defaultContacts = [
  {
    id: "ben",
    name: "Ben C.",
    online: true,
    mutuals: 3,
    unread: 0,
    messages: [
      { from: "them", text: "Telescope setup complete!" },
      { from: "me", text: "That sounds amazing." }
    ]
  },
  {
    id: "maria",
    name: "Maria K.",
    online: true,
    mutuals: 8,
    unread: 1,
    messages: [
      { from: "them", text: "Hey! Loved your new moon artwork!" },
      { from: "me", text: "Thanks! It was so peaceful to draw." },
      { from: "them", text: "The shading is beautiful." }
    ]
  },
  {
    id: "alex",
    name: "Alex L.",
    online: true,
    mutuals: 5,
    unread: 0,
    messages: [
      { from: "them", text: "Off-world for a few days." },
      { from: "me", text: "Bring back some stars." }
    ]
  },
  {
    id: "lily",
    name: "Lily R.",
    online: false,
    mutuals: 6,
    unread: 2,
    messages: [
      { from: "them", text: "Loved your art!" },
      { from: "me", text: "Thank you, Lily!" }
    ]
  },
  {
    id: "mark",
    name: "Mark T.",
    online: true,
    mutuals: 2,
    unread: 0,
    messages: [{ from: "them", text: "Stargazing tonight?" }]
  },
  {
    id: "james",
    name: "James S.",
    online: false,
    mutuals: 4,
    unread: 0,
    messages: [{ from: "them", text: "Quiet night." }]
  }
];

const defaultPosts = [
  {
    id: makeId(),
    name: "User Sarah J.",
    time: "12 min ago",
    text: "Check out the new moon phase artwork! #Lunara #Art",
    media: "moon",
    theme: "",
    image: ""
  },
  {
    id: makeId(),
    name: "User Alex L.",
    time: "26 min ago",
    text: "Excited for the next launch update!",
    media: "rocket",
    theme: "blue",
    image: ""
  }
];

function loadStorage(key, fallback) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function readFile(file) {
  return new Promise((resolve) => {
    if (!file) return resolve("");

    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.readAsDataURL(file);
  });
}

function Avatar({ src, size = "normal" }) {
  return (
    <div
      className={`avatar avatar-${size}`}
      style={src ? { backgroundImage: `url(${src})` } : undefined}
    />
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
  const [user, setUser] = useState(() => loadStorage("lunara_user", null));
  const [page, setPage] = useState("dashboard");
  const [posts, setPosts] = useState(() =>
    loadStorage("lunara_posts", defaultPosts)
  );
  const [contacts, setContacts] = useState(() =>
    loadStorage("lunara_contacts", defaultContacts)
  );
  const [activeContactId, setActiveContactId] = useState(
    () => localStorage.getItem("lunara_active_contact") || "maria"
  );
  const [postMenuId, setPostMenuId] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  useEffect(() => {
    saveStorage("lunara_posts", posts);
  }, [posts]);

  useEffect(() => {
    saveStorage("lunara_contacts", contacts);
  }, [contacts]);

  useEffect(() => {
    if (user) saveStorage("lunara_user", user);
  }, [user]);

  useEffect(() => {
    localStorage.setItem("lunara_active_contact", activeContactId);
  }, [activeContactId]);

  const activeContact = useMemo(() => {
    return contacts.find((contact) => contact.id === activeContactId) || contacts[0];
  }, [contacts, activeContactId]);

  function handleAuth(event) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const name = form.get("name")?.trim() || "User Name";
    const email = form.get("email")?.trim() || "user@lunara.net";

    setUser({
      ...defaultUser,
      ...(user || {}),
      name: authMode === "login" && user ? user.name : name,
      email
    });

    setPage("dashboard");
  }

  function logout() {
    localStorage.removeItem("lunara_user");
    setUser(null);
    setPage("dashboard");
  }

  function openPage(nextPage) {
    setPage(nextPage);
    setPostMenuId(null);
    setMobileChatOpen(false);

    setTimeout(() => {
      document.querySelector(".content")?.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }, 0);
  }

  if (!user) {
    return (
      <AuthScreen
        authMode={authMode}
        setAuthMode={setAuthMode}
        handleAuth={handleAuth}
      />
    );
  }

  return (
    <section className="app-shell glass">
      <Sidebar page={page} openPage={openPage} />

      <main className="main">
        <Topbar user={user} logout={logout} />

        <section className="content">
          {page === "dashboard" && (
            <DashboardPage
              user={user}
              posts={posts}
              setPosts={setPosts}
              contacts={contacts}
              openPage={openPage}
              postMenuId={postMenuId}
              setPostMenuId={setPostMenuId}
              setEditingPost={setEditingPost}
            />
          )}

          {page === "feed" && (
            <FeedPage
              user={user}
              posts={posts}
              setPosts={setPosts}
              postMenuId={postMenuId}
              setPostMenuId={setPostMenuId}
              setEditingPost={setEditingPost}
            />
          )}

          {page === "friends" && <FriendsPage contacts={contacts} />}

          {page === "messages" && (
            <MessagesPage
              contacts={contacts}
              setContacts={setContacts}
              activeContact={activeContact}
              setActiveContactId={setActiveContactId}
              mobileChatOpen={mobileChatOpen}
              setMobileChatOpen={setMobileChatOpen}
            />
          )}

          {page === "profile" && (
            <ProfilePage
              user={user}
              setUser={setUser}
              posts={posts}
              setPosts={setPosts}
              postMenuId={postMenuId}
              setPostMenuId={setPostMenuId}
              setEditingPost={setEditingPost}
            />
          )}

          {page === "settings" && (
            <SettingsPage user={user} setUser={setUser} logout={logout} />
          )}
        </section>
      </main>

      {editingPost && (
        <EditPostModal
          editingPost={editingPost}
          setEditingPost={setEditingPost}
          setPosts={setPosts}
        />
      )}
    </section>
  );
}

function AuthScreen({ authMode, setAuthMode, handleAuth }) {
  return (
    <section className="auth-screen">
      <div className="auth-card glass">
        <div className="auth-panel">
          <div className="brand auth-brand">
            <div className="logo-mark" />
            <span>Lunara</span>
          </div>

          <h1>Welcome to Lunara</h1>

          <p className="auth-subtitle">
            A glass social universe for friends, photos, videos, messages,
            communities, games, and creator rewards.
          </p>

          <div className="auth-tabs">
            <button
              className={`auth-tab ${authMode === "signup" ? "active" : ""}`}
              onClick={() => setAuthMode("signup")}
              type="button"
            >
              Sign up
            </button>

            <button
              className={`auth-tab ${authMode === "login" ? "active" : ""}`}
              onClick={() => setAuthMode("login")}
              type="button"
            >
              Log in
            </button>
          </div>

          <form className="auth-form" onSubmit={handleAuth}>
            {authMode === "signup" && (
              <label>
                <span>Full Name</span>
                <input name="name" placeholder="Sarah J." />
              </label>
            )}

            <label>
              <span>Email Address</span>
              <input name="email" type="email" placeholder="you@lunara.net" />
            </label>

            <label>
              <span>Password</span>
              <input name="password" type="password" placeholder="••••••••" />
            </label>

            <button className="primary-btn" type="submit">
              {authMode === "signup" ? "Create Account" : "Log In"}
            </button>
          </form>
        </div>

        <div className="auth-art">
          <div className="planet">
            <div className="orbit" />
          </div>

          <h2>Share your orbit.</h2>

          <p>
            Build your profile, connect with friends, create posts, and explore
            entertainment.
          </p>
        </div>
      </div>
    </section>
  );
}

function Sidebar({ page, openPage }) {
  const items = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "feed", label: "News Feed", icon: Newspaper, badge: 3 },
    { id: "friends", label: "Friends", icon: Users, badge: 5, green: true },
    { id: "messages", label: "Messages", icon: MessageCircle, badge: 2 },
    { id: "profile", label: "Profile", icon: User },
    { id: "settings", label: "Settings", icon: Settings }
  ];

  return (
    <aside className="sidebar">
      <div className="brand sidebar-brand">
        <div className="logo-mark" />
        <span>Lunara</span>
      </div>

      {items.map((item) => {
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            className={`nav-item ${page === item.id ? "active" : ""}`}
            onClick={() => openPage(item.id)}
            aria-label={item.label}
          >
            <Icon />
            <span className="nav-label">{item.label}</span>

            {item.badge && (
              <span className={`badge ${item.green ? "green" : ""}`}>
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </aside>
  );
}

function Topbar({ user, logout }) {
  return (
    <header className="topbar">
      <div className="search-box">
        <Search />
        <input placeholder="Search Lunara..." />
      </div>

      <div className="top-actions">
        <button className="icon-btn notification-btn">
          <Bell />
          <span className="badge">3</span>
        </button>

        <Avatar src={user.avatar} />

        <div className="top-user">
          <strong>{user.name}</strong>
          <button onClick={logout}>Log Out</button>
        </div>
      </div>
    </header>
  );
}

function Composer({ user, setPosts }) {
  const [text, setText] = useState("");
  const [draftImage, setDraftImage] = useState("");

  async function handleImage(event) {
    const file = event.target.files?.[0];
    const dataUrl = await readFile(file);
    setDraftImage(dataUrl);
  }

  function createPost(mediaType) {
    if (!text.trim() && !draftImage) {
      alert("Write something or upload a photo first.");
      return;
    }

    setPosts((current) => [
      {
        id: makeId(),
        name: user.name,
        time: "Just now",
        text: text.trim() || "Shared a new photo.",
        media: mediaType,
        theme:
          mediaType === "video" ? "blue" : mediaType === "camera" ? "pink" : "",
        image: draftImage
      },
      ...current
    ]);

    setText("");
    setDraftImage("");
  }

  return (
    <div className="card composer">
      <div className="composer-row">
        <Avatar src={user.avatar} />

        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="What's happening on Lunara?"
        />
      </div>

      {draftImage && (
        <div className="composer-preview">
          <img src={draftImage} alt="Post preview" />

          <button className="remove-preview" onClick={() => setDraftImage("")}>
            <X />
          </button>
        </div>
      )}

      <div className="composer-actions">
        <label className="secondary-btn file-btn">
          <Image />
          Upload Photo
          <input type="file" accept="image/*" onChange={handleImage} />
        </label>

        <button className="secondary-btn" onClick={() => createPost("camera")}>
          <Camera />
          Photo Post
        </button>

        <button className="secondary-btn" onClick={() => createPost("video")}>
          <Video />
          Video Post
        </button>

        <button className="secondary-btn" onClick={() => createPost("stars")}>
          <Star />
          Mood Post
        </button>
      </div>
    </div>
  );
}

function PostList({
  user,
  posts,
  setPosts,
  postMenuId,
  setPostMenuId,
  setEditingPost
}) {
  function deletePost(id) {
    setPosts((current) => current.filter((post) => post.id !== id));
    setPostMenuId(null);
  }

  return (
    <>
      {posts.map((post) => (
        <article className="card post" key={post.id}>
          <div className="post-head">
            <Avatar src={user.avatar} />

            <div className="post-meta">
              <strong>{post.name}</strong>
              <span>{post.time}</span>
            </div>

            <button
              className="more"
              onClick={() =>
                setPostMenuId(postMenuId === post.id ? null : post.id)
              }
            >
              <MoreHorizontal />
            </button>

            {postMenuId === post.id && (
              <div className="post-menu glass">
                <button
                  onClick={() => {
                    setEditingPost(post);
                    setPostMenuId(null);
                  }}
                >
                  <Edit3 /> Edit post
                </button>

                <button onClick={() => alert("Post saved.")}>
                  <Save /> Save post
                </button>

                <button onClick={() => alert("Post reported.")}>
                  <Flag /> Report post
                </button>

                <button className="danger-text" onClick={() => deletePost(post.id)}>
                  <Trash2 /> Delete post
                </button>
              </div>
            )}
          </div>

          <p className="post-text">{post.text}</p>

          {post.image ? (
            <div className="media">
              <img src={post.image} alt="Uploaded post" />
            </div>
          ) : (
            <div className={`media ${post.theme || ""}`}>
              <MediaIcon type={post.media} />
            </div>
          )}

          <PostActions />
        </article>
      ))}
    </>
  );
}

function PostActions() {
  const [liked, setLiked] = useState(false);

  return (
    <div className="post-actions">
      <button
        className={liked ? "liked" : ""}
        onClick={() => setLiked((value) => !value)}
      >
        <Heart />
        <span>{liked ? "Liked" : "Like"}</span>
      </button>

      <button onClick={() => alert("Comments coming soon.")}>
        <MessageSquare />
        <span>Comment</span>
      </button>

      <button onClick={() => alert("Post shared.")}>
        <Share2 />
        <span>Share</span>
      </button>
    </div>
  );
}

function DashboardPage(props) {
  const onlineFriends = props.contacts
    .filter((contact) => contact.online)
    .slice(0, 4);

  return (
    <>
      <h1 className="page-title">Dashboard</h1>

      <div className="grid-feed">
        <div>
          <Composer user={props.user} setPosts={props.setPosts} />
          <PostList {...props} />
        </div>

        <aside className="side-stack">
          <div className="card side-card">
            <h3>Friends Online</h3>

            {onlineFriends.map((friend) => (
              <button
                className="friend-line"
                key={friend.id}
                onClick={() => props.openPage("messages")}
              >
                <Avatar size="small" />
                <strong>{friend.name}</strong>
                <span className="online-dot" />
              </button>
            ))}
          </div>

          <div className="card side-card">
            <h3>Recent Messages</h3>

            {props.contacts.slice(0, 3).map((contact) => (
              <div className="message-line" key={contact.id}>
                <Avatar size="small" />

                <div>
                  <strong>{contact.name}</strong>
                  <br />
                  <span>
                    {contact.messages[contact.messages.length - 1]?.text ||
                      "No messages yet."}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}

function FeedPage(props) {
  return (
    <>
      <h1 className="page-title">News Feed</h1>

      <div className="grid-feed">
        <div>
          <Composer user={props.user} setPosts={props.setPosts} />
          <PostList {...props} />
        </div>

        <aside className="side-stack">
          <div className="card side-card">
            <h3>Trending</h3>
            <div className="message-line">
              <strong>#MoonArt</strong>
            </div>
            <div className="message-line">
              <strong>#LunaraLaunch</strong>
            </div>
            <div className="message-line">
              <strong>#Stargazing</strong>
            </div>
          </div>

          <div className="card side-card">
            <h3>Creator Rewards</h3>
            <p className="muted">Estimated this week</p>
            <h2 className="reward">₱1,280</h2>
          </div>
        </aside>
      </div>
    </>
  );
}

function FriendsPage({ contacts }) {
  const extraFriends = [
    { name: "Aisha P.", online: true, mutuals: 9 },
    { name: "Ethan H.", online: false, mutuals: 2 },
    { name: "Dohen D.", online: true, mutuals: 7 },
    { name: "Bayns P.", online: false, mutuals: 1 }
  ];

  const requests = ["Aisha P.", "Ethan M.", "Doyan C.", "Mark T.", "James S."];

  function removeRequest(event) {
    event.currentTarget.closest(".request").remove();
  }

  return (
    <>
      <h1 className="page-title">Friends</h1>

      <div className="friends-layout">
        <div className="card">
          <h2>Pending Requests</h2>

          <div className="request-grid">
            {requests.map((name) => (
              <div className="request" key={name}>
                <Avatar size="small" />

                <div>
                  <h3>{name}</h3>
                  <p className="muted">3 mutual friends</p>
                </div>

                <div className="request-actions">
                  <button className="accept" onClick={removeRequest}>
                    <Check /> Accept
                  </button>

                  <button className="decline" onClick={removeRequest}>
                    <X /> Decline
                  </button>
                </div>
              </div>
