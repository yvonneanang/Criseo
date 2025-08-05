import { Star } from "lucide-react";

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  showNumber?: boolean;
  reviewCount?: number;
}

export function RatingStars({ 
  rating, 
  maxRating = 5, 
  size = "md", 
  showNumber = false,
  reviewCount 
}: RatingStarsProps) {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  // Ensure rating is a number and handle null/undefined values
  const numericRating = rating != null && !isNaN(Number(rating)) ? Number(rating) : 0;

  return (
    <div className="flex items-center">
      <div className="flex text-yellow-400 mr-2">
        {Array.from({ length: maxRating }, (_, index) => {
          const filled = index < Math.floor(numericRating);
          return (
            <Star
              key={index}
              className={`${sizeClasses[size]} ${filled ? "fill-current" : ""}`}
            />
          );
        })}
      </div>
      {(showNumber || reviewCount) && (
        <span className={`${textSizeClasses[size]} text-muted-foreground`}>
          {showNumber && numericRating.toFixed(1)}
          {reviewCount && ` (${reviewCount} reviews)`}
        </span>
      )}
    </div>
  );
}
