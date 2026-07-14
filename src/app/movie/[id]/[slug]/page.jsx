// src/app/movie/[id]/[slug]/page.jsx

// 1. Import your actual MovieDetails component
// (Make sure this path matches where your file actually is!)
import MovieDetails from "@/components/MovieDetails"; 

export default async function MovieDetailsPage({ params, searchParams }) {

  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  // 2. Catch the id and slug from the folder names
  const { id, slug } = resolvedParams;
  
  // 3. Catch the type from the URL (?type=tv)
  const { type } = resolvedSearchParams;

  return (
    <main className="min-h-screen bg-black w-full">
      <MovieDetails 
        id={id} 
        slug={slug} 
        type={type || "movie"} 
      />
      {/* <h1 className="text-white text-center">I M WORKING : {id}</h1> */}
    </main>
  );
}
