"use client"
import React from 'react';
import { ChevronLeft, Search, Heart, Eye, Home, DoorOpen, Bookmark, Utensils, Star, User } from 'lucide-react';

// Define an interface for the content card data structure
interface ContentCard {
  id: number;
  image: string;
  title: string;
  likes: number;
  views: number;
  premium: boolean;
}

const App: React.FC = () => {
  // Dummy data for the content cards, now explicitly typed
  const contentCards: ContentCard[] = [
    {
      id: 1,
      image: 'https://placehold.co/300x200/9370DB/ffffff?text=Golf+at+sunset',
      title: 'Find Food',
      likes: 192,
      views: 2938,
      premium: true,
    },
    {
      id: 2,
      image: 'https://placehold.co/300x200/6A0DAD/ffffff?text=Another+eye',
      title: 'Find Shelter',
      likes: 179,
      views: 2721,
      premium: true,
    },
    {
      id: 3,
      image: 'https://placehold.co/300x200/A020F0/ffffff?text=Falling+stars',
      title: 'Escape Routes',
      likes: 396,
      views: 7500,
      premium: true,
    },
    {
      id: 4,
      image: 'https://placehold.co/300x200/8A2BE2/ffffff?text=Morning+Routine',
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
        <div className="flex justify-between items-center px-6 py-4 bg-white text-sm text-gray-700">
          <span>9:41</span>
          <div className="flex items-center space-x-1">
            {/* Wifi, Signal, Battery icons - simplified for demonstration */}
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 2.293A1 1 0 0117 2h-4a1 1 0 01-1-1V0a1 1 0 012 0v.586l3.293 3.293a1 1 0 010 1.414zM10 12a2 2 0 100-4 2 2 0 000 4z"/></svg>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM10 16a6 6 0 100-12 6 6 0 000 12z"/></svg>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M13 10V3a1 1 0 00-1-1H8a1 1 0 00-1 1v7H4a1 1 0 00-1 1v6a1 1 0 001 1h12a1 1 0 001-1v-6a1 1 0 00-1-1h-3z"/></svg>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 bg-white border-b border-gray-100">
          <div className="flex items-center text-purple-600 font-semibold">
            <ChevronLeft size={20} className="mr-1" />
            Back
          </div>
          <h1 className="text-xl font-bold text-gray-800">Home</h1>
          <Search size={20} className="text-gray-600" />
        </div>


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
        <div className="btm-nav bg-white border-t border-gray-100 rounded-b-3xl">
          <button className="active text-purple-600">
            <Home size={24} />
            <span className="btm-nav-label">Home</span>
          </button>
          <button className="text-gray-500">
            <Utensils size={24} />
            <span className="btm-nav-label">Food</span>
          </button>
          <button className="text-gray-500">
            <DoorOpen size={24} />
            <span className="btm-nav-label">Shelter</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;