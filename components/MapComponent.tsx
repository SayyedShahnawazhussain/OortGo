
import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { motion } from 'framer-motion';
import { Crosshair } from 'lucide-react';

interface MapProps {
  showDrivers?: boolean;
  targetLocation?: { lat: number; lng: number; label: string } | null;
  pickupLocation?: { lat: number; lng: number; label: string } | null;
  eta?: number | null;
  mode?: 'PASSENGER' | 'DRIVER';
}

const MapComponent: React.FC<MapProps> = ({ 
  targetLocation, 
  pickupLocation,
  mode = 'PASSENGER'
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const userMarker = useRef<L.Marker | null>(null);
  const targetMarker = useRef<L.Marker | null>(null);
  const pickupMarker = useRef<L.Marker | null>(null);
  const polyline = useRef<L.Polyline | null>(null);

  const [location, setLocation] = useState<[number, number] | null>(null);
  const [isFollowing, setIsFollowing] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  // Initial Map Setup
  useEffect(() => {
    if (!mapRef.current) return;

    // Standard Leaflet Initialization for React 18/19
    const container = mapRef.current;
    
    // Clear the container to be absolutely sure
    container.innerHTML = "";

    const map = L.map(container, {
      center: [28.6139, 77.2090], 
      zoom: 16,
      zoomControl: false,
      attributionControl: false, 
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      attribution: '', 
    }).addTo(map);

    leafletMap.current = map;
    setMapReady(true);

    map.on('dragstart', () => setIsFollowing(false));

    return () => {
      // Cleanup: Destroy map and clear all layer refs to prevent 'appendChild' errors on remount
      setMapReady(false);
      map.remove();
      leafletMap.current = null;
      userMarker.current = null;
      targetMarker.current = null;
      pickupMarker.current = null;
      polyline.current = null;
    };
  }, []);

  // Geolocation Watcher
  useEffect(() => {
    if (!navigator.geolocation || !mapReady || !leafletMap.current) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const newPos: [number, number] = [latitude, longitude];
        setLocation(newPos);

        const map = leafletMap.current;
        if (!map || !mapReady) return;

        // Ensure we are working with the active map instance
        try {
          if (!userMarker.current) {
            const icon = L.divIcon({
              className: 'custom-div-icon',
              html: `<div class="w-6 h-6 bg-white border-4 border-cyan-500 rounded-full shadow-[0_0_20px_rgba(34,211,238,0.8)] animate-pulse"></div>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            });
            userMarker.current = L.marker(newPos, { icon }).addTo(map);
          } else {
            userMarker.current.setLatLng(newPos);
          }

          if (isFollowing) {
            map.setView(newPos, mode === 'DRIVER' ? 18 : 16, { animate: true });
          }
        } catch (e) {
          console.debug("Marker update issue:", e);
        }
      },
      (err) => console.debug("Geo sync issue:", err),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isFollowing, mode, mapReady]);

  // Routing and Markers
  useEffect(() => {
    if (!mapReady || !leafletMap.current || !location) return;
    
    const map = leafletMap.current;
    
    const destination = targetLocation || pickupLocation;

    const clearLayers = () => {
      if (!map) return;
      if (polyline.current) { map.removeLayer(polyline.current); polyline.current = null; }
      if (targetMarker.current) { map.removeLayer(targetMarker.current); targetMarker.current = null; }
      if (pickupMarker.current) { map.removeLayer(pickupMarker.current); pickupMarker.current = null; }
    };

    if (!destination) {
      clearLayers();
      return;
    }

    const updateRouting = async () => {
      if (!map) return;

      try {
        // Update Pickup Marker
        if (pickupLocation) {
          if (!pickupMarker.current) {
            pickupMarker.current = L.marker([pickupLocation.lat, pickupLocation.lng], {
              icon: L.divIcon({ html: `<div class="w-10 h-10 bg-emerald-500 rounded-[14px] border-4 border-black shadow-2xl flex items-center justify-center text-white ring-1 ring-white/20"><div class="w-3 h-3 bg-white rounded-full"></div></div>`, className: '' })
            }).addTo(map);
          } else {
            pickupMarker.current.setLatLng([pickupLocation.lat, pickupLocation.lng]);
          }
        } else if (pickupMarker.current) {
          map.removeLayer(pickupMarker.current);
          pickupMarker.current = null;
        }

        // Update Target Marker
        if (targetLocation) {
          if (!targetMarker.current) {
            targetMarker.current = L.marker([targetLocation.lat, targetLocation.lng], {
              icon: L.divIcon({ html: `<div class="w-10 h-10 bg-cyan-500 rounded-[14px] border-4 border-black shadow-2xl flex items-center justify-center text-white ring-1 ring-white/20"><div class="w-3 h-3 bg-white rounded-full"></div></div>`, className: '' })
            }).addTo(map);
          } else {
            targetMarker.current.setLatLng([targetLocation.lat, targetLocation.lng]);
          }
        } else if (targetMarker.current) {
          map.removeLayer(targetMarker.current);
          targetMarker.current = null;
        }

        // Fetch and Draw Route
        const url = `https://router.project-osrm.org/route/v1/driving/${location[1]},${location[0]};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) throw new Error("Network Response Failure");

        const data = await res.json();

        // Check if map still exists before adding the polyline
        if (data.routes && data.routes.length > 0 && leafletMap.current) {
          const coords = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
          if (coords.length > 0) {
            if (polyline.current) map.removeLayer(polyline.current);
            
            polyline.current = L.polyline(coords, {
              color: mode === 'DRIVER' ? '#22d3ee' : '#ffffff',
              weight: 6,
              opacity: 0.8,
              lineJoin: 'round',
              lineCap: 'round',
            }).addTo(map);
          }
        }
      } catch (e) {
        // Fallback to straight line if OSRM fails
        if (leafletMap.current) {
           if (polyline.current) map.removeLayer(polyline.current);
           polyline.current = L.polyline([location, [destination.lat, destination.lng]], {
             color: mode === 'DRIVER' ? '#22d3ee' : '#ffffff',
             weight: 4,
             dashArray: '10, 12',
             opacity: 0.4,
             lineJoin: 'round',
             lineCap: 'round',
           }).addTo(map);
        }
      }
    };

    updateRouting();
  }, [location, targetLocation, pickupLocation, mode, mapReady]);

  return (
    <div className="w-full h-full relative bg-black">
      <div ref={mapRef} className="w-full h-full outline-none" />
      <div className="absolute top-24 right-6 z-[1000]">
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => {if (location) setIsFollowing(true);}}
          className={`p-5 rounded-3xl border backdrop-blur-3xl shadow-4xl transition-all ${isFollowing ? 'bg-white text-black border-white' : 'bg-black/60 text-white border-white/10'}`}
        >
          <Crosshair className="w-6 h-6" />
        </motion.button>
      </div>
    </div>
  );
};

export default MapComponent;
