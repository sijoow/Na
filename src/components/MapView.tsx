"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import type { Place, PlaceKind } from "@/lib/guideTypes";

export const PLACE_EMOJI: Record<PlaceKind, string> = {
  airport: "✈️",
  "lodging-area": "🏨",
  sight: "📸",
  shopping: "🛍️",
  activity: "🎢",
  food: "🍜",
  pier: "⛴️",
};

export interface MapPath {
  color: string;
  points: [number, number][];
}

interface Props {
  places: Place[];
  /** 강조할 장소(선택한 날에 들르는 곳). 비어 있으면 전부 보통으로 표시 */
  highlightIds: string[];
  paths: MapPath[];
  selectedPlaceId: string | null;
  onSelectPlace: (id: string) => void;
}

type LeafletModule = typeof import("leaflet");

// Leaflet은 window를 쓰므로 브라우저에서만 불러온다 (서버 렌더링 때 import 금지)
export default function MapView({ places, highlightIds, paths, selectedPlaceId, onSelectPlace }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const [leaflet, setLeaflet] = useState<LeafletModule | null>(null);

  // 지도 만들기 (한 번)
  useEffect(() => {
    let disposed = false;
    import("leaflet").then((mod) => {
      const L = (mod as unknown as { default?: LeafletModule }).default ?? mod;
      if (disposed || !containerRef.current || mapRef.current) return;
      const map = L.map(containerRef.current, { zoomControl: true, attributionControl: true });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      map.setView([12.1, 109.2], 10);
      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      setLeaflet(L);
    });
    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  // 마커 / 경로 그리기
  useEffect(() => {
    const L = leaflet;
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!L || !map || !layer) return;
    layer.clearLayers();

    const highlight = new Set(highlightIds);
    const focusAll = highlight.size === 0;

    for (const path of paths) {
      if (path.points.length < 2) continue;
      L.polyline(path.points, { color: path.color, weight: 4, opacity: 0.85, dashArray: "8 8" }).addTo(layer);
    }

    for (const p of places) {
      const active = focusAll || highlight.has(p.id);
      const selected = p.id === selectedPlaceId;
      const icon = L.divIcon({
        className: "",
        html: `<div class="map-pin${active ? "" : " map-pin--dim"}${selected ? " map-pin--selected" : ""}">${PLACE_EMOJI[p.kind]}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
      const marker = L.marker([p.lat, p.lng], { icon, zIndexOffset: active ? 500 : 0 }).addTo(layer);
      marker.bindTooltip(p.name, {
        direction: "top",
        offset: [0, -18],
        permanent: !focusAll && active,
        className: "map-label",
      });
      marker.on("click", () => onSelectPlace(p.id));
    }

    const focusPoints = places
      .filter((p) => focusAll || highlight.has(p.id))
      .map((p) => [p.lat, p.lng] as [number, number]);
    if (focusPoints.length === 1) map.setView(focusPoints[0], 14);
    else if (focusPoints.length > 1) map.fitBounds(focusPoints, { padding: [40, 40], maxZoom: 15 });
  }, [leaflet, places, highlightIds, paths, selectedPlaceId, onSelectPlace]);

  return (
    <div
      ref={containerRef}
      className="h-full min-h-[280px] w-full overflow-hidden rounded-3xl bg-surface-2"
      role="application"
      aria-label="나트랑 지도"
    />
  );
}
