# Astrophotos

A website to display the locations of my astrophotography images on a star chart using an equirectangular projection.

## UI Layout

- **Top bar** — narrow settings bar (projection options, filters, etc.)
- **Main area** — interactive star chart (equirectangular projection)
- **Bottom bar** — optional, e.g. for photo metadata or navigation

## Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | **SvelteKit** | Lightweight compiled output, no virtual DOM overhead, clean component structure |
| Bundler | **Vite** | Built into SvelteKit |
| Star chart | **D3-celestial** | Native equirectangular projection support, renders stars/constellations/DSOs, supports custom GeoJSON overlays |
| Data | **GeoJSON** | D3-celestial uses GeoJSON internally; photo locations map naturally to this format |
| Adapter | **@sveltejs/adapter-static** | Generates a fully static site, required for Nginx-based Docker deployment |
| Styling | **Plain CSS** | Scoped component styles via Svelte's built-in `<style>`, no extra dependencies |
| Deployment | **Docker + Nginx** | Serves the static SvelteKit build via Nginx in a lightweight container |

## Deployment

A `Dockerfile` builds the SvelteKit app and serves the static output using Nginx:
- Multi-stage build: Node for building, Nginx for serving
- Nginx serves the pre-built static files from `/usr/share/nginx/html`
- Minimal image size using `nginx:alpine`

## Data Source

Photo data is stored as a static JSON file (`src/lib/data/photos.json`) bundled at build time. This can later be replaced by an API or CMS.

## Data Model

Each astrophoto needs:
- `ra` — Right Ascension (center of field of view)
- `dec` — Declination (center of field of view)
- `fov` — Field of view size (optional)
- `rotation` — Field rotation angle (optional)
- `thumbnail` — Path to thumbnail/preview image (optional)
- `fullSizeUrl` — URL to the full-resolution image (optional)
- `metadata` — Date, equipment, exposure, etc. (optional)

## Component Structure

```
App
├── TopBar        — settings (projection, filters, overlays)
├── StarChart     — D3-celestial canvas with photo location markers
├── InfoCard      — extensible detail card (appears on marker click)
└── BottomBar     — selected photo info / metadata panel
```

## Info Card

The InfoCard is an extensible component that appears when a marker on the star chart is clicked:
- Shows a **small preview thumbnail** of the astrophoto (start with a dummy placeholder as the preview thumbnail will not be available at first)
- The thumbnail is **clickable** and links to the full-size image URL (opens in new tab)
- Displays basic metadata (object name, date, equipment)
- **Extensible** — designed with a slot/section pattern so additional fields or actions can be added later without restructuring

## Photo Locations as GeoJSON Overlay

Photo centers are added as a custom GeoJSON layer on top of D3-celestial, using RA/Dec as coordinates. Clicking a marker opens the InfoCard.
