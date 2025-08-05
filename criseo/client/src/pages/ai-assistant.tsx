import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, Loader2, Phone, Mail, ExternalLink, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { apiRequest } from "@/lib/queryClient";

interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  recommendation?: any;
}

export default function AIAssistantPage() {
  const { currentLanguage } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      type: "assistant",
      content: "Hello! I'm your crisis aid assistant powered by Gemma 3n. I can help you find safehouses, food warehouses, medical facilities, and humanitarian organizations. I can also provide information about verified NGOs and their contact details. How can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await apiRequest("POST", "/api/ai/recommend", {
        query: inputMessage,
        location: null, // TODO: Get user location if available
        userPreferences: null,
        userLanguage: currentLanguage
      });

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: "Based on your request, here are my recommendations:",
        timestamp: new Date(),
        recommendation: data
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error getting AI recommendation:", error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again or contact emergency services directly if this is urgent.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: "Failed to get AI recommendation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "emergency":
        return "bg-destructive text-destructive-foreground";
      case "urgent":
        return "bg-accent text-accent-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive text-destructive-foreground";
      case "medium":
        return "bg-accent text-accent-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-4 flex items-center">
          <Bot className="w-8 h-8 mr-3 text-primary" />
          AI Crisis Assistant
        </h1>
        <p className="text-muted-foreground">
          Get personalized recommendations for crisis resources, safehouses, food warehouses, and verified humanitarian organizations.
        </p>
      </div>

      <Card className="h-[600px] flex flex-col">
        <CardHeader>
          <CardTitle className="text-lg">Chat with AI Assistant</CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.type === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    
                    {message.recommendation && (
                      <div className="mt-4 space-y-4">
                        {/* Urgency Level */}
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4" />
                          <Badge className={getUrgencyColor(message.recommendation.urgencyLevel)}>
                            {message.recommendation.urgencyLevel} Priority
                          </Badge>
                        </div>

                        {/* Recommendations */}
                        <div className="space-y-3">
                          {message.recommendation.recommendations?.map((rec: any, index: number) => (
                            <div key={index} className="border border-border rounded-lg p-3 bg-card">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-card-foreground capitalize">
                                  {rec.type} Resource
                                </h4>
                                <Badge className={getPriorityColor(rec.priority)}>
                                  {rec.priority} priority
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">{rec.reason}</p>
                              
                              {rec.contactInfo && (
                                <div className="space-y-2">
                                  <h5 className="text-sm font-medium text-card-foreground">Contact Information:</h5>
                                  <div className="flex flex-wrap gap-2">
                                    {rec.contactInfo.phone && (
                                      <Button asChild size="sm" variant="outline">
                                        <a href={`tel:${rec.contactInfo.phone}`} className="flex items-center">
                                          <Phone className="w-3 h-3 mr-1" />
                                          {rec.contactInfo.phone}
                                        </a>
                                      </Button>
                                    )}
                                    {rec.contactInfo.email && (
                                      <Button asChild size="sm" variant="outline">
                                        <a href={`mailto:${rec.contactInfo.email}`} className="flex items-center">
                                          <Mail className="w-3 h-3 mr-1" />
                                          Email
                                        </a>
                                      </Button>
                                    )}
                                    {rec.contactInfo.website && (
                                      <Button asChild size="sm" variant="outline">
                                        <a href={rec.contactInfo.website} target="_blank" rel="noopener noreferrer" className="flex items-center">
                                          <ExternalLink className="w-3 h-3 mr-1" />
                                          Website
                                        </a>
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Next Steps */}
                        {message.recommendation.nextSteps && message.recommendation.nextSteps.length > 0 && (
                          <div>
                            <h4 className="font-medium text-card-foreground mb-2">Recommended Next Steps:</h4>
                            <ul className="space-y-1">
                              {message.recommendation.nextSteps.map((step: string, index: number) => (
                                <li key={index} className="text-sm text-muted-foreground flex items-start">
                                  <span className="mr-2">•</span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="text-xs opacity-70 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted text-muted-foreground rounded-lg p-4 flex items-center">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    AI is thinking...
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <div className="border-t border-border p-4">
            <div className="flex space-x-2">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about safehouses, food warehouses, medical facilities, or humanitarian organizations..."
                className="flex-1 min-h-[60px] resize-none"
                disabled={isLoading}
              />
              <Button 
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim()}
                size="lg"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            
            <div className="mt-2 text-xs text-muted-foreground">
              Press Enter to send, Shift+Enter for new line
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Action Buttons */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Button
          variant="outline"
          onClick={() => setInputMessage("I need to find a safehouse near me")}
          className="h-auto p-4 text-left"
        >
          <div>
            <div className="font-medium">Find Safehouses</div>
            <div className="text-sm text-muted-foreground">Look for shelter and safe places</div>
          </div>
        </Button>
        
        <Button
          variant="outline"
          onClick={() => setInputMessage("Where can I find food and water?")}
          className="h-auto p-4 text-left"
        >
          <div>
            <div className="font-medium">Food Resources</div>
            <div className="text-sm text-muted-foreground">Find food warehouses and distribution</div>
          </div>
        </Button>
        
        <Button
          variant="outline"
          onClick={() => setInputMessage("I need medical assistance urgently")}
          className="h-auto p-4 text-left"
        >
          <div>
            <div className="font-medium">Medical Help</div>
            <div className="text-sm text-muted-foreground">Find medical facilities and aid</div>
          </div>
        </Button>
      </div>
    </main>
  );
}
