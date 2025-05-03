"use client";

import { Suspense } from "react";
import GeoLocationMap from "@/components/geo-location-map";
import PincodeAmbulanceMap from "@/components/pincode-ambulance-map";
import { MapSkeleton } from "@/components/map-skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Ambulance, BrainCircuit } from 'lucide-react';
import { OurModels } from "@/components/our-models";

export default function Home() {
  const handleEmergencyClick = () => {
    window.open('https://hosting-b1ze.onrender.com/', '_blank', 'noopener,noreferrer');
  };

  return (
    <main className="min-h-screen flex flex-col">
      <header className="bg-orange-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Sahayta</h1>
            <p className="text-orange-100">Monitor healthcare, natural events, and catastrophes across India</p>
          </div>
          <button
            onClick={handleEmergencyClick}
            className="mt-4 md:mt-0 bg-white text-orange-600 font-semibold py-2 px-4 rounded hover:bg-orange-100 transition"
          >
            Emergency response
          </button>
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
            <TabsTrigger value="models" className="flex items-center gap-1">
              <BrainCircuit className="h-4 w-4" /> Our Models
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

          <TabsContent value="models">
            <OurModels />
          </TabsContent>
        </Tabs>
      </div>

      <footer className="bg-gray-100 border-t p-4">
        <div className="container mx-auto text-center text-gray-600 text-sm">
          &copy; {new Date().getFullYear()} India Incident Tracker
        </div>
      </footer>
    </main>
  );
}