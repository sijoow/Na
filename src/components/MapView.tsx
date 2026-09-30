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
  spa: "💆",
};

export interface MapPath {
  color: string;
  points: [number, number][];
}

/** 반경 표시 (예: 호텔에서 걸어서 10분 거리) */
export interface MapCircle {
  center: [number, number];
  radiusM: number;
  color: string;
}

interface Props {
  places: Place[];
  /** 강조할 장소(선택한 날에 들르는 곳). 비어 있으면 전부 보통으로 표시 */
  highlightIds: string[];
  paths: MapPath[];
  selectedPlaceId: string | null;
  onSelectPlace: (id: string) => void;
  circles?: MapCircle[];
}

type LeafletModule = typeof import("leaflet");

// Leaflet은 window를 쓰므로 브라우저에서만 불러온다 (서버 렌더링 때 import 금지)
export default function MapView({ places, highlightIds, paths, selectedPlaceId, onSelectPlace, circles }: Props) {
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
      // Leaflet 1.9의 remove()는 확대 애니메이션 종료 타이머(_onZoomTransitionEnd)를 취소하지 않는다.
      // 확대 도중에 탭을 바꾸면 지워진 지도에서 타이머가 돌아 '_leaflet_pos' 오류가 나서, 끝난 것으로 표시해 둔다
      const map = mapRef.current as (LeafletMap & { _animatingZoom?: boolean }) | null;
      if (map) {
        map._animatingZoom = false;
        map.remove();
      }
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

    for (const c of circles ?? []) {
      L.circle(c.center, { radius: c.radiusM, color: c.color, weight: 2, fillOpacity: 0.08, dashArray: "6 6" }).addTo(layer);
    }

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
    // 앱이 맞추는 화면은 애니메이션 없이 바로 (날짜를 빨리 바꾸거나 탭을 옮겨도 확대가 겹치지 않게)
    if (focusPoints.length === 1) map.setView(focusPoints[0], 14, { animate: false });
    else if (focusPoints.length > 1) map.fitBounds(focusPoints, { padding: [40, 40], maxZoom: 15, animate: false });
  }, [leaflet, places, highlightIds, paths, selectedPlaceId, onSelectPlace, circles]);

  return (
    <div
      ref={containerRef}
      className="h-full min-h-[280px] w-full overflow-hidden rounded-3xl bg-surface-2"
      role="application"
      aria-label="나트랑 지도"
    />
  );
}
