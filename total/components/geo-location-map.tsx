"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  MapPin,
  CalendarIcon,
  Plus,
  List,
  AlertTriangle,
  Droplets,
  HeartPulse,
  Filter,
  FileUp,
  Download,
  Flame,
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CSVImporter } from "@/components/csv-importer"

// Add this CSS for custom markers
const mapStyles = `
  .custom-div-icon {
    background: transparent;
    border: none;
  }
  .leaflet-marker-icon {
    filter: drop-shadow(0px 2px 2px rgba(0, 0, 0, 0.5));
  }
`

interface EmergencyCallData {
  date: string
  call_type: string
  call_count: number
  district: string
  latitude: number
  longitude: number
  response_time: number
  destruction_scale: number
  event_category: string
  event_name: string
  event_radius_km: number
  event_description: string
  anomaly_flag: boolean
}

function useEmergencyData() {
  const [data, setData] = useState<EmergencyCallData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/csvjson.json")
        if (!response.ok) {
          throw new Error("Failed to fetch emergency data")
        }
        const jsonData = await response.json()

        // Ensure proper data formatting
        const formattedData = jsonData.map((item: any) => ({
          ...item,
          call_count: Number(item.call_count),
          latitude: Number(item.latitude),
          longitude: Number(item.longitude),
          response_time: Number(item.response_time),
          destruction_scale: Number(item.destruction_scale),
          event_radius_km: Number(item.event_radius_km),
          anomaly_flag: item.anomaly_flag === "True" || item.anomaly_flag === true,
        }))

        setData(formattedData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred")
        console.error("Error loading emergency data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { data, loading, error }
}

const getEventColor = (category: string): string => {
  switch (category.toLowerCase()) {
    case "healthcare":
      return "#ef4444"
    case "natural":
      return "#3b82f6"
    case "disaster":
      return "#f97316"
    case "fire":
      return "#f59e0b"
    case "medical":
      return "#ef4444" // Added for call_type
    default:
      return "#6b7280"
  }
}

const getEventIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case "healthcare":
      return <HeartPulse className="h-4 w-4" />
    case "natural":
      return <Droplets className="h-4 w-4" />
    case "disaster":
      return <AlertTriangle className="h-4 w-4" />
    case "fire":
      return <Flame className="h-4 w-4" />
    case "medical":
      return <HeartPulse className="h-4 w-4" /> // Added for call_type
    default:
      return <MapPin className="h-4 w-4" />
  }
}

