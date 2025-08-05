import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet
delete ((L as any).Icon.Default.prototype as any)._getIconUrl;
(L as any).Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapLocation {
  id: string;
  lat: number;
  lng: number;
  name: string;
  type: 'safehouse' | 'warehouse' | 'medical' | 'organization';
  description?: string;
  capacity?: number;
  occupancy?: number;
  phone?: string;
}

interface LeafletMapProps {
  locations: MapLocation[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  onLocationClick?: (location: MapLocation) => void;
}

export function LeafletMap({ 
  locations, 
  center = [50.4501, 30.5234], // Default to Kyiv, Ukraine (crisis zone)
  zoom = 10,
  height = '400px',
  onLocationClick
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any | null>(null);
  const markersRef = useRef<any[]>([]);

  // Custom icons for different resource types
  const getIcon = (type: string) => {
    const iconSize: [number, number] = [25, 41];
    const iconAnchor: [number, number] = [12, 41];
    const popupAnchor: [number, number] = [1, -34];

    const colors = {
      safehouse: '#22c55e',
      warehouse: '#f59e0b',
      medical: '#ef4444',
      organization: '#3b82f6'
    };

    return (L as any).divIcon({
      className: 'custom-div-icon',
      html: `
        <div class="marker-pin" style="
          background-color: ${colors[type as keyof typeof colors] || '#6b7280'};
          width: 30px;
          height: 30px;
          border-radius: 50% 50% 50% 0;
          position: relative;
          transform: rotate(-45deg);
          border: 3px solid #fff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(45deg);
            font-size: 14px;
            color: white;
            font-weight: bold;
          ">
            ${type === 'safehouse' ? '🏠' : 
              type === 'warehouse' ? '🍽️' :
              type === 'medical' ? '🏥' : '🏢'}
          </div>
        </div>
      `,
      iconSize,
      iconAnchor,
      popupAnchor
    });
  };

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = (L as any).map(mapRef.current).setView(center, zoom);

      // Add tile layer
      (L as any).tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);
    }

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current?.removeLayer(marker);
    });
    markersRef.current = [];

    // Add new markers
    locations.forEach(location => {
      if (!mapInstanceRef.current) return;

      const marker = (L as any).marker([location.lat, location.lng], {
        icon: getIcon(location.type)
      }).addTo(mapInstanceRef.current);

      // Create popup content
      const occupancyInfo = location.capacity && location.occupancy 
        ? `<div class="text-sm text-gray-600 mt-1">
             Occupancy: ${location.occupancy}/${location.capacity}
             <div class="w-full bg-gray-200 rounded-full h-2 mt-1">
               <div class="bg-blue-600 h-2 rounded-full" style="width: ${(location.occupancy / location.capacity) * 100}%"></div>
             </div>
           </div>`
        : '';

      const phoneInfo = location.phone 
        ? `<div class="text-sm text-gray-600 mt-1">📞 ${location.phone}</div>`
        : '';

      const popupContent = `
        <div class="p-2 min-w-[200px]">
          <h3 class="font-semibold text-lg mb-1">${location.name}</h3>
          <div class="text-sm text-gray-600 mb-2 capitalize">
            <span class="inline-block px-2 py-1 rounded-full text-xs font-medium" style="
              background-color: ${location.type === 'safehouse' ? '#dcfce7' : 
                                 location.type === 'warehouse' ? '#fef3c7' :
                                 location.type === 'medical' ? '#fee2e2' : '#dbeafe'};
              color: ${location.type === 'safehouse' ? '#166534' : 
                      location.type === 'warehouse' ? '#92400e' :
                      location.type === 'medical' ? '#991b1b' : '#1e40af'};
            ">
              ${location.type}
            </span>
          </div>
          ${location.description ? `<p class="text-sm text-gray-700 mb-2">${location.description}</p>` : ''}
          ${occupancyInfo}
          ${phoneInfo}
        </div>
      `;

      marker.bindPopup(popupContent);

      // Handle click events
      if (onLocationClick) {
        marker.on('click', () => onLocationClick(location));
      }

      markersRef.current.push(marker);
    });

    // Fit map to show all markers if there are any
    if (locations.length > 0) {
      const group = new (L as any).FeatureGroup(markersRef.current);
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
    }

    return () => {
      // Cleanup is handled by the component unmount
    };
  }, [locations, center, zoom, onLocationClick]);

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div 
      ref={mapRef} 
      style={{ height, width: '100%' }}
      className="rounded-lg overflow-hidden shadow-lg border"
    />
  );
}

export default LeafletMap;