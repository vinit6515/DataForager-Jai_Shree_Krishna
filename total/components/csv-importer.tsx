"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, FileUp, Download } from "lucide-react"

interface CSVImporterProps {
  onImport: (data: any[]) => void
}

export function CSVImporter({ onImport }: CSVImporterProps) {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<any[] | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
      parseCSV(selectedFile)
    }
  }

  const parseCSV = (file: File) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const lines = text.split("\n")
        const headers = lines[0].split(",").map((header) => header.trim())

        const data = []

        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim() === "") continue

          const values = lines[i].split(",").map((value) => value.trim())
          const entry: Record<string, any> = {}

          headers.forEach((header, index) => {
            entry[header] = values[index]
          })

          // Convert numeric fields
          if (entry.latitude) entry.latitude = Number.parseFloat(entry.latitude)
          if (entry.longitude) entry.longitude = Number.parseFloat(entry.longitude)
          if (entry.radius_km) entry.radius_km = Number.parseFloat(entry.radius_km)

          // Ensure id exists
          if (!entry.id) {
            entry.id = `imported-${Date.now()}-${i}`
          }

          data.push(entry)
        }

        setPreview(data.slice(0, 3)) // Show first 3 entries as preview
        setError(null)
      } catch (err) {
        setError("Failed to parse CSV file. Please check the format.")
        setPreview(null)
      }
    }

    reader.onerror = () => {
      setError("Failed to read the file.")
      setPreview(null)
    }

    reader.readAsText(file)
  }

  const handleImport = () => {
    if (!file) return

    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const lines = text.split("\n")
        const headers = lines[0].split(",").map((header) => header.trim())

        const data = []

        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim() === "") continue

          const values = lines[i].split(",").map((value) => value.trim())
          const entry: Record<string, any> = {}

          headers.forEach((header, index) => {
            entry[header] = values[index]
          })

          // Convert numeric fields
          if (entry.latitude) entry.latitude = Number.parseFloat(entry.latitude)
          if (entry.longitude) entry.longitude = Number.parseFloat(entry.longitude)
          if (entry.radius_km) entry.radius_km = Number.parseFloat(entry.radius_km)

          // Ensure id exists
          if (!entry.id) {
            entry.id = `imported-${Date.now()}-${i}`
          }

          data.push(entry)
        }

        onImport(data)
        setFile(null)
        setPreview(null)
      } catch (err) {
        setError("Failed to import CSV data. Please check the format.")
      }
    }

    reader.onerror = () => {
      setError("Failed to read the file.")
    }

    reader.readAsText(file)
  }

  const downloadSampleCSV = () => {
    const headers = "id,name,latitude,longitude,date,description,radius_km"
    const sampleData = [
      "2025-01-15-healthcare-15,Dengue Outbreak,22.5726,88.3639,2025-01-15T00:00:00.000Z,Dengue outbreak in urban areas,45",
      "2025-01-16-natural-16,Flash Flood,19.0760,72.8777,2025-01-16T00:00:00.000Z,Flash flood after heavy rainfall,60",
      "2025-01-17-catastrophe-17,Building Collapse,28.6139,77.2090,2025-01-17T00:00:00.000Z,Old building collapsed in city center,25",
    ]

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
    <Card>
      <CardHeader>
        <CardTitle>Import Incidents from CSV</CardTitle>
        <CardDescription>Upload a CSV file with incident data to import into the map</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="csv-file">CSV File</Label>
          <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} />
          <p className="text-xs text-muted-foreground mt-1">
            CSV should have headers: id, name, latitude, longitude, date, description, radius_km
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 w-full sm:w-auto flex items-center gap-2"
            onClick={downloadSampleCSV}
          >
            <Download className="h-4 w-4" />
            Download Sample CSV
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {preview && preview.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Preview (first 3 entries):</h4>
            <div className="text-xs border rounded-md p-2 bg-muted/50 overflow-auto max-h-32">
              <pre>{JSON.stringify(preview, null, 2)}</pre>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleImport} disabled={!file} className="w-full flex items-center gap-2">
          <FileUp className="h-4 w-4" />
          Import Data
        </Button>
      </CardFooter>
    </Card>
  )
}
