'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { ServiceLocation } from './page';
import { Fingerprint, CheckCircle, MapPin, Clock, Phone } from 'lucide-react';

// Fix Leaflet default marker icon issue in Next.js
const fixMarkerIcon = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
};

// Custom marker icons by category
const createCategoryIcon = (category: string) => {
  const colors: Record<string, string> = {
    bank: '#22c55e', // green
    hospital: '#ef4444', // red
    university: '#3b82f6', // blue
    transport: '#f97316', // orange
    user: '#a855f7', // purple
  };

  const color = colors[category] || '#6b7280';

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          transform: rotate(45deg);
          color: white;
          font-size: 14px;
          font-weight: bold;
        ">
          ${category === 'bank' ? '🏦' : category === 'hospital' ? '🏥' : category === 'university' ? '🎓' : category === 'transport' ? '🚉' : category === 'user' ? '📍' : '📍'}
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

// Component to handle map center changes
function MapController({
  userLocation,
  selectedLocation,
}: {
  userLocation: [number, number] | null;
  selectedLocation: ServiceLocation | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedLocation) {
      map.flyTo(selectedLocation.coordinates, 15, { duration: 1 });
    } else if (userLocation) {
      map.flyTo(userLocation, 14, { duration: 1 });
    }
  }, [selectedLocation, userLocation, map]);

  return null;
}

interface MapComponentProps {
  locations: ServiceLocation[];
  userLocation: [number, number] | null;
  selectedLocation: ServiceLocation | null;
  onSelectLocation: (location: ServiceLocation | null) => void;
  categories: readonly { id: string; label: string; color: string }[];
}

export default function MapComponent({
  locations,
  userLocation,
  selectedLocation,
  onSelectLocation,
  categories,
}: MapComponentProps) {
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current) {
      fixMarkerIcon();
      hasInitialized.current = true;
    }
  }, []);

  // Malaysia center (Kuala Lumpur)
  const defaultCenter: [number, number] = [3.1390, 101.6869];
  const defaultZoom = 11;

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      className="h-full w-full"
      style={{ minHeight: '400px' }}
    >
      {/* Map Tiles - OpenStreetMap */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Map Controller for animations */}
      <MapController userLocation={userLocation} selectedLocation={selectedLocation} />

      {/* Location Markers */}
      {locations.map((location) => (
        <Marker
          key={location.id}
          position={location.coordinates}
          icon={createCategoryIcon(location.category)}
          eventHandlers={{
            click: () => onSelectLocation(location),
          }}
        >
          <Popup className="custom-popup">
            <div className="min-w-[200px] p-1">
              <h3 className="mb-1 font-semibold text-gray-900">{location.name}</h3>
              <p className="mb-2 text-xs text-gray-500">
                {categories.find((c) => c.id === location.category)?.label}
              </p>

              <div className="mb-2 flex flex-wrap gap-1">
                {location.isSmartIDEnabled && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                    <span>✓</span> Smart ID
                  </span>
                )}
                {location.hasSignLanguageInterpreter && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-cyan-100 px-2 py-0.5 text-xs text-cyan-800">
                    <span>✓</span> Sign Language
                  </span>
                )}
              </div>

              <div className="space-y-1 text-xs text-gray-600">
                <p className="flex items-start gap-1">
                  <span className="flex-shrink-0">📍</span>
                  {location.address}
                </p>
                <p className="flex items-start gap-1">
                  <span className="flex-shrink-0">🕐</span>
                  {location.hours}
                </p>
                {location.phone && (
                  <p className="flex items-start gap-1">
                    <span className="flex-shrink-0">📞</span>
                    {location.phone}
                  </p>
                )}
              </div>

              <button
                onClick={() => onSelectLocation(location)}
                className="mt-3 w-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:from-cyan-600 hover:to-blue-700"
              >
                View Details
              </button>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* User Location Marker */}
      {userLocation && (
        <>
          <Marker position={userLocation} icon={createCategoryIcon('user')}>
            <Popup>
              <div className="text-center">
                <p className="font-semibold text-gray-900">Your Location</p>
                <p className="text-xs text-gray-500">You are here</p>
              </div>
            </Popup>
          </Marker>
          {/* Accuracy circle */}
          <Circle
            center={userLocation}
            radius={200}
            pathOptions={{
              color: '#a855f7',
              fillColor: '#a855f7',
              fillOpacity: 0.1,
              weight: 2,
            }}
          />
        </>
      )}
    </MapContainer>
  );
}
