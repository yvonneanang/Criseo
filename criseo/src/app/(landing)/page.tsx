"use client"
import React from 'react';
import { Heart, Eye } from 'lucide-react';
import { BottomNav } from '@/components/ui/bottom-nav';
import Header from '@/components/ui/header'
import {TopBar } from '@/components/ui/top-bar'

// Define an interface for the content card data structure
interface ContentCard {
  id: number;
  image: string;
  title: string;
  likes: number;
  views: number;
  premium: boolean;
}

export default function LandingPage() {
  // Dummy data for the content cards, now explicitly typed
  const contentCards: ContentCard[] = [
    {
      id: 1,
      image: 'https://placehold.co/300x200/9370DB/ffffff?text=Find+Food',
      title: 'Find Food',
      likes: 192,
      views: 2938,
      premium: true,
    },
    {
      id: 2,
      image: 'https://placehold.co/300x200/6A0DAD/ffffff?text=Find+Shelter',
      title: 'Find Shelter',
      likes: 179,
      views: 2721,
      premium: true,
    },
    {
      id: 3,
      image: 'https://placehold.co/300x200/A020F0/ffffff?text=Escape+Routes',
      title: 'Escape Routes',
      likes: 396,
      views: 7500,
      premium: true,
    },
    {
      id: 4,
      image: 'https://placehold.co/300x200/8A2BE2/ffffff?text=First+Aid',
      title: 'First Aid',
      likes: 510,
      views: 6338,
      premium: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-300 to-purple-500 flex items-center justify-center p-4">
      {/* Phone frame container */}
      <div className="relative w-full max-w-sm h-[800px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top bar (mimicking phone status bar) */}
        <TopBar />
        {/* TopNav */}
        <Header title="Criseo"/>


        {/* Content Grid */}
        <div className="flex-grow p-6 pt-2 overflow-y-auto bg-gray-50">
          <div className="grid grid-cols-2 gap-4">
            {contentCards.map((card: ContentCard) => ( // Explicitly type 'card' in map
              <div key={card.id} className="card bg-white shadow-sm rounded-lg overflow-hidden">
                <figure className="relative">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-32 object-cover"
                    onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => { // Type the event
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = `https://placehold.co/300x200/9370DB/ffffff?text=Image+Error`;
                    }}
                  />
                  {card.premium && (
                    <div className="absolute top-2 right-2 bg-red-500 rounded-full p-1">
                      {/* Placeholder for the red icon */}
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 11a1 1 0 100-2 1 1 0 000 2zm4-1a1 1 0 100-2 1 1 0 000 2z"/></svg>
                    </div>
                  )}
                </figure>
                <div className="card-body p-3">
                  <h2 className="card-title text-sm font-semibold text-gray-800 mb-1">{card.title}</h2>
                  <div className="flex items-center text-xs text-gray-500">
                    <Heart size={14} className="mr-1 text-red-400" />
                    <span>{card.likes}</span>
                    <Eye size={14} className="ml-3 mr-1 text-blue-400" />
                    <span>{card.views}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Navigation */}
        <BottomNav/>
      </div>
    </div>
  );
};
