<script lang="ts">
  import { onMount } from 'svelte';
  import type { Photo } from '$lib/types';

  interface Props {
    photos: Photo[];
    projection?: string;
    centerRA?: number;
    onselect?: (photo: Photo, position: { x: number; y: number }) => void;
  }

  let { photos, projection = 'equirectangular', centerRA = 0, onselect }: Props = $props();
  let celestialInstance: any = null;
  let prevProjection: string | undefined;
  let prevCenterRA: number | undefined;

  function currentProjection(coords: [number, number]): [number, number] | null {
    return celestialInstance?.map?.projection()(coords) ?? null;
  }

  let mapContainer: HTMLDivElement;

  function photosToGeoJSON(photos: Photo[]) {
    return {
      type: 'FeatureCollection',
      features: photos.map((p) => ({
        type: 'Feature',
        id: p.id,
        geometry: {
          type: 'Point',
          coordinates: [p.ra, p.dec]
        },
        properties: {
          name: p.id,
          desig: p.name,
          mag: 0,
          dim: p.fov ?? 1
        }
      }))
    };
  }

  onMount(() => {
    const Celestial = (window as any).Celestial;
    if (!Celestial) {
      console.error('Celestial not loaded');
      return;
    }

    const config = {
      width: 0,
      projection: projection,
      transform: 'equatorial',
      center: [centerRA * 15, 0, 0],
      follow: 'center',
      orientationfixed: true,
      zoomlevel: null,
      zoomextend: 10,
      interactive: true,
      form: false,
      controls: false,
      container: 'celestial-map',
      datapath: '/celestial/data/',
      stars: {
        show: true,
        limit: 6,
        colors: true,
        style: { fill: '#ffffff', opacity: 1 },
        designation: false,
        propername: false,
        size: 5,
        exponent: -0.28,
        data: 'stars.6.json'
      },
      dsos: {
        show: true,
        limit: 6,
        colors: true,
        names: false,
        size: null,
        data: 'dsos.bright.json'
      },
      constellations: {
        names: true,
        namesType: 'iau',
        nameStyle: {
          fill: '#cccc99',
          align: 'center',
          baseline: 'middle',
          font: [
            '14px Helvetica, Arial, sans-serif',
            '12px Helvetica, Arial, sans-serif',
            '11px Helvetica, Arial, sans-serif'
          ]
        },
        lines: true,
        lineStyle: { stroke: '#cccccc', width: 1, opacity: 0.6 },
        bounds: false
      },
      mw: {
        show: true,
        style: { fill: '#ffffff', opacity: 0.15 }
      },
      lines: {
        graticule: {
          show: true,
          stroke: '#cccccc',
          width: 0.6,
          opacity: 0.8,
          lon: { pos: ['center'], fill: '#eee', font: '10px Helvetica, Arial, sans-serif' },
          lat: { pos: ['center'], fill: '#eee', font: '10px Helvetica, Arial, sans-serif' }
        },
        equatorial: { show: true, stroke: '#aaaaaa', width: 1.3, opacity: 0.7 },
        ecliptic: { show: true, stroke: '#66cc66', width: 1.3, opacity: 0.7 },
        galactic: { show: false },
        supergalactic: { show: false }
      },
      background: {
        fill: '#000011',
        opacity: 1,
        stroke: '#000011',
        width: 1.5
      }
    };

    const photoGeoJSON = photosToGeoJSON(photos);

    Celestial.add({
      type: 'raw',
      callback: (error: any) => {
        if (error) return console.error(error);
        const canvas = Celestial.context;

        photoGeoJSON.features.forEach((feature: any) => {
          const coords = feature.geometry.coordinates;
          const point = currentProjection(coords);

          if (point === null) return;
          if (!Celestial.clip(feature.geometry.coordinates)) return;

          canvas.beginPath();
          canvas.arc(point[0], point[1], 6, 0, 2 * Math.PI);
          canvas.fillStyle = '#ff6644';
          canvas.strokeStyle = '#ffaa88';
          canvas.lineWidth = 1.5;
          canvas.fill();
          canvas.stroke();

          canvas.font = '11px system-ui, sans-serif';
          canvas.fillStyle = '#ffaa88';
          canvas.textAlign = 'left';
          canvas.fillText(feature.properties.desig, point[0] + 10, point[1] + 4);
        });
      },
      redraw: () => {
        const canvas = Celestial.context;

        photoGeoJSON.features.forEach((feature: any) => {
          const coords = feature.geometry.coordinates;
          const point = currentProjection(coords);

          if (point === null) return;
          if (!Celestial.clip(feature.geometry.coordinates)) return;

          canvas.beginPath();
          canvas.arc(point[0], point[1], 6, 0, 2 * Math.PI);
          canvas.fillStyle = '#ff6644';
          canvas.strokeStyle = '#ffaa88';
          canvas.lineWidth = 1.5;
          canvas.fill();
          canvas.stroke();

          canvas.font = '11px system-ui, sans-serif';
          canvas.fillStyle = '#ffaa88';
          canvas.textAlign = 'left';
          canvas.fillText(feature.properties.desig, point[0] + 10, point[1] + 4);
        });
      }
    });

    celestialInstance = Celestial;
    Celestial.display(config);

    // Click handling for markers
    mapContainer.addEventListener('click', (e: MouseEvent) => {
      if (!onselect) return;
      const rect = mapContainer.querySelector('canvas')?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      for (const photo of photos) {
        const point = currentProjection([photo.ra, photo.dec]);
        if (point === null) continue;
        const dx = point[0] - x;
        const dy = point[1] - y;
        if (Math.sqrt(dx * dx + dy * dy) < 12) {
          onselect(photo, { x: e.clientX, y: e.clientY });
          return;
        }
      }
    });
  });

  function applyCenter(ra: number) {
    const raDegs = ra * 15;
    celestialInstance.apply({ center: [raDegs, 0, 0] });
    celestialInstance.map.projection().rotate([-raDegs, 0, 0]);
    celestialInstance.redraw();
  }

  export function resetCenter() {
    if (celestialInstance) {
      celestialInstance.rotate({ center: [centerRA * 15, 0, 0] });
    }
  }

  $effect(() => {
    if (celestialInstance && projection) {
      if (prevProjection !== undefined && prevProjection !== projection) {
        celestialInstance.reproject({ projection });
      }
      prevProjection = projection;
    }
  });

  $effect(() => {
    if (celestialInstance && centerRA !== undefined) {
      if (prevCenterRA !== undefined && prevCenterRA !== centerRA) {
        applyCenter(centerRA);
      }
      prevCenterRA = centerRA;
    }
  });
</script>

<div class="starchart" bind:this={mapContainer}>
  <div id="celestial-map"></div>
</div>

<style>
  .starchart {
    flex: 1;
    position: relative;
    overflow: hidden;
    background: #000011;
  }

  .starchart :global(#celestial-map) {
    width: 100%;
    height: 100%;
  }
</style>
