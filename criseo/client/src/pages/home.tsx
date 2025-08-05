import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { SearchHeader } from "@/components/search-header";
import { MapView } from "@/components/map-view";
import { ResourceCard } from "@/components/resource-card";
import { FloatingActions } from "@/components/floating-actions";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import type { SafehouseWithRatings } from "@shared/schema";

interface SearchFilters {
  location: string;
  radius: number;
  type: string;
  sortBy: string;
  services: string[];
}

export default function Home() {
  const [filters, setFilters] = useState<SearchFilters>({
    location: "",
    radius: 10,
    type: "safehouse",
    sortBy: "distance",
    services: []
  });
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  const { data: resources = [], isLoading, error } = useQuery<SafehouseWithRatings[]>({
    queryKey: ["/api/safehouses", filters, userLocation],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (userLocation) {
        params.append("latitude", userLocation.latitude.toString());
        params.append("longitude", userLocation.longitude.toString());
        params.append("radius", filters.radius.toString());
      }
      
      if (filters.type && filters.type !== "all") {
        params.append("type", filters.type);
      }
      
      if (filters.services.length > 0) {
        filters.services.forEach(service => params.append("services", service));
      }

      const response = await fetch(`/api/safehouses?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch resources");
      }
      return response.json();
    }
  });

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        toast({
          title: "Location found",
          description: "Using your current location to find nearby resources.",
        });
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast({
          title: "Location error",
          description: "Unable to get your current location. Please enter it manually.",
          variant: "destructive",
        });
      }
    );
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleGetDirections = (resource: SafehouseWithRatings) => {
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(resource.address)}`;
    window.open(mapsUrl, "_blank");
  };

  const handleSaveResource = (resource: SafehouseWithRatings) => {
    // TODO: Implement save to favorites functionality
    toast({
      title: "Resource saved",
      description: `${resource.name} has been saved to your favorites.`,
    });
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center py-12">
          <p className="text-destructive text-lg font-medium">
            Error loading resources. Please try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <SearchHeader 
        onFiltersChange={setFilters}
        onGetCurrentLocation={getCurrentLocation}
      />
      
      <MapView />
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-foreground">
            Available Resources ({resources.length} found)
          </h3>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading resources...</span>
          </div>
        ) : resources.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No resources found in your area. Try expanding your search radius.
            </p>
          </div>
        ) : (
          <>
            {resources.map((resource) => {
              const distance = userLocation 
                ? calculateDistance(
                    userLocation.latitude, 
                    userLocation.longitude, 
                    resource.latitude, 
                    resource.longitude
                  )
                : undefined;
              
              return (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  distance={distance}
                  onGetDirections={handleGetDirections}
                  onSave={handleSaveResource}
                />
              );
            })}
            
            {/* Load More Button */}
            <div className="text-center pt-6">
              <Button variant="outline" size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Load More Resources
              </Button>
            </div>
          </>
        )}
      </div>
      
      <FloatingActions />
    </main>
  );
}
