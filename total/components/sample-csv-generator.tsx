"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export function SampleCSVGenerator() {
  const generateSampleCSV = () => {
    // Create sample data
    const headers = "id,name,latitude,longitude,date,description,radius_km"
    const sampleData = [
      "2025-01-10-healthcare-10,Cholera Outbreak in Rural Area,19.0000,82.0000,2025-01-10T00:00:00.000Z,A cholera outbreak was reported in a remote tribal area of Odisha with health teams dispatched for containment,60",
      "2025-01-11-natural-11,Unseasonal Thunderstorms,15.5000,80.0000,2025-01-11T00:00:00.000Z,Unseasonal thunderstorms accompanied by lightning strikes damaged crops in coastal Andhra Pradesh,90",
      "2025-01-11-catastrophe-11,Chemical Spill in River,22.5000,88.5000,2025-01-11T00:00:00.000Z,Accidental chemical spill into a tributary of the Hooghly River raised pollution concerns in West Bengal,50",
      "2025-01-11-healthcare-11,Heatstroke Cases in Southern State,12.0000,79.0000,2025-01-11T00:00:00.000Z,Unusually high temperatures in Tamil Nadu led to multiple cases of heatstroke among outdoor workers,70",
      "2025-01-12-natural-12,Coastal Erosion Accelerates,8.0000,77.0000,2025-01-12T00:00:00.000Z,Rising sea levels caused accelerated coastal erosion in southern Tamil Nadu threatening villages,30",
    ]

    // Create and download CSV file
    const csvContent = [headers, ...sampleData].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", "sample_incidents.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Button variant="outline" size="sm" onClick={generateSampleCSV} className="flex items-center gap-2">
      <Download className="h-4 w-4" />
      Download Sample CSV
    </Button>
  )
}
