import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, Mail, ExternalLink, Search, Shield, Clock, Globe, Loader2 } from "lucide-react";
import type { Organization } from "@shared/schema";

export default function OrganizationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const { data: organizations = [], isLoading } = useQuery<Organization[]>({
    queryKey: ["/api/organizations", verifiedOnly ? "true" : undefined]
  });

  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.services.some(service => service.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = typeFilter === "all" || org.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const verifiedOrgs = filteredOrganizations.filter(org => org.isVerified);
  const unverifiedOrgs = filteredOrganizations.filter(org => !org.isVerified);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "ngo":
        return "bg-blue-100 text-blue-800";
      case "government":
        return "bg-green-100 text-green-800";
      case "charity":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getServiceColor = (service: string) => {
    switch (service.toLowerCase()) {
      case "emergency response":
        return "bg-red-100 text-red-800";
      case "food distribution":
        return "bg-orange-100 text-orange-800";
      case "medical aid":
        return "bg-green-100 text-green-800";
      case "shelter":
        return "bg-blue-100 text-blue-800";
      case "family services":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getResponseTimeColor = (responseTime?: string) => {
    if (!responseTime) return "text-muted-foreground";
    
    if (responseTime.includes("< 1 hour") || responseTime.includes("immediate")) {
      return "text-green-600";
    } else if (responseTime.includes("24") || responseTime.includes("same day")) {
      return "text-orange-600";
    }
    return "text-muted-foreground";
  };

  const OrganizationCard = ({ org }: { org: Organization }) => (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <CardTitle className="text-lg mr-3">{org.name}</CardTitle>
              {org.isVerified && (
                <div className="flex items-center">
                  <Shield className="w-4 h-4 text-green-500 mr-1" />
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Verified
                  </Badge>
                </div>
              )}
            </div>
            <Badge className={getTypeColor(org.type)} variant="secondary">
              {org.type.toUpperCase()}
            </Badge>
          </div>
          
          {org.responseTime && (
            <div className="text-right">
              <div className="text-sm text-muted-foreground mb-1">Response Time</div>
              <div className={`text-lg font-semibold ${getResponseTimeColor(org.responseTime)}`}>
                {org.responseTime}
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {org.description && (
          <p className="text-muted-foreground">{org.description}</p>
        )}
        
        {/* Services */}
        <div>
          <h4 className="font-medium mb-2 text-foreground">Services Provided:</h4>
          <div className="flex flex-wrap gap-2">
            {org.services.map((service, index) => (
              <Badge key={index} variant="secondary" className={getServiceColor(service)}>
                {service}
              </Badge>
            ))}
          </div>
        </div>
        
        {/* Languages */}
        {org.languages && org.languages.length > 0 && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Globe className="w-4 h-4 mr-2" />
            <span>Languages: {org.languages.join(", ")}</span>
          </div>
        )}
        
        {/* Contact Information */}
        <div className="space-y-2">
          <h4 className="font-medium text-foreground">Contact Information:</h4>
          <div className="flex flex-wrap gap-2">
            {org.phoneNumber && (
              <Button asChild size="sm" variant="outline">
                <a href={`tel:${org.phoneNumber}`} className="flex items-center">
                  <Phone className="w-3 h-3 mr-1" />
                  {org.phoneNumber}
                </a>
              </Button>
            )}
            {org.email && (
              <Button asChild size="sm" variant="outline">
                <a href={`mailto:${org.email}`} className="flex items-center">
                  <Mail className="w-3 h-3 mr-1" />
                  Email
                </a>
              </Button>
            )}
            {org.website && (
              <Button asChild size="sm" variant="outline">
                <a href={org.website} target="_blank" rel="noopener noreferrer" className="flex items-center">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Website
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-4">Humanitarian Organizations</h1>
        <p className="text-muted-foreground">
          Find verified NGOs, government agencies, and charitable organizations providing crisis aid and support services.
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search organizations, services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="ngo">NGOs</SelectItem>
                <SelectItem value="government">Government</SelectItem>
                <SelectItem value="charity">Charities</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center">
              <Button
                variant={verifiedOnly ? "default" : "outline"}
                onClick={() => setVerifiedOnly(!verifiedOnly)}
                className="w-full"
              >
                <Shield className="w-4 h-4 mr-2" />
                {verifiedOnly ? "All Organizations" : "Verified Only"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading organizations...</span>
        </div>
      ) : (
        <Tabs defaultValue="verified" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="verified" className="flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              Verified ({verifiedOrgs.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center">
              All Organizations ({filteredOrganizations.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="verified" className="space-y-4">
            {verifiedOrgs.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">No verified organizations found.</p>
                <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
              </div>
            ) : (
              verifiedOrgs.map((org) => (
                <OrganizationCard key={org.id} org={org} />
              ))
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {filteredOrganizations.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">No organizations found.</p>
                <p className="text-sm text-muted-foreground">Try different search terms or clear filters.</p>
              </div>
            ) : (
              <>
                {/* Priority: Verified organizations first */}
                {verifiedOrgs.length > 0 && (
                  <>
                    <h2 className="text-xl font-semibold text-foreground flex items-center">
                      <Shield className="w-5 h-5 mr-2 text-green-500" />
                      Verified Organizations
                    </h2>
                    <div className="space-y-4">
                      {verifiedOrgs.map((org) => (
                        <OrganizationCard key={org.id} org={org} />
                      ))}
                    </div>
                  </>
                )}
                
                {/* Then unverified organizations */}
                {unverifiedOrgs.length > 0 && (
                  <>
                    <h2 className="text-xl font-semibold text-foreground mt-8">
                      Other Organizations
                    </h2>
                    <div className="space-y-4">
                      {unverifiedOrgs.map((org) => (
                        <OrganizationCard key={org.id} org={org} />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      )}
    </main>
  );
}
