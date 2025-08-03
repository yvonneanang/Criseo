import {Search} from 'lucide-react'

type HeaderProps = {
  title: string;
};

export default function Header({ title }: HeaderProps) {
    return (
        <div className="flex items-center justify-between p-6 pb-4 bg-white border-b border-gray-100">
        
          <h1 className="text-xl font-bold text-gray-800">{title}</h1>
          <Search size={20} className="text-gray-600" />
        </div>

    )
    
}