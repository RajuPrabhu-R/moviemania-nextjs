export const HeroBannerSkeleton = () => (
  <div className="h-[60vh] w-full animate-pulse duration-600">
    <div className="relative h-full bg-gray-800 overflow-hidden flex items-end">
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent pointer-events-none"></div>

      <div className="relative p-8 max-w-3xl z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-4 w-12 bg-gray-700 rounded-full"></div>
          <div className="h-4 w-12 bg-gray-700 rounded-full"></div>
          <div className="h-4 w-16 bg-gray-700 rounded-full"></div>
        </div>
        <div className="h-4 w-80 bg-gray-700 rounded mb-2"></div>
        <div className="h-4 w-11/12 bg-gray-700 rounded mb-2"></div>
        <div className="h-4 w-10/12 bg-gray-700 rounded mb-8"></div>
        <div className="flex justify-center items-center gap-4">
          <div className="h-10 w-32 bg-white rounded-full"></div>
          <div className="h-10 w-32 bg-gray-700 rounded-full"></div>
        </div>
      </div>
      <div className="absolute top-1/2 left-0 right-0 flex justify-between px-4 z-20">
        <div className="h-10 w-10 bg-gray-700 rounded-full"></div>
        <div className="h-10 w-10 bg-gray-700 rounded-full"></div>
      </div>
      <div className="absolute top-0 left-0 w-full flex">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="flex-1 h-1 bg-gray-700"></div>
        ))}
      </div>
    </div>
  </div>
);


