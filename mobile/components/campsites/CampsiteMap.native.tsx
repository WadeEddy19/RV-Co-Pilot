import { useEffect, useMemo, useRef } from "react";
import type { ComponentRef } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { CampsiteMapPoint } from "./CampsiteMap.types";

type Props = {
  points: CampsiteMapPoint[];
  fill?: boolean;
  selectedPointId?: string | null;
  onSelectPoint?: (pointId: string) => void;
  focusRequestId?: number;
};
type MarkerRef = ComponentRef<typeof Marker>;

const DEFAULT_REGION: Region = {
  latitude: 39.8283,
  longitude: -98.5795,
  latitudeDelta: 25,
  longitudeDelta: 25,
};

function buildRegion(points: CampsiteMapPoint[]): Region {
  if (!points.length) return DEFAULT_REGION;

  const lats = points.map((p) => p.latitude);
  const lngs = points.map((p) => p.longitude);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const latitude = (minLat + maxLat) / 2;
  const longitude = (minLng + maxLng) / 2;
  const latitudeDelta = Math.max((maxLat - minLat) * 1.6, 0.08);
  const longitudeDelta = Math.max((maxLng - minLng) * 1.6, 0.08);

  return { latitude, longitude, latitudeDelta, longitudeDelta };
}

function buildDescription(point: CampsiteMapPoint): string {
  const details = [`${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`];
  if (point.campsiteType) details.push(`Type: ${point.campsiteType}`);
  if (point.amenities?.length) details.push(`Amenities: ${point.amenities.join(", ")}`);
  if (point.notes) details.push(`Notes: ${point.notes}`);
  return details.join("\n");
}

export default function CampsiteMap({
  points,
  fill = false,
  selectedPointId,
  onSelectPoint,
  focusRequestId = 0,
}: Props) {
  const region = buildRegion(points);
  const mapKey = points.map((p) => p.id).join("|") || "default-map";
  const mapRef = useRef<MapView | null>(null);
  const markerRefs = useRef<Record<string, MarkerRef | null>>({});
  const selectedPoint = useMemo(
    () => points.find((point) => point.id === selectedPointId) ?? null,
    [points, selectedPointId]
  );
  const lastHandledFocusIdRef = useRef(0);

  useEffect(() => {
    if (!selectedPoint || focusRequestId <= 0) return;
    if (focusRequestId === lastHandledFocusIdRef.current) return;
    lastHandledFocusIdRef.current = focusRequestId;

    const targetRegion = {
      latitude: selectedPoint.latitude,
      longitude: selectedPoint.longitude,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    };

    mapRef.current?.animateToRegion(targetRegion, 350);

    const showCalloutTimeout = setTimeout(() => {
      markerRefs.current[selectedPoint.id]?.showCallout?.();
    }, 380);
    const recenterTimeout = setTimeout(() => {
      mapRef.current?.animateToRegion(targetRegion, 220);
    }, 520);

    return () => {
      clearTimeout(showCalloutTimeout);
      clearTimeout(recenterTimeout);
    };
  }, [selectedPoint, focusRequestId]);

  return (
    <View style={[styles.wrapper, fill ? styles.fill : null]}>
      <MapView key={mapKey} ref={mapRef} style={styles.map} initialRegion={region}>
        {points.map((point) => (
          <Marker
            key={point.id}
            ref={(ref) => {
              markerRefs.current[point.id] = ref;
            }}
            coordinate={{ latitude: point.latitude, longitude: point.longitude }}
            title={point.name}
            description={buildDescription(point)}
            pinColor={point.id === selectedPointId ? "#ef4444" : undefined}
            onPress={() => onSelectPoint?.(point.id)}
          />
        ))}
      </MapView>
    </View>
  );
}

export type { CampsiteMapPoint } from "./CampsiteMap.types";

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    height: 280,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#374151",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  fill: {
    flex: 1,
    height: "100%",
    minHeight: 280,
  },
});
