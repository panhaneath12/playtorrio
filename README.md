# PlayTorrio V3 (Official) — Universal Entertainment Suite
> **Free Movies, Anime Hub, Live IPTV & Torrent Player in One Codebase** (Web + Android TV OS) built with React, Vite, Tailwind CSS, Hls.js, and Capacitor.

---

## 🌟 PlayTorrio V3 Core Capabilities

1. **🎬 Free Movies & TV Series Hub**
   - **6 Integrated Scrapers**: VidSrc (1080p), Embed.su (Fast CDN), AutoEmbed (Multi-Audio), VidLink (4K), SuperEmbed (Backup), 2Embed.
   - **Season & Episode Selectors**: Seamless multi-season browsing with instant remote playback.

2. **🌸 Dedicated Anime Streaming Hub**
   - AniList and TMDB anime integration with English/Japanese dub and sub options (*Demon Slayer*, *Arcane*, *Your Name*, etc.).

3. **📺 PlayTorrio Control Room (Live IPTV Player)**
   - High-performance live HLS/M3U8 streaming powered by `hls.js`.
   - Curated live channels (Red Bull TV, Sky News, ABC News, DUST Sci-Fi, RetroCrush Anime, Lofi Chill).
   - Custom M3U8 Playlist Loader: Paste any live stream or Xtream Codes link.

4. **⚡ Torrent & P2P Engine**
   - **Stremio Web P2P (Server 7)**: Directly resolves titles with Cinemeta & Torrentio, plus a 1-click **"Launch Stremio App"** deep link for Android TV.
   - **Native WebTorrent (Server 8)**: In-browser peer-to-peer streaming with live peer count, download speed, and buffer telemetry. Zero `X-Frame-Options` blocks.

5. **🧩 Stremio Addons & Debrid Cloud Caching**
   - In-app settings panel to configure **Real-Debrid**, **AllDebrid**, or **TorBox** API tokens for uncapped 4K streaming.
   - Custom Stremio addon manifest URLs (Torrentio, Comet, Cyberflix).

6. **🎮 Living Room 10-Foot UI & D-Pad Remote Navigation**
   - 2D Euclidean spatial navigation for Android TV / Fire TV remotes (`↑`, `↓`, `←`, `→`, `Enter`, `Back`).
   - On-screen virtual keyboard for searching without a physical keyboard.

---

## 🚀 Quick Start (Web Development)

```bash
cd C:\Users\neath\.gemini\antigravity\scratch\movie-stream-tv
npm run dev
```
Open [http://localhost:5173](http://localhost:5173). Use your keyboard's **Arrow Keys**, **Enter**, and **Backspace/Esc** to navigate just like a TV remote!

---

## 📺 Build Android TV APK

```bash
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```
The installable APK will be generated at:
`android/app/build/outputs/apk/debug/app-debug.apk`
