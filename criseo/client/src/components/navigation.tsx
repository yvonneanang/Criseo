import { Link, useLocation } from "wouter";
import { MapPin, Package, Bot, HandHeart, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/language-selector";
import { useLanguage } from "@/hooks/use-language";

export function Navigation() {
  const [location] = useLocation();
  const { t } = useLanguage();

  const navItems = [
    { path: "/", label: t("nav.home"), icon: MapPin },
    { path: "/inventory", label: t("nav.inventory"), icon: Package },
    { path: "/ai-assistant", label: t("nav.ai_assistant"), icon: Bot },
    { path: "/organizations", label: t("nav.organizations"), icon: HandHeart },
  ];

  return (
    <>
      {/* Header */}
      <header className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-primary">Criseo</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Language Selector */}
              <LanguageSelector />
              
              {/* Emergency Hotline */}
              <div className="hidden md:block">
                <Button asChild className="emergency-button">
                  <a href="tel:+1-800-CRISIS">
                    <Phone className="w-4 h-4 mr-2" />
                    {t("nav.emergency_call")}: 1-800-CRISIS
                  </a>
                </Button>
              </div>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button className="text-gray-600 hover:text-gray-900 p-2">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Emergency Button */}
        <div className="md:hidden bg-destructive">
          <div className="px-4 py-3">
            <a href="tel:+1-800-CRISIS" className="text-destructive-foreground font-medium flex items-center justify-center">
              <Phone className="w-4 h-4 mr-2" />
              {t("nav.emergency_call")}: 1-800-CRISIS
            </a>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 -mb-px">
            {navItems.map((item) => {
              const isActive = location === item.path;
              const Icon = item.icon;
              
              return (
                <Link key={item.path} href={item.path}>
                  <button
                    className={`border-b-2 py-4 px-1 text-sm font-medium whitespace-nowrap transition-colors ${
                      isActive
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2 inline" />
                    {item.label}
                  </button>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