const exportToCSV = (calls: EmergencyCallData[]) => {
  const headers =
    "date,call_type,call_count,district,latitude,longitude,response_time,destruction_scale,event_category,event_name,event_radius_km,event_description,anomaly_flag"
  const rows = calls.map((call) => {
    return `${call.date},${call.call_type},${call.call_count},${call.district},${call.latitude},${call.longitude},${call.response_time},${call.destruction_scale},${call.event_category},${call.event_name},${call.event_radius_km},"${call.event_description.replace(/"/g, '""')}",${call.anomaly_flag}`
  })
  const csvContent = [headers, ...rows].join("\n")
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.setAttribute("download", "emergency_calls.csv")
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export default function GeoLocationMap() {
  const { data: fetchedData, loading, error } = useEmergencyData()
  const [calls, setCalls] = useState<EmergencyCallData[]>([])
  const [filteredCalls, setFilteredCalls] = useState<EmergencyCallData[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date(2025, 4, 21)) // April is month 3 (zero-indexed)
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined)
  const [newCall, setNewCall] = useState({
    call_type: "Medical",
    call_count: 0,
    district: "",
    latitude: "",
    longitude: "",
    response_time: 0,
    destruction_scale: 0,
    event_category: "Healthcare",
    event_name: "",
    event_radius_km: 50,
    event_description: "",
    anomaly_flag: false,
  })
  const [date, setDate] = useState<Date | undefined>(new Date())
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const circlesRef = useRef<any[]>([])

  // Add styles to document head
  useEffect(() => {
    const styleElement = document.createElement("style")
    styleElement.innerHTML = mapStyles
    document.head.appendChild(styleElement)

    return () => {
      document.head.removeChild(styleElement)
    }
  }, [])

  useEffect(() => {
    if (!loading && !error && fetchedData.length > 0) {
      setCalls(fetchedData)

      // Initially filter to show only April 27, 2023 data
      const initialDateString = "2023-4-27"
      const initialFiltered = fetchedData.filter((call) => {
        const callDate = format(new Date(call.date), "yyyy-MM-dd")
        return callDate === initialDateString
      })

      setFilteredCalls(initialFiltered)
    }
  }, [loading, error, fetchedData])

  useEffect(() => {
    if (typeof window !== "undefined" && mapRef.current && !mapInstanceRef.current) {
      const initMap = async () => {
        try {
          const L = await import("leaflet")
          await import("leaflet/dist/leaflet.css")

          // Create map instance
          const map = L.map(mapRef.current).setView([20.5937, 78.9629], 5)
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          }).addTo(map)

          mapInstanceRef.current = map

          // Only add markers if we have data
          if (calls.length > 0) {
            addMarkersToMap(calls)
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
  }, [mapRef.current]) // Only depend on mapRef.current, not calls

  // Update markers when filteredCalls changes
  useEffect(() => {
    if (mapInstanceRef.current && filteredCalls.length > 0) {
      addMarkersToMap(filteredCalls)
    }
  }, [filteredCalls])

  const addMarkersToMap = async (callsToMap: EmergencyCallData[]) => {
    try {
      if (!mapInstanceRef.current) return

      const L = await import("leaflet")

      // Clear existing markers and circles
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []

      circlesRef.current.forEach((circle) => circle.remove())
      circlesRef.current = []

      // Add new markers
      callsToMap.forEach((call) => {
        const color = getEventColor(call.event_category)

        // Create custom icon based on call type
        const customIcon = L.divIcon({
          className: "custom-div-icon",
          html: `<div style="background-color: ${getEventColor(call.call_type)}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        })

        const marker = L.marker([call.latitude, call.longitude], {
          icon: customIcon,
        })
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <strong>${call.event_name}</strong><br>
            <span style="color: ${color};">${call.event_category.toUpperCase()}</span><br>
            <strong>District:</strong> ${call.district}<br>
            <strong>Date:</strong> ${format(new Date(call.date), "PPP")}<br>
            <strong>Calls:</strong> ${call.call_count}<br>
            <strong>Response Time:</strong> ${call.response_time} mins<br>
            <strong>Radius:</strong> ${call.event_radius_km} km<br>
            ${call.event_description}<br>
            ${call.anomaly_flag ? '<span style="color: red;">ANOMALY DETECTED</span>' : ""}
          `)

        markersRef.current.push(marker)

        // Add circle to represent event radius
        const circle = L.circle([call.latitude, call.longitude], {
          color,
          fillColor: color,
          fillOpacity: 0.2,
          radius: call.event_radius_km * 1000,
        }).addTo(mapInstanceRef.current)

        circlesRef.current.push(circle)
      })
    } catch (error) {
      console.error("Error adding markers to map:", error)
    }
  }

  const filterCalls = () => {
    let filtered = [...calls]

    if (selectedDate) {
      const dateString = format(selectedDate, "yyyy-MM-dd")
      filtered = filtered.filter((call) => {
        const callDate = format(new Date(call.date), "yyyy-MM-dd")
        return callDate === dateString
      })
    }

    if (selectedCategory) {
      filtered = filtered.filter((call) => call.event_category.toLowerCase() === selectedCategory.toLowerCase())
    }

    setFilteredCalls(filtered)

    // Update markers if map is initialized
    if (mapInstanceRef.current) {
      addMarkersToMap(filtered)
    }
  }

  useEffect(() => {
    filterCalls()
  }, [selectedDate, selectedCategory, calls])

  const clearFilters = () => {
    setSelectedDate(undefined)
    setSelectedCategory(undefined)
    setFilteredCalls(calls)
  }

  const handleAddCall = (e: React.FormEvent) => {
    e.preventDefault()

    if (!newCall.event_name || !newCall.latitude || !newCall.longitude || !date) return

    const dateString = format(date, "yyyy-MM-dd")

    const newCallData: EmergencyCallData = {
      date: dateString,
      call_type: newCall.call_type,
      call_count: newCall.call_count,
      district: newCall.district,
      latitude: Number.parseFloat(newCall.latitude),
      longitude: Number.parseFloat(newCall.longitude),
      response_time: newCall.response_time,
      destruction_scale: newCall.destruction_scale,
      event_category: newCall.event_category,
      event_name: newCall.event_name,
      event_radius_km: Number.parseFloat(newCall.event_radius_km.toString()),
      event_description: newCall.event_description,
      anomaly_flag: newCall.anomaly_flag,
    }

    const updatedCalls = [...calls, newCallData]
    setCalls(updatedCalls)
    setFilteredCalls(updatedCalls)

    setNewCall({
      call_type: "Medical",
      call_count: 0,
      district: "",
      latitude: "",
      longitude: "",
      response_time: 0,
      destruction_scale: 0,
      event_category: "Healthcare",
      event_name: "",
      event_radius_km: 50,
      event_description: "",
      anomaly_flag: false,
    })
  }

  const downloadSampleCSV = () => {
    const headers =
      "date,call_type,call_count,district,latitude,longitude,response_time,destruction_scale,event_category,event_name,event_radius_km,event_description,anomaly_flag"
    const sampleData = [
      '2023-05-01,Medical,45,Kolkata,22.5726,88.3639,15.2,5.1,Healthcare,Heatstroke Wave,85,"Multiple cases of heatstroke reported in urban areas",false',
      '2023-05-02,Fire,18,Dehradun,30.3165,78.0322,22.7,8.3,Natural,Forest Fire,65,"Wildfire in forested mountain region",true',
      '2023-05-03,Disaster,53,Patna,25.5941,85.1376,28.9,6.7,Natural,Flood,120,"River flooding affecting multiple districts",false',
      '2023-05-04,Medical,37,Hyderabad,17.3850,78.4867,12.1,4.2,Healthcare,Respiratory Illness,55,"Increased respiratory cases due to pollution",false',
      '2023-05-05,Fire,22,Jaipur,26.9124,75.7873,18.5,7.8,Natural,Industrial Fire,25,"Chemical factory fire with toxic smoke",true',
    ]

    const csvContent = [headers, ...sampleData].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", "sample_emergency_calls.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p>Loading emergency data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center text-red-500">
          <p>Error loading emergency data:</p>
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
                <CardTitle>Emergency Call Map</CardTitle>
                <CardDescription>
                  {selectedDate ? `Showing calls for ${format(selectedDate, "PPP")}` : "Showing all emergency calls"}
                  {selectedCategory && ` of category: ${selectedCategory}`}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 gap-1">
                      <CalendarIcon className="h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Filter by date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[9999]" align="end">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                      fromDate={new Date(2023, 0, 1)}
                      toDate={new Date(2025, 11, 31)}
                    />
                    <div className="p-2 border-t">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedDate(undefined)} className="w-full">
                        Clear date
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>

                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent className="z-[9999]">
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Natural">Natural</SelectItem>
                    <SelectItem value="Disaster">Disaster</SelectItem>
                    <SelectItem value="Fire">Fire</SelectItem>
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
                <span className="text-xs">Healthcare</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-xs">Natural</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-xs">Disaster/Fire</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div ref={mapRef} className="h-[500px] w-full rounded-md border" />
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Tabs */}
      <div>
        <Tabs defaultValue="list">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="add" className="flex items-center gap-1">
              <Plus className="h-4 w-4" /> Add Call
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-1">
              <List className="h-4 w-4" /> Calls
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-1">
              <FileUp className="h-4 w-4" /> Import CSV
            </TabsTrigger>
          </TabsList>

          {/* Add Call Tab */}
          <TabsContent value="add">
            <Card>
              <CardHeader>
                <CardTitle>Add New Emergency Call</CardTitle>
                <CardDescription>Enter the details of a new emergency call</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddCall} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="event_name">Event Name</Label>
                    <Input
                      id="event_name"
                      placeholder="e.g. Heatwave in Varanasi"
                      value={newCall.event_name}
                      onChange={(e) => setNewCall({ ...newCall, event_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="district">District</Label>
                      <Input
                        id="district"
                        placeholder="e.g. Varanasi"
                        value={newCall.district}
                        onChange={(e) => setNewCall({ ...newCall, district: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="call_count">Call Count</Label>
                      <Input
                        id="call_count"
                        type="number"
                        min="0"
                        placeholder="e.g. 50"
                        value={newCall.call_count}
                        onChange={(e) => setNewCall({ ...newCall, call_count: Number(e.target.value) })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="latitude">Latitude</Label>
                      <Input
                        id="latitude"
                        type="number"
                        step="any"
                        placeholder="e.g. 25.2219"
                        value={newCall.latitude}
                        onChange={(e) => setNewCall({ ...newCall, latitude: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="longitude">Longitude</Label>
                      <Input
                        id="longitude"
                        type="number"
                        step="any"
                        placeholder="e.g. 83.1014"
                        value={newCall.longitude}
                        onChange={(e) => setNewCall({ ...newCall, longitude: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="call_type">Call Type</Label>
                      <Select
                        value={newCall.call_type}
                        onValueChange={(value) => setNewCall({ ...newCall, call_type: value })}
                      >
                        <SelectTrigger id="call_type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent className="z-[9999]">
                          <SelectItem value="Medical">Medical</SelectItem>
                          <SelectItem value="Fire">Fire</SelectItem>
                          <SelectItem value="Disaster">Disaster</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="event_category">Event Category</Label>
                      <Select
                        value={newCall.event_category}
                        onValueChange={(value) => setNewCall({ ...newCall, event_category: value })}
                      >
                        <SelectTrigger id="event_category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="z-[9999]">
                          <SelectItem value="Healthcare">Healthcare</SelectItem>
                          <SelectItem value="Natural">Natural</SelectItem>
                          <SelectItem value="Disaster">Disaster</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="response_time">Response Time (mins)</Label>
                      <Input
                        id="response_time"
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder="e.g. 15.2"
                        value={newCall.response_time}
                        onChange={(e) => setNewCall({ ...newCall, response_time: Number(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="destruction_scale">Destruction Scale (1-10)</Label>
                      <Input
                        id="destruction_scale"
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        placeholder="e.g. 5.5"
                        value={newCall.destruction_scale}
                        onChange={(e) => setNewCall({ ...newCall, destruction_scale: Number(e.target.value) })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="event_radius_km">Event Radius (km)</Label>
                      <Input
                        id="event_radius_km"
                        type="number"
                        min="1"
                        max="500"
                        placeholder="e.g. 50"
                        value={newCall.event_radius_km}
                        onChange={(e) => setNewCall({ ...newCall, event_radius_km: Number(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="anomaly_flag">Anomaly Flag</Label>
                      <Select
                        value={newCall.anomaly_flag ? "true" : "false"}
                        onValueChange={(value) => setNewCall({ ...newCall, anomaly_flag: value === "true" })}
                      >
                        <SelectTrigger id="anomaly_flag">
                          <SelectValue placeholder="Is this an anomaly?" />
                        </SelectTrigger>
                        <SelectContent className="z-[9999]">
                          <SelectItem value="false">Normal</SelectItem>
                          <SelectItem value="true">Anomaly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="date"
                          variant={"outline"}
                          className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 z-[9999]">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          initialFocus
                          fromDate={new Date(2023, 0, 1)}
                          toDate={new Date(2025, 11, 31)}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="event_description">Event Description</Label>
                    <Input
                      id="event_description"
                      placeholder="Brief description of this emergency event"
                      value={newCall.event_description}
                      onChange={(e) => setNewCall({ ...newCall, event_description: e.target.value })}
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    <MapPin className="mr-2 h-4 w-4" />
                    Add Emergency Call
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Import CSV Tab */}
          <TabsContent value="import">
            <CSVImporter
              onImport={(importedData) => {
                const processedData = importedData.map((item) => ({
                  ...item,
                  call_count: Number(item.call_count),
                  latitude: Number(item.latitude),
                  longitude: Number(item.longitude),
                  response_time: Number(item.response_time),
                  destruction_scale: Number(item.destruction_scale),
                  event_radius_km: Number(item.event_radius_km),
                  anomaly_flag: item.anomaly_flag === "true" || item.anomaly_flag === true,
                  date: item.date && !item.date.includes("T") ? new Date(item.date).toISOString() : item.date,
                }))

                const updatedCalls = [...calls, ...processedData]
                setCalls(updatedCalls)
                setFilteredCalls(updatedCalls)
              }}
            />

            <div className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Sample CSV Files</CardTitle>
                  <CardDescription>Download sample CSV files to test the import functionality</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadSampleCSV}
                    className="w-full flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Sample CSV
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportToCSV(calls)}
                    className="w-full flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export Current Calls
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Call List Tab */}
          <TabsContent value="list">
            <Card>
              <CardHeader>
                <CardTitle>Emergency Call List</CardTitle>
                <div className="flex justify-between items-center mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportToCSV(calls)}
                    className="flex items-center gap-1"
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {calls.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No emergency calls recorded yet</p>
                  ) : (
                    filteredCalls.map((call, index) => {
                      const color = getEventColor(call.event_category)
                      const icon = getEventIcon(call.event_category)

                      return (
                        <div
                          key={`${call.date}-${call.district}-${call.event_name}-${index}`}
                          className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                          style={{ borderLeft: `4px solid ${color}` }}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{call.event_name}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge
                                  variant="outline"
                                  className="flex items-center gap-1 text-xs"
                                  style={{ color: color, borderColor: color }}
                                >
                                  {icon} {call.event_category}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(call.date), "PPP")}
                                </span>
                                {call.anomaly_flag && (
                                  <Badge variant="destructive" className="text-xs">
                                    ANOMALY
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-right">
                              <div>
                                {call.latitude.toFixed(4)}, {call.longitude.toFixed(4)}
                              </div>
                              <div className="mt-1">
                                <span className="font-medium">{call.call_count}</span> calls
                              </div>
                            </div>
                          </div>
                          <div className="mt-2 text-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-muted-foreground">District:</span> {call.district}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Response:</span> {call.response_time} mins
                              </div>
                              <div>
                                <span className="text-muted-foreground">Destruction:</span> {call.destruction_scale}/10
                              </div>
                              <div>
                                <span className="text-muted-foreground">Radius:</span> {call.event_radius_km} km
                              </div>
                            </div>
                            {call.event_description && (
                              <p className="mt-2">
                                <span className="text-muted-foreground">Details:</span> {call.event_description}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
