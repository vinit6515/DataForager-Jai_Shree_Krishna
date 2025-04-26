import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function MapSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card className="h-full">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>India Incident Map</CardTitle>
                <CardDescription>Loading incident data...</CardDescription>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-36" />
                <Skeleton className="h-9 w-36" />
              </div>
            </div>
            <div className="flex gap-4 mt-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[500px] w-full" />
          </CardContent>
        </Card>
      </div>

      <div>
        <Tabs defaultValue="list">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="add">Add Incident</TabsTrigger>
            <TabsTrigger value="list">Incidents</TabsTrigger>
            <TabsTrigger value="import">Import CSV</TabsTrigger>
          </TabsList>

          <TabsContent value="add">
            <Card>
              <CardHeader>
                <CardTitle>Add New Incident</CardTitle>
                <CardDescription>Enter the details of a new incident to add to the map</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="list">
            <Card>
              <CardHeader>
                <CardTitle>Incident List</CardTitle>
                <CardDescription>Loading incidents...</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="import">
            <Card>
              <CardHeader>
                <CardTitle>Import Incidents from CSV</CardTitle>
                <CardDescription>Upload a CSV file with incident data</CardDescription>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full mt-4" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
