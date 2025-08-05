import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "./rating-stars";
import { MapPin, Phone, Users, Clock, Bookmark, Navigation } from "lucide-react";
import type { SafehouseWithRatings } from "@shared/schema";

interface ResourceCardProps {
  resource: SafehouseWithRatings;
  distance?: number;
  onGetDirections: (resource: SafehouseWithRatings) => void;
  onSave: (resource: SafehouseWithRatings) => void;
}

export function ResourceCard({ resource, distance, onGetDirections, onSave }: ResourceCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-secondary";
      case "full":
        return "bg-accent";
      case "closed":
        return "bg-destructive";
      default:
        return "bg-muted";
    }
  };

  const getServiceBadgeColor = (service: string) => {
    switch (service.toLowerCase()) {
      case "food":
        return "service-food";
      case "medical":
        return "service-medical";
      case "shelter":
        return "service-shelter";
      case "supplies":
        return "service-supplies";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "safehouse":
        return "Safehouse";
      case "warehouse":
        return "Food Warehouse";
      case "medical":
        return "Medical Facility";
      default:
        return type;
    }
  };

  const occupancyPercentage = (resource.currentOccupancy / resource.maxCapacity) * 100;
  const timeAgo = new Date(resource.lastUpdated).toLocaleString();

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <Badge variant="outline" className="mr-3">
                {getTypeLabel(resource.type)}
              </Badge>
              <RatingStars 
                rating={resource.averageRating} 
                showNumber 
                reviewCount={resource.ratings.length}
              />
            </div>
            <h4 className="text-lg font-semibold text-foreground mb-2">{resource.name}</h4>
            <p className="text-muted-foreground mb-3 flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              {resource.address}
            </p>
            
            {/* Status Indicators */}
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="flex items-center text-sm">
                <div className={`w-3 h-3 rounded-full mr-2 ${getStatusColor(resource.status)}`}></div>
                <span className="text-foreground capitalize">{resource.status}</span>
              </div>
              <div className="flex items-center text-sm">
                <Users className="w-4 h-4 text-muted-foreground mr-2" />
                <span className="text-foreground">
                  {resource.currentOccupancy}/{resource.maxCapacity} capacity
                </span>
              </div>
              <div className="flex items-center text-sm">
                <Clock className="w-4 h-4 text-muted-foreground mr-2" />
                <span className="text-foreground">Updated {timeAgo}</span>
              </div>
            </div>
            
            {/* Services Available */}
            <div className="flex flex-wrap gap-2 mb-4">
              {resource.services.map((service) => (
                <Badge 
                  key={service} 
                  variant="secondary" 
                  className={`service-badge ${getServiceBadgeColor(service)}`}
                >
                  {service}
                </Badge>
              ))}
            </div>
          </div>
          
          {distance && (
            <div className="text-right ml-4">
              <div className="text-sm text-muted-foreground mb-1">Distance</div>
              <div className="text-lg font-semibold text-primary">{distance.toFixed(1)} km</div>
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => onGetDirections(resource)} className="flex items-center">
            <Navigation className="w-4 h-4 mr-2" />
            Get Directions
          </Button>
          {resource.phoneNumber && (
            <Button asChild variant="outline" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
              <a href={`tel:${resource.phoneNumber}`} className="flex items-center">
                <Phone className="w-4 h-4 mr-2" />
                Call: {resource.phoneNumber}
              </a>
            </Button>
          )}
          <Button variant="outline" onClick={() => onSave(resource)} className="flex items-center">
            <Bookmark className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
