
export const TopBar = () => {
    return (
        <div className="flex justify-between items-center px-6 py-4 bg-white text-sm text-gray-700">
          <span>9:41</span>
          <div className="flex items-center space-x-1">
            {/* Wifi, Signal, Battery icons - simplified for demonstration */}
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 2.293A1 1 0 0117 2h-4a1 1 0 01-1-1V0a1 1 0 012 0v.586l3.293 3.293a1 1 0 010 1.414zM10 12a2 2 0 100-4 2 2 0 000 4z"/></svg>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM10 16a6 6 0 100-12 6 6 0 000 12z"/></svg>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M13 10V3a1 1 0 00-1-1H8a1 1 0 00-1 1v7H4a1 1 0 00-1 1v6a1 1 0 001 1h12a1 1 0 001-1v-6a1 1 0 00-1-1h-3z"/></svg>
          </div>
        </div>
    )
}