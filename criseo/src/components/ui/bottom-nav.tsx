
import { Home, DoorOpen, Utensils } from 'lucide-react';

export const BottomNav = () => {
    return (
        // Bottom Navigation
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
    )
}
