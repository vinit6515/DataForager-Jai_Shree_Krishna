"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export function NaturalDisastersCSV() {
  const downloadNaturalDisastersCSV = () => {
    const headers = "id,name,latitude,longitude,date,description,radius_km"
    const sampleData = [
      "2025-02-01-natural-01,Cyclone Nilam,13.0827,80.2707,2025-02-01T00:00:00.000Z,Severe cyclonic storm affecting Tamil Nadu coast with wind speeds of 100-110 kmph,120",
      "2025-02-05-natural-02,Himalayan Avalanche,30.3752,79.6315,2025-02-05T00:00:00.000Z,Major avalanche in Uttarakhand Himalayas blocking key roads to border areas,35",
      "2025-02-10-natural-03,Brahmaputra Flooding,26.1445,91.7362,2025-02-10T00:00:00.000Z,Severe flooding along Brahmaputra river affecting multiple districts in Assam,200",
      "2025-02-15-natural-04,Drought in Maharashtra,19.7515,75.7139,2025-02-15T00:00:00.000Z,Severe drought conditions in Marathwada region affecting crop production and water supply,180",
      "2025-02-20-natural-05,Landslide in Darjeeling,27.0410,88.2663,2025-02-20T00:00:00.000Z,Major landslide blocking National Highway and cutting off several villages,40",
      "2025-02-25-natural-06,Earthquake in Gujarat,23.0225,72.5714,2025-02-25T00:00:00.000Z,5.8 magnitude earthquake with epicenter near Ahmedabad causing structural damage,75",
      "2025-03-01-natural-07,Heatwave in Central India,23.2599,77.4126,2025-03-01T00:00:00.000Z,Severe heatwave conditions with temperatures exceeding 45°C in Madhya Pradesh,150",
      "2025-03-05-natural-08,Coastal Erosion in Kerala,9.9312,76.2673,2025-03-05T00:00:00.000Z,Accelerated coastal erosion threatening fishing villages along Kerala coast,60",
      "2025-03-10-natural-09,Dust Storm in Rajasthan,26.9124,75.7873,2025-03-10T00:00:00.000Z,Severe dust storm with wind speeds of 70-80 kmph causing low visibility and disruption,100",
      "2025-03-15-natural-10,Forest Fire in Uttarakhand,30.0668,79.0193,2025-03-15T00:00:00.000Z,Major forest fire in pine forests spreading rapidly due to dry conditions,90",
    ]

    const csvContent = [headers, ...sampleData].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", "natural_disasters.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={downloadNaturalDisastersCSV}
      className="w-full flex items-center gap-2"
    >
      <Download className="h-4 w-4" />
      Download Natural Disasters CSV
    </Button>
  )
}
