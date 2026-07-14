// src/app/watch/[type]/[id]/[slug]/page.jsx

import DedicatedPlayerScreen from "@/components/DedicatedPlayerScreen"; 

export default async function WatchPage({ params }) {
  const resolvedParams = await params;
  const { type, id, slug } = resolvedParams;

  return (
    <main className="min-h-screen bg-black w-full overflow-hidden">
      <DedicatedPlayerScreen 
        id={id} 
        type={type} 
        slug={slug} 
      />
    </main>
  );
}


