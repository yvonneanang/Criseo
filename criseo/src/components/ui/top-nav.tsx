import {ChevronLeft, Search} from 'lucide-react'

type TopNavProps = {
  title: string;
};

export default function TopNav({ title }: TopNavProps) {
    return (
        <div className="flex items-center justify-between p-6 pb-4 bg-white border-b border-gray-100">
          <div className="flex items-center text-purple-600 font-semibold">
            <ChevronLeft size={20} className="mr-1" />
            Back
          </div>
          <h1 className="text-xl font-bold text-gray-800">{title}</h1>
          <Search size={20} className="text-gray-600" />
        </div>

    )
    
}