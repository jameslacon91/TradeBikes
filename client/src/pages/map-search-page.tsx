import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Search, MapPin, Filter, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Auction } from "@shared/schema";

const brands = [
  "All Brands", "Honda", "Yamaha", "Kawasaki", "Suzuki", "Ducati", 
  "BMW", "Triumph", "Harley-Davidson", "KTM", "Aprilia"
];

const types = [
  "All Types", "Sport", "Cruiser", "Touring", "Adventure", "Naked", 
  "Custom", "Dirt", "Scooter", "Electric"
];

export default function MapSearchPage() {
  const { user } = useAuth();
  const [searchRadius, setSearchRadius] = useState<number>(50);
  const [postCode, setPostCode] = useState<string>("");
  const [selectedMake, setSelectedMake] = useState<string>("All Brands");
  const [selectedType, setSelectedType] = useState<string>("All Types");
  const [filterVisible, setFilterVisible] = useState<boolean>(false);
  const [motorcycles, setMotorcycles] = useState(mockMotorcycles);

  const handleSearch = () => {
    // In a real implementation, this would call an API with the filters
    console.log("Searching with filters:", { 
      searchRadius, 
      postCode,
      make: selectedMake, 
      type: selectedType 
    });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left sidebar with filters */}
          <div className={`w-full md:w-1/3 lg:w-1/4 ${filterVisible ? 'block' : 'hidden md:block'}`}>
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Filter Options</CardTitle>
                <CardDescription>
                  Find motorcycles based on your preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Location search */}
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Location</h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="postcode">Your Postcode</Label>
                      <div className="flex mt-1">
                        <Input
                          id="postcode"
                          placeholder="Enter your postcode"
                          value={postCode}
                          onChange={(e) => setPostCode(e.target.value)}
                          className="rounded-r-none"
                        />
                        <Button
                          type="button"
                          variant="default"
                          size="icon"
                          className="rounded-l-none"
                          onClick={handleSearch}
                        >
                          <MapPin className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Search Radius: {searchRadius} miles</Label>
                      </div>
                      <Slider
                        value={[searchRadius]}
                        min={5}
                        max={200}
                        step={5}
                        onValueChange={(value) => setSearchRadius(value[0])}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>5mi</span>
                        <span>200mi</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Brand selection */}
                <div className="space-y-2">
                  <Label htmlFor="make">Make</Label>
                  <Select value={selectedMake} onValueChange={setSelectedMake}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((brand) => (
                        <SelectItem key={brand} value={brand}>
                          {brand}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Type selection */}
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {types.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Advanced filters with checkboxes */}
                <div className="space-y-3">
                  <h3 className="text-md font-medium">Condition</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="condition-excellent" />
                      <label
                        htmlFor="condition-excellent"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Excellent
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="condition-good" />
                      <label
                        htmlFor="condition-good"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Good
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="condition-fair" />
                      <label
                        htmlFor="condition-fair"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Fair
                      </label>
                    </div>
                  </div>
                </div>

                <Button className="w-full" onClick={handleSearch}>
                  Apply Filters
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main content area with map and listings */}
          <div className="w-full md:w-2/3 lg:w-3/4 space-y-6">
            {/* Mobile filter toggle */}
            <div className="md:hidden">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setFilterVisible(!filterVisible)}
              >
                <Filter className="mr-2 h-4 w-4" />
                {filterVisible ? "Hide Filters" : "Show Filters"}
              </Button>
            </div>

            {/* Map view */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gray-200 h-[400px] w-full flex items-center justify-center">
                  {/* This would be replaced with an actual map component */}
                  <div className="text-center p-6">
                    <MapPin className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <h3 className="text-lg font-medium">Interactive Map</h3>
                    <p className="text-muted-foreground">
                      An interactive map showing motorcycle locations would be displayed here.
                      <br />
                      This would use a mapping service like Google Maps or Mapbox.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Search results */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Motorcycles Near You</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {motorcycles.map((motorcycle) => (
                  <Card key={motorcycle.id} className="overflow-hidden">
                    <div className="relative h-48 bg-gray-100">
                      <img
                        src={motorcycle.image}
                        alt={`${motorcycle.make} ${motorcycle.model}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm">
                        {motorcycle.distance} mi
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-lg truncate">
                          {motorcycle.make} {motorcycle.model}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          {motorcycle.year} • {motorcycle.dealer}
                        </p>
                        <p className="font-bold text-lg">£{motorcycle.price.toLocaleString()}</p>
                      </div>
                      <Button className="w-full mt-3" variant="outline" asChild>
                        <a href={`/auctions/${motorcycle.id}`}>View Details</a>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}