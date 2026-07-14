// ----------------------------------------------------------------
// NEW: SKELETON COMPONENTS
// ----------------------------------------------------------------
export const MovieCardSkeleton = () => (
  <div
    role="status"
    className="w-full flex-shrink-0 rounded-md overflow-hidden shadow-md animate-pulse"
  >
    <div className="bg-gray-800 rounded-md w-full aspect-[2/3]"></div>
    <div className="p-2">
      <div className="h-4 bg-gray-700 rounded w-3/4 mx-auto mb-2"></div>
      <div className="flex justify-between items-center pt-1">
        <div className="h-3 bg-gray-700 rounded w-1/4"></div>
        <div className="h-3 bg-gray-700 rounded w-1/4"></div>
      </div>
    </div>
  </div>
);

