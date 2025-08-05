import { Button } from "@/components/ui/button";
import { Bot, Plus } from "lucide-react";
import { useLocation } from "wouter";

export function FloatingActions() {
  const [, setLocation] = useLocation();

  return (
    <div className="fixed bottom-6 right-6 space-y-3 z-40">
      {/* AI Assistant */}
      <Button
        size="lg"
        className="w-14 h-14 rounded-full shadow-lg"
        onClick={() => setLocation("/ai-assistant")}
      >
        <Bot className="w-6 h-6" />
      </Button>
      
      {/* Add Resource */}
      <Button
        size="lg"
        variant="outline"
        className="w-14 h-14 rounded-full shadow-lg bg-secondary text-secondary-foreground hover:bg-secondary/90"
        onClick={() => {
          // TODO: Open resource submission form
          console.log("Open add resource form");
        }}
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  );
}
