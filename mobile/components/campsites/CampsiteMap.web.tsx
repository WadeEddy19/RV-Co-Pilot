import { useEffect, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { CampsiteMapPoint } from "./CampsiteMap.types";

type Props = {
  points: CampsiteMapPoint[];
  fill?: boolean;
  selectedPointId?: string | null;
  onSelectPoint?: (pointId: string) => void;
  focusRequestId?: number;
};

const DEFAULT_CENTER: [number, number] = [39.8283, -98.5795];
const DEFAULT_ZOOM = 4;

function buildPopupDetails(point: CampsiteMapPoint): string[] {
  const details = [`${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`];
  if (point.campsiteType) details.push(`Type: ${point.campsiteType}`);
  if (point.amenities?.length) details.push(`Amenities: ${point.amenities.join(", ")}`);
  if (point.notes) details.push(`Notes: ${point.notes}`);
  return details;
}

export default function CampsiteMap({
  points,
  fill = false,
  selectedPointId,
  onSelectPoint,
  focusRequestId = 0,
}: Props) {
  const [leaflet, setLeaflet] = useState<null | {
    MapContainer: any;
    TileLayer: any;
    CircleMarker: any;
    Popup: any;
  }>(null);
  const [mapRef, setMapRef] = useState<any>(null);
  const markerRefs = useRef<Record<string, any>>({});
  const lastHandledFocusIdRef = useRef(0);

  useEffect(() => {
    let mounted = true;
    import("react-leaflet").then((mod) => {
      if (!mounted) return;
      setLeaflet({
        MapContainer: mod.MapContainer,
        TileLayer: mod.TileLayer,
        CircleMarker: mod.CircleMarker,
        Popup: mod.Popup,
      });
    });

    return () => {
      mounted = false;
    };
  }, []);

  const center = useMemo<[number, number]>(() => {
    if (!points.length) return DEFAULT_CENTER;

    const latitude = points.reduce((sum, point) => sum + point.latitude, 0) / points.length;
    const longitude = points.reduce((sum, point) => sum + point.longitude, 0) / points.length;
    return [latitude, longitude];
  }, [points]);
  const selectedPoint = useMemo(
    () => points.find((point) => point.id === selectedPointId) ?? null,
    [points, selectedPointId]
  );

  useEffect(() => {
    if (!selectedPoint || !mapRef || focusRequestId <= 0) return;
    if (focusRequestId === lastHandledFocusIdRef.current) return;
    lastHandledFocusIdRef.current = focusRequestId;

    mapRef.setView([selectedPoint.latitude, selectedPoint.longitude], 13, { animate: true });
    markerRefs.current[selectedPoint.id]?.openPopup?.();
    const timeout = setTimeout(() => {
      mapRef.setView([selectedPoint.latitude, selectedPoint.longitude], 13, { animate: true });
    }, 180);
    return () => clearTimeout(timeout);
  }, [mapRef, selectedPoint, focusRequestId]);

  if (!leaflet) {
    return (
      <div
        style={{
          width: "100%",
          height: fill ? "100%" : 280,
          minHeight: 280,
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid #374151",
          display: "grid",
          placeItems: "center",
          color: "#d1d5db",
          backgroundColor: "#111827",
        }}
      >
        Loading map...
      </div>
    );
  }

  const { MapContainer, TileLayer, CircleMarker, Popup } = leaflet;

  return (
    <div
      style={{
        width: "100%",
        height: fill ? "100%" : 280,
        minHeight: 280,
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid #374151",
      }}
    >
      <MapContainer
        ref={setMapRef}
        center={center}
        zoom={DEFAULT_ZOOM}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((point) => (
          <CircleMarker
            key={point.id}
            ref={(ref: any) => {
              if (ref) markerRefs.current[point.id] = ref;
            }}
            center={[point.latitude, point.longitude]}
            radius={point.id === selectedPointId ? 9 : 7}
            eventHandlers={{ click: () => onSelectPoint?.(point.id) }}
            pathOptions={{
              color: point.id === selectedPointId ? "#b91c1c" : "#1d4ed8",
              fillColor: point.id === selectedPointId ? "#ef4444" : "#3b82f6",
              fillOpacity: 0.85,
            }}
          >
            <Popup autoPan={false}>
              <strong>{point.name}</strong>
              {buildPopupDetails(point).map((detail) => (
                <div key={`${point.id}-${detail}`}>{detail}</div>
              ))}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}

export type { CampsiteMapPoint } from "./CampsiteMap.types";
