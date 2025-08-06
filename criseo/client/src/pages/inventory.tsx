import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, Package, ChefHat, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Inventory, SafehouseWithRatings } from "@shared/schema";

export default function InventoryPage() {
  const [selectedSafehouse, setSelectedSafehouse] = useState<string>("");
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({
    itemName: "",
    quantity: "",
    unit: "",
    category: "",
    expiryDate: ""
  });
  const { toast } = useToast();

  // Fetch safehouses
  const { data: safehouses = [] } = useQuery<SafehouseWithRatings[]>({
    queryKey: ["/api/safehouses"]
  });

  // Fetch inventory for selected safehouse
  const { data: inventory = [], isLoading } = useQuery<Inventory[]>({
    queryKey: ["/api/safehouses", selectedSafehouse, "inventory"],
    enabled: !!selectedSafehouse
  });

  // Add inventory item mutation
  const addItemMutation = useMutation({
    mutationFn: async (itemData: any) => {
      return apiRequest("POST", "/api/inventory", {
        ...itemData,
        safehouseId: selectedSafehouse,
        quantity: parseFloat(itemData.quantity)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/safehouses", selectedSafehouse, "inventory"] });
      setShowAddItem(false);
      setNewItem({ itemName: "", quantity: "", unit: "", category: "", expiryDate: "" });
      toast({
        title: "Item added",
        description: "Inventory item has been added successfully."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add inventory item.",
        variant: "destructive"
      });
    }
  });

  // Get AI recipes
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [peopleCount, setPeopleCount] = useState("10");

  const generateRecipes = async () => {
    if (!selectedSafehouse || inventory.length === 0) {
      toast({
        title: "No inventory",
        description: "Please select a safehouse with inventory items.",
        variant: "destructive"
      });
      return;
    }

    setLoadingRecipes(true);
    try {
      const response = await apiRequest("POST", "/api/ai/recipes", {
        inventory,
        peopleCount: parseInt(peopleCount)
      });
      const data = await response.json();
      setRecipes(data.recipes);
      // setRecipes(data.recipes || []); 
      toast({
        title: "Recipes generated",
        // ${data.recipes?.length || 0}
        description: `Generated ${data.recipes?.length} recipes for ${peopleCount} people.`
      });
    } catch (error) {
      console.error("Error generating recipes:", error);
      toast({
        title: "Error",
        description: "Failed to generate recipes.",
        variant: "destructive"
      });
    } finally {
      setLoadingRecipes(false);
    }
  };

  // Calculate rations
  const [loadingRations, setLoadingRations] = useState(false);
  const [rationPlan, setRationPlan] = useState<any>(null);
  const [rationDays, setRationDays] = useState("3");

  const calculateRations = async () => {
    if (!selectedSafehouse || inventory.length === 0) {
      toast({
        title: "No inventory",
        description: "Please select a safehouse with inventory items.",
        variant: "destructive"
      });
      return;
    }

    setLoadingRations(true);
    try {
      const response = await apiRequest("POST", "/api/ai/rations", {
        inventory,
        peopleCount: parseInt(peopleCount),
        days: parseInt(rationDays)
      });
      const data = await response.json();
      setRationPlan(data);
      toast({
        title: "Ration plan calculated",
        description: `Generated ration plan for ${peopleCount} people over ${rationDays} days.`
      });
    } catch (error) {
      console.error("Error calculating rations:", error);
      toast({
        title: "Error",
        description: "Failed to calculate rations.",
        variant: "destructive"
      });
    } finally {
      setLoadingRations(false);
    }
  };

  const handleAddItem = () => {
    if (!newItem.itemName || !newItem.quantity || !newItem.unit || !newItem.category) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    addItemMutation.mutate(newItem);
  };

  const groupedInventory = inventory.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, Inventory[]>);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-4">Inventory Management</h1>
        
        {/* Safehouse Selection */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <Label htmlFor="safehouse" className="block text-sm font-medium text-foreground mb-2">
              Select Safehouse
            </Label>
            <Select value={selectedSafehouse} onValueChange={setSelectedSafehouse}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a safehouse to manage inventory" />
              </SelectTrigger>
              <SelectContent>
                {safehouses
                  .filter(house => house.type === "safehouse" || house.type === "warehouse")
                  .map((house) => (
                    <SelectItem key={house.id} value={house.id}>
                      {house.name} - {house.address}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {selectedSafehouse && (
        <Tabs defaultValue="inventory" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="inventory" className="flex items-center">
              <Package className="w-4 h-4 mr-2" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="recipes" className="flex items-center">
              <ChefHat className="w-4 h-4 mr-2" />
              AI Recipes
            </TabsTrigger>
            <TabsTrigger value="rations" className="flex items-center">
              <Calculator className="w-4 h-4 mr-2" />
              Ration Planning
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-foreground">Current Inventory</h2>
              <Dialog open={showAddItem} onOpenChange={setShowAddItem}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Inventory Item</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="itemName">Item Name</Label>
                      <Input
                        id="itemName"
                        value={newItem.itemName}
                        onChange={(e) => setNewItem({ ...newItem, itemName: e.target.value })}
                        placeholder="e.g., Rice, Canned Beans"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input
                          id="quantity"
                          type="number"
                          value={newItem.quantity}
                          onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                          placeholder="100"
                        />
                      </div>
                      <div>
                        <Label htmlFor="unit">Unit</Label>
                        <Input
                          id="unit"
                          value={newItem.unit}
                          onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                          placeholder="kg, pieces, liters"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={newItem.category}
                        onValueChange={(value) => setNewItem({ ...newItem, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="food">Food</SelectItem>
                          <SelectItem value="water">Water</SelectItem>
                          <SelectItem value="medical">Medical</SelectItem>
                          <SelectItem value="clothing">Clothing</SelectItem>
                          <SelectItem value="supplies">Supplies</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
                      <Input
                        id="expiryDate"
                        type="date"
                        value={newItem.expiryDate}
                        onChange={(e) => setNewItem({ ...newItem, expiryDate: e.target.value })}
                      />
                    </div>
                    <Button 
                      onClick={handleAddItem} 
                      className="w-full"
                      disabled={addItemMutation.isPending}
                    >
                      {addItemMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4 mr-2" />
                      )}
                      Add Item
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading inventory...</span>
              </div>
            ) : Object.keys(groupedInventory).length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">No inventory items found.</p>
                <p className="text-sm text-muted-foreground">Add items to start managing inventory.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedInventory).map(([category, items]) => (
                  <Card key={category}>
                    <CardHeader>
                      <CardTitle className="text-lg capitalize">{category}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="border border-border rounded-lg p-4 space-y-2"
                          >
                            <h4 className="font-medium text-foreground">{item.itemName}</h4>
                            <p className="text-sm text-muted-foreground">
                              Quantity: {item.quantity} {item.unit}
                            </p>
                            {item.expiryDate && (
                              <p className="text-sm text-muted-foreground">
                                Expires: {new Date(item.expiryDate).toLocaleDateString()}
                              </p>
                            )}
                            <Badge variant="outline" className="capitalize">
                              {item.category}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="recipes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Recipe Generator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="peopleCount">Number of People</Label>
                    <Input
                      id="peopleCount"
                      type="number"
                      value={peopleCount}
                      onChange={(e) => setPeopleCount(e.target.value)}
                      placeholder="10"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={generateRecipes}
                      disabled={loadingRecipes || !selectedSafehouse}
                      className="w-full"
                    >
                      {loadingRecipes ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <ChefHat className="w-4 h-4 mr-2" />
                      )}
                      Generate Recipes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {recipes.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Generated Recipes</h3>
                {recipes.map((recipe, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-lg">{recipe.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">Serves {recipe.servings} people</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Ingredients:</h4>
                        <ul className="space-y-1">
                          {recipe.ingredients.map((ingredient: any, i: number) => (
                            <li key={i} className="text-sm text-muted-foreground">
                              • {ingredient.quantity} {ingredient.unit} {ingredient.item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Instructions:</h4>
                        <ol className="space-y-1">
                          {recipe.instructions.map((step: string, i: number) => (
                            <li key={i} className="text-sm text-muted-foreground">
                              {i + 1}. {step}
                            </li>
                          ))}
                        </ol>
                      </div>
                      {recipe.nutritionalInfo && (
                        <div className="bg-muted p-3 rounded-lg">
                          <h4 className="font-medium mb-2">Nutritional Info (per serving):</h4>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>Calories: {recipe.nutritionalInfo.calories}</div>
                            <div>Protein: {recipe.nutritionalInfo.protein}</div>
                            <div>Carbs: {recipe.nutritionalInfo.carbs}</div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Ration Calculator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="rationPeople">Number of People</Label>
                    <Input
                      id="rationPeople"
                      type="number"
                      value={peopleCount}
                      onChange={(e) => setPeopleCount(e.target.value)}
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="rationDays">Number of Days</Label>
                    <Input
                      id="rationDays"
                      type="number"
                      value={rationDays}
                      onChange={(e) => setRationDays(e.target.value)}
                      placeholder="3"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={calculateRations}
                      disabled={loadingRations || !selectedSafehouse}
                      className="w-full"
                    >
                      {loadingRations ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Calculator className="w-4 h-4 mr-2" />
                      )}
                      Calculate
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {rationPlan && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Ration Plan</h3>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Plan Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-primary">{rationPlan.totalDays}</div>
                        <div className="text-sm text-muted-foreground">Days</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-primary">{rationPlan.peopleCount}</div>
                        <div className="text-sm text-muted-foreground">People</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-primary">{rationPlan.dailyCaloriesPerPerson}</div>
                        <div className="text-sm text-muted-foreground">Calories/person/day</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {rationPlan.shortages && rationPlan.shortages.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-destructive">Critical Shortages</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {rationPlan.shortages.map((shortage: any, index: number) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-destructive/10 rounded">
                            <span className="font-medium">{shortage.item}</span>
                            <span className="text-sm text-destructive">
                              Need {shortage.needed} {shortage.unit}, have {shortage.available} {shortage.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {rationPlan.recommendations && rationPlan.recommendations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {rationPlan.recommendations.map((rec: string, index: number) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start">
                            <span className="mr-2">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </main>
  );
}
