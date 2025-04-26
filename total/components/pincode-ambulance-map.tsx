"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Ambulance, Filter, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface EmergencyResourceData {
  Pincode: string
  District: string
  State: string
  Population_Density: number
  Fire_Brigade_Vehicles: number
  Ambulances: number
  NDRF_Personnel: number
  Special_Requirement: string
}

export default function PincodeAmbulanceMap() {
  const [resourceData, setResourceData] = useState<EmergencyResourceData[]>([])
  const [filteredData, setFilteredData] = useState<EmergencyResourceData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedState, setSelectedState] = useState<string | undefined>(undefined)
  const [searchPincode, setSearchPincode] = useState("")
  const [states, setStates] = useState<string[]>([])
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/data.csv")
        if (!response.ok) {
          throw new Error("Failed to fetch emergency resource data")
        }

        const csvText = await response.text()
        const parsedData = parseCSV(csvText)

        // Extract unique states for filter
        const uniqueStates = Array.from(new Set(parsedData.map((item) => item.State))).sort()
        setStates(uniqueStates)

        setResourceData(parsedData)

        // Apply default filter - only show data for a specific state initially
        // This prevents all data from being shown at once
        if (uniqueStates.length > 0) {
          const defaultState = uniqueStates[0]
          setSelectedState(defaultState)
          setFilteredData(parsedData.filter((item) => item.State === defaultState))
        } else {
          setFilteredData([])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred")
        console.error("Error loading emergency resource data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const parseCSV = (csvText: string): EmergencyResourceData[] => {
    const lines = csvText.split("\n")
    const headers = lines[0].split(",")

    return lines
      .slice(1)
      .filter((line) => line.trim() !== "")
      .map((line) => {
        const values = line.split(",")
        const entry: any = {}

        headers.forEach((header, index) => {
          const value = values[index]?.trim()
          if (
            header === "Population_Density" ||
            header === "Fire_Brigade_Vehicles" ||
            header === "Ambulances" ||
            header === "NDRF_Personnel"
          ) {
            entry[header] = Number.parseInt(value, 10) || 0
          } else {
            entry[header] = value
          }
        })

        return entry as EmergencyResourceData
      })
  }

  useEffect(() => {
    if (typeof window !== "undefined" && mapRef.current && !mapInstanceRef.current) {
      const initMap = async () => {
        try {
          const L = await import("leaflet")
          await import("leaflet/dist/leaflet.css")

          // Create map instance centered on India
          const map = L.map(mapRef.current).setView([22.5937, 78.9629], 5)
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          }).addTo(map)

          mapInstanceRef.current = map

          // Add markers if we have data
          if (filteredData.length > 0) {
            addMarkersToMap(filteredData)
          }
        } catch (error) {
          console.error("Error initializing map:", error)
        }
      }

      initMap()
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.off()
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [mapRef.current])

  // Update markers when filteredData changes
  useEffect(() => {
    if (mapInstanceRef.current && filteredData.length > 0) {
      addMarkersToMap(filteredData)
    }
  }, [filteredData])

  const addMarkersToMap = async (dataToMap: EmergencyResourceData[]) => {
    try {
      if (!mapInstanceRef.current) return

      const L = await import("leaflet")

      // Clear existing markers
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []

      // Create a mapping of states to their approximate center coordinates
      const stateCoordinates: Record<string, [number, number]> = {
        "Andhra Pradesh": [15.9129, 79.74],
        "Arunachal Pradesh": [28.218, 94.7278],
        Assam: [26.2006, 92.9376],
        Bihar: [25.0961, 85.3131],
        Chhattisgarh: [21.2787, 81.8661],
        Goa: [15.2993, 74.124],
        Gujarat: [22.2587, 71.1924],
        Haryana: [29.0588, 76.0856],
        "Himachal Pradesh": [31.1048, 77.1734],
        Jharkhand: [23.6102, 85.2799],
        Karnataka: [15.3173, 75.7139],
        Kerala: [10.8505, 76.2711],
        "Madhya Pradesh": [22.9734, 78.6569],
        Maharashtra: [19.7515, 75.7139],
        Manipur: [24.6637, 93.9063],
        Meghalaya: [25.467, 91.3662],
        Mizoram: [23.1645, 92.9376],
        Nagaland: [26.1584, 94.5624],
        Odisha: [20.9517, 85.0985],
        Punjab: [31.1471, 75.3412],
        Rajasthan: [27.0238, 74.2179],
        Sikkim: [27.533, 88.5122],
        "Tamil Nadu": [11.1271, 78.6569],
        Telangana: [18.1124, 79.0193],
        Tripura: [23.9408, 91.9882],
        "Uttar Pradesh": [26.8467, 80.9462],
        Uttarakhand: [30.0668, 79.0193],
        "West Bengal": [22.9868, 87.855],
        Delhi: [28.7041, 77.1025],
        // Add more states as needed
      }

      // Group data by district to avoid overlapping markers
      const districtGroups: Record<string, EmergencyResourceData[]> = {}

      dataToMap.forEach((item) => {
        const key = `${item.State}-${item.District}`
        if (!districtGroups[key]) {
          districtGroups[key] = []
        }
        districtGroups[key].push(item)
      })

      // Process each district group
      Object.entries(districtGroups).forEach(([key, items]) => {
        const [stateName, districtName] = key.split("-")

        // Get base coordinates for the state
        const baseCoords = stateCoordinates[stateName] || [22.5937, 78.9629] // Default to center of India

        // Calculate total ambulances in this district
        const totalAmbulances = items.reduce((sum, item) => sum + item.Ambulances, 0)

        // Add a small random offset to avoid exact overlapping within a district
        // Use district name to create a consistent offset
        const districtSeed = districtName.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)
        const latOffset = ((districtSeed % 100) / 100) * 1.5 - 0.75
        const lngOffset = (((districtSeed * 31) % 100) / 100) * 1.5 - 0.75

        const lat = baseCoords[0] + latOffset
        const lng = baseCoords[1] + lngOffset

        // Determine marker size based on number of ambulances
        const size = 10 + Math.min(totalAmbulances * 2, 30)
        const color = getAmbulanceColor(totalAmbulances)

        // Create custom icon
        const customIcon = L.divIcon({
          className: "custom-div-icon",
          html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white;">${totalAmbulances}</div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        })

        // Create popup content with all pincodes in this district
        const popupContent = `
          <strong>District: ${districtName}</strong><br>
          <strong>State:</strong> ${stateName}<br>
          <strong>Total Ambulances:</strong> ${totalAmbulances}<br>
          <strong>Pincodes:</strong><br>
          ${items
            .map(
              (item) => `
            <div style="margin-top: 5px; padding-top: 5px; border-top: 1px solid #eee;">
              <strong>${item.Pincode}</strong> - ${item.Ambulances} ambulances<br>
              Population: ${item.Population_Density.toLocaleString()}<br>
              Fire Brigade: ${item.Fire_Brigade_Vehicles}<br>
              NDRF: ${item.NDRF_Personnel}
            </div>
          `,
            )
            .join("")}
        `

        const marker = L.marker([lat, lng], {
          icon: customIcon,
        })
          .addTo(mapInstanceRef.current)
          .bindPopup(popupContent)

        markersRef.current.push(marker)
      })

      // Adjust map view to show all markers
      if (markersRef.current.length > 0) {
        const group = L.featureGroup(markersRef.current)
        mapInstanceRef.current.fitBounds(group.getBounds(), { padding: [50, 50] })
      }
    } catch (error) {
      console.error("Error adding markers to map:", error)
      return []
    }
  }

  const getAmbulanceColor = (count: number): string => {
    if (count <= 0) return "#6b7280" // gray
    if (count <= 2) return "#ef4444" // red
    if (count <= 5) return "#f97316" // orange
    return "#22c55e" // green
  }

  const filterData = () => {
    let filtered = [...resourceData]

    if (selectedState) {
      filtered = filtered.filter((item) => item.State === selectedState)
    }

    if (searchPincode) {
      filtered = filtered.filter((item) => item.Pincode.includes(searchPincode))
    }

    setFilteredData(filtered)
  }

  useEffect(() => {
    filterData()
  }, [selectedState, searchPincode, resourceData])

  const clearFilters = () => {
    setSelectedState(undefined)
    setSearchPincode("")
    setFilteredData(resourceData)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <div className="text-center">
          <p>Loading emergency resource data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <div className="text-center text-red-500">
          <p>Error loading emergency resource data:</p>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Map */}
      <div className="lg:col-span-2">
        <Card className="h-full">
          <CardHeader className="pb-2">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle>Ambulance Resources by Pincode</CardTitle>
                <CardDescription>
                  {filteredData.length} locations displayed
                  {selectedState && ` in ${selectedState}`}
                  {searchPincode && ` matching pincode "${searchPincode}"`}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by pincode"
                    className="pl-8 h-9 w-[180px]"
                    value={searchPincode}
                    onChange={(e) => setSearchPincode(e.target.value)}
                  />
                </div>

                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder="Filter by state" />
                  </SelectTrigger>
                  <SelectContent className="z-[9999]">
                    {states.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
                  <Filter className="h-4 w-4 mr-1" /> Clear filters
                </Button>
              </div>
            </div>
            <div className="flex gap-4 mt-2">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-xs">0-2 Ambulances</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-xs">3-5 Ambulances</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-xs">6+ Ambulances</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div ref={mapRef} className="h-[500px] w-full rounded-md border" />
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Resource List */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Emergency Resources</CardTitle>
            <CardDescription>{filteredData.length} locations with ambulance resources</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="ambulances">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="ambulances" className="flex items-center gap-1">
                  <Ambulance className="h-4 w-4" /> Ambulances
                </TabsTrigger>
                <TabsTrigger value="fire" className="flex items-center gap-1">
                  <Flame className="h-4 w-4" /> Fire Brigade
                </TabsTrigger>
                <TabsTrigger value="ndrf" className="flex items-center gap-1">
                  <Users className="h-4 w-4" /> NDRF
                </TabsTrigger>
              </TabsList>

              <TabsContent value="ambulances">
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {filteredData.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No resources found matching your criteria</p>
                  ) : (
                    filteredData.map((item, index) => {
                      const color = getAmbulanceColor(item.Ambulances)

                      return (
                        <div
                          key={`${item.Pincode}-${index}`}
                          className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                          style={{ borderLeft: `4px solid ${color}` }}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">Pincode: {item.Pincode}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {item.District}
                                </Badge>
                                <span className="text-xs text-muted-foreground">{item.State}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold" style={{ color }}>
                                {item.Ambulances}
                              </div>
                              <div className="text-xs text-muted-foreground">Ambulances</div>
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Population:</span>{" "}
                              {item.Population_Density.toLocaleString()}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Fire Vehicles:</span> {item.Fire_Brigade_Vehicles}
                            </div>
                            <div>
                              <span className="text-muted-foreground">NDRF Personnel:</span> {item.NDRF_Personnel}
                            </div>
                          </div>

                          {item.Special_Requirement && (
                            <div className="mt-2 text-sm">
                              <span className="text-muted-foreground">Special Requirement:</span>{" "}
                              {item.Special_Requirement}
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </TabsContent>

              <TabsContent value="fire">
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {filteredData.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No resources found matching your criteria</p>
                  ) : (
                    filteredData.map((item, index) => {
                      const color =
                        item.Fire_Brigade_Vehicles <= 0
                          ? "#6b7280"
                          : item.Fire_Brigade_Vehicles <= 2
                            ? "#ef4444"
                            : item.Fire_Brigade_Vehicles <= 5
                              ? "#f97316"
                              : "#22c55e"

                      return (
                        <div
                          key={`${item.Pincode}-${index}`}
                          className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                          style={{ borderLeft: `4px solid ${color}` }}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">Pincode: {item.Pincode}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {item.District}
                                </Badge>
                                <span className="text-xs text-muted-foreground">{item.State}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold" style={{ color }}>
                                {item.Fire_Brigade_Vehicles}
                              </div>
                              <div className="text-xs text-muted-foreground">Fire Vehicles</div>
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Population:</span>{" "}
                              {item.Population_Density.toLocaleString()}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Ambulances:</span> {item.Ambulances}
                            </div>
                            <div>
                              <span className="text-muted-foreground">NDRF Personnel:</span> {item.NDRF_Personnel}
                            </div>
                          </div>

                          {item.Special_Requirement && (
                            <div className="mt-2 text-sm">
                              <span className="text-muted-foreground">Special Requirement:</span>{" "}
                              {item.Special_Requirement}
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </TabsContent>

              <TabsContent value="ndrf">
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {filteredData.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No resources found matching your criteria</p>
                  ) : (
                    filteredData.map((item, index) => {
                      const color =
                        item.NDRF_Personnel <= 0
                          ? "#6b7280"
                          : item.NDRF_Personnel <= 10
                            ? "#ef4444"
                            : item.NDRF_Personnel <= 30
                              ? "#f97316"
                              : "#22c55e"

                      return (
                        <div
                          key={`${item.Pincode}-${index}`}
                          className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                          style={{ borderLeft: `4px solid ${color}` }}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">Pincode: {item.Pincode}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {item.District}
                                </Badge>
                                <span className="text-xs text-muted-foreground">{item.State}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold" style={{ color }}>
                                {item.NDRF_Personnel}
                              </div>
                              <div className="text-xs text-muted-foreground">NDRF Personnel</div>
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Population:</span>{" "}
                              {item.Population_Density.toLocaleString()}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Ambulances:</span> {item.Ambulances}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Fire Vehicles:</span> {item.Fire_Brigade_Vehicles}
                            </div>
                          </div>

                          {item.Special_Requirement && (
                            <div className="mt-2 text-sm">
                              <span className="text-muted-foreground">Special Requirement:</span>{" "}
                              {item.Special_Requirement}
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Missing Flame and Users icons
const Flame = (props: any) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
)

const Users = (props: any) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)
