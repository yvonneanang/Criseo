import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import LeafletMap from "./leaflet-map";

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

export function MapView() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationError("Could not get your location");
          // Default to Kyiv, Ukraine (crisis zone example)
          setUserLocation([50.4501, 30.5234]);
        }
      );
    } else {
      setLocationError("Geolocation not supported");
      // Default to Kyiv, Ukraine
      setUserLocation([50.4501, 30.5234]);
    }
  }, []);

  // Fetch safehouses for map display
  const { data: safehouses, isLoading } = useQuery({
    queryKey: ['/api/safehouses'],
  });

  // Convert safehouses to map locations
  const mapLocations: MapLocation[] = (Array.isArray(safehouses) ? safehouses : []).map((safehouse: any) => ({
    id: safehouse.id,
    lat: safehouse.latitude,
    lng: safehouse.longitude,
    name: safehouse.name,
    type: 'safehouse' as const,
    description: safehouse.description,
    capacity: safehouse.capacity,
    occupancy: safehouse.occupancy,
    phone: safehouse.hotline
  }));

  // Add some sample locations for other resource types
  const sampleLocations: MapLocation[] = [
    {
      id: 'warehouse-1',
      lat: (userLocation?.[0] || 50.4501) + 0.01,
      lng: (userLocation?.[1] || 30.5234) + 0.02,
      name: 'Central Food Distribution Center',
      type: 'warehouse',
      description: 'Emergency food supplies and humanitarian aid',
      capacity: 500,
      occupancy: 320,
      phone: '+380 44 123 4567'
    },
    {  
      id: 'medical-1',
      lat: (userLocation?.[0] || 50.4501) - 0.015,
      lng: (userLocation?.[1] || 30.5234) + 0.01,
      name: 'Emergency Medical Station',
      type: 'medical',
      description: 'First aid and emergency medical care',
      phone: '+380 44 987 6543'
    },
    {
      id: 'org-1',
      lat: (userLocation?.[0] || 50.4501) + 0.02,
      lng: (userLocation?.[1] || 30.5234) - 0.01,
      name: 'International Red Cross',
      type: 'organization',
      description: 'Humanitarian assistance coordination',
      phone: '+380 44 555 0123'
    }
  ];

  const allLocations = [...mapLocations, ...sampleLocations];

  const handleLocationClick = (location: MapLocation) => {
    console.log('Location clicked:', location);
    // Could open a detailed view or perform other actions
  };

  if (isLoading || !userLocation) {
    return (
      <div className="mb-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Crisis Resources Map
            </CardTitle>
          </CardHeader>
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4 mx-auto" />
              <p className="text-muted-foreground">Loading interactive map...</p>
              {locationError && (
                <p className="text-sm text-amber-600 mt-2">{locationError}</p>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Crisis Resources Map
            <span className="text-sm font-normal text-muted-foreground ml-auto">
              {allLocations.length} resources nearby
            </span>
          </CardTitle>
        </CardHeader>
        <div className="p-4">
          <LeafletMap
            locations={allLocations}
            center={userLocation}
            zoom={12}
            height="400px"
            onLocationClick={handleLocationClick}
          />
          <div className="flex flex-wrap gap-2 mt-4 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Safehouses</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span>Food Centers</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Medical</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Organizations</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
