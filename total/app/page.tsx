import { Suspense } from "react"
import GeoLocationMap from "@/components/geo-location-map"
import PincodeAmbulanceMap from "@/components/pincode-ambulance-map"
import { MapSkeleton } from "@/components/map-skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Ambulance } from 'lucide-react'

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
        <Tabs defaultValue="incidents" className="mb-6">
          <TabsList className="w-full max-w-md mx-auto">
            <TabsTrigger value="incidents" className="flex items-center gap-1">
              <MapPin className="h-4 w-4" /> Incidents
            </TabsTrigger>
            <TabsTrigger value="ambulances" className="flex items-center gap-1">
              <Ambulance className="h-4 w-4" /> Ambulance Reserves
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="incidents">
            <Suspense fallback={<MapSkeleton />}>
              <GeoLocationMap />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="ambulances">
            <Suspense fallback={<MapSkeleton />}>
              <PincodeAmbulanceMap />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>

      <footer className="bg-gray-100 border-t p-4">
        <div className="container mx-auto text-center text-gray-600 text-sm">
          &copy; {new Date().getFullYear()} India Incident Tracker
        </div>
      </footer>
    </main>
  )
}
