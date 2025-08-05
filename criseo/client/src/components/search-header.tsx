import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Home, Utensils, Heart, Shirt } from "lucide-react";

interface SearchFilters {
  location: string;
  radius: number;
  type: string;
  sortBy: string;
  services: string[];
}

interface SearchHeaderProps {
  onFiltersChange: (filters: SearchFilters) => void;
  onGetCurrentLocation: () => void;
}

export function SearchHeader({ onFiltersChange, onGetCurrentLocation }: SearchHeaderProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    location: "",
    radius: 10,
    type: "safehouse",
    sortBy: "distance",
    services: []
  });

  const updateFilters = (updates: Partial<SearchFilters>) => {
    const newFilters = { ...filters, ...updates };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const toggleService = (service: string) => {
    const newServices = filters.services.includes(service)
      ? filters.services.filter(s => s !== service)
      : [...filters.services, service];
    updateFilters({ services: newServices });
  };

  const serviceButtons = [
    { key: "safehouse", label: "Safehouses", icon: Home },
    { key: "food", label: "Food", icon: Utensils },
    { key: "medical", label: "Medical", icon: Heart },
    { key: "supplies", label: "Supplies", icon: Shirt },
  ];

  return (
    <div className="mb-8">
      <Card className="shadow-lg">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold text-foreground mb-4">Find Resources Near You</h2>
          
          {/* Location Input */}
          <div className="mb-4">
            <Label htmlFor="location" className="block text-sm font-medium text-foreground mb-2">
              Current Location
            </Label>
            <div className="relative">
              <Input
                id="location"
                type="text"
                placeholder="Enter your location or use GPS"
                value={filters.location}
                onChange={(e) => updateFilters({ location: e.target.value })}
                className="pl-10"
              />
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            </div>
            <Button
              variant="link"
              onClick={onGetCurrentLocation}
              className="mt-2 p-0 h-auto text-primary font-medium"
            >
              <MapPin className="w-4 h-4 mr-1" />
              Use my current location
            </Button>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            {serviceButtons.map((service) => {
              const isActive = filters.type === service.key;
              const Icon = service.icon;
              
              return (
                <Button
                  key={service.key}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateFilters({ type: service.key })}
                  className={isActive ? "bg-primary text-primary-foreground" : ""}
                >
                  <Icon className="w-4 h-4 mr-1" />
                  {service.label}
                </Button>
              );
            })}
          </div>

          {/* Distance and Sort Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="radius" className="block text-sm font-medium text-foreground mb-2">
                Search Radius
              </Label>
              <Select
                value={filters.radius.toString()}
                onValueChange={(value) => updateFilters({ radius: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">Within 5 km</SelectItem>
                  <SelectItem value="10">Within 10 km</SelectItem>
                  <SelectItem value="25">Within 25 km</SelectItem>
                  <SelectItem value="50">Within 50 km</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sortBy" className="block text-sm font-medium text-foreground mb-2">
                Sort By
              </Label>
              <Select
                value={filters.sortBy}
                onValueChange={(value) => updateFilters({ sortBy: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="distance">Distance</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="availability">Availability</SelectItem>
                  <SelectItem value="updated">Recently Updated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
