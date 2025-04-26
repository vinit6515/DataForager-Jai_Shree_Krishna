import { Suspense } from "react"
import GeoLocationMap from "@/components/geo-location-map"
import { MapSkeleton } from "@/components/map-skeleton"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="bg-orange-600 text-white p-4 shadow-md">
        <div className="container mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold">India Incident Tracker</h1>
          <p className="text-orange-100">Monitor healthcare, natural events, and catastrophes across India</p>
        </div>
      </header>

      <div className="container mx-auto flex-1 p-4">
        <Suspense fallback={<MapSkeleton />}>
          <GeoLocationMap />
        </Suspense>
      </div>

      <footer className="bg-gray-100 border-t p-4">
        <div className="container mx-auto text-center text-gray-600 text-sm">
          &copy; {new Date().getFullYear()} India Incident Tracker
        </div>
      </footer>
    </main>
  )
}
