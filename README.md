# Ausify - Retro Music Player & Media Dashboard

A tactile, retro-futuristic Australian music discovery web application featuring interactive 3D spinning CD jewel cases, CRT post-processing bloom shaders, procedural Web Audio sound effects, and a dedicated Supabase cloud management dashboard.

## Live Deployment
- **Web App**: [http://liebe.arxenovasocial.com](http://liebe.arxenovasocial.com)
- **Track & Media Dashboard**: [http://liebe.arxenovasocial.com/dashboard](http://liebe.arxenovasocial.com/dashboard)

---

## Features
- **3D CD Carousel**: Interactive Three.js WebGL canvas rendering authentic jewel case models, reflective plastic sheen, and spinning compact discs.
- **CRT Shader Pipeline**: Custom CRT phosphor scanlines, chromatic curvature, and hot neon pink (`#FF7FEC`) color grading.
- **Media Management Dashboard**: Upload new tracks, audio files (.mp3, .wav), CD artwork covers, and plain/LRC timestamped lyrics directly into Supabase Storage and Postgres.
- **Automated CI/CD**: Seamless auto-deployments triggered on `git push` to `main` via aaPanel Webhooks.

---

## Tech Stack
- **Framework**: Next.js 16 (App Router, Turbopack, Standalone Output)
- **Graphics & 3D**: Three.js, Custom GLSL Shaders, HTML5 2D Canvas
- **Database & Storage**: Supabase (PostgreSQL + S3-compatible Storage)
- **Styling**: Tailwind CSS v4, Custom Vintage Fonts (*Merchant Copy*, *Instrument Serif*)
- **Deployment**: aaPanel VPS, Nginx Reverse Proxy, PM2 Process Manager

---

## License
MIT
