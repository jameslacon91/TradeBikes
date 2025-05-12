import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { insertMotorcycleSchema, insertAuctionSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Extend the schema with client-side validation
const motorcycleFormSchema = insertMotorcycleSchema.extend({
  images: z.array(z.string()).min(1, "At least one image is required"),
  auctionDuration: z.enum(["1", "3", "6", "12", "24"], {
    required_error: "Please select an auction duration",
  }),
  startingPrice: z.coerce.number().min(1, "Starting price is required"),
  reservePrice: z.coerce.number().optional(),
});

// Union type for the form data
type FormData = z.infer<typeof motorcycleFormSchema>;

export default function BikeUploadForm() {
  const { toast } = useToast();
  const [_, navigate] = useLocation();

  // Form definition
  const form = useForm<FormData>({
    resolver: zodResolver(motorcycleFormSchema),
    defaultValues: {
      make: "",
      model: "",
      year: 0,
      mileage: 0,
      color: "",
      condition: "",
      engineSize: "",
      power: "",
      description: "",
      images: [],
      auctionDuration: "24",
      startingPrice: 0,
      reservePrice: undefined,
    },
  });

  // Mutation for creating a motorcycle and auction
  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // First create the motorcycle
      const motorcycleResponse = await apiRequest("POST", "/api/motorcycles", {
        make: data.make,
        model: data.model,
        year: data.year,
        mileage: data.mileage,
        color: data.color,
        condition: data.condition,
        engineSize: data.engineSize,
        power: data.power,
        description: data.description,
        images: data.images,
      });
      
      const motorcycle = await motorcycleResponse.json();
      
      // Calculate end time based on duration
      const endTime = new Date();
      endTime.setHours(endTime.getHours() + parseInt(data.auctionDuration));
      
      // Then create the auction
      const auctionResponse = await apiRequest("POST", "/api/auctions", {
        motorcycleId: motorcycle.id,
        startingPrice: data.startingPrice,
        reservePrice: data.reservePrice,
        endTime,
      });
      
      return await auctionResponse.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Bike listed successfully",
        description: "Your motorcycle has been listed for auction.",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/auctions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/motorcycles'] });
      
      // Navigate to the auction page
      navigate(`/auctions/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to list bike",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  function onSubmit(data: FormData) {
    createMutation.mutate(data);
  }

  // For the demo, we're using placeholder image URLs
  // In a real app, this would be an upload component
  function handleAddImage() {
    const currentImages = form.getValues("images");
    form.setValue("images", [...currentImages, `https://source.unsplash.com/random/800x600/?motorcycle&${Date.now()}`]);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="make"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Make</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Honda" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Model</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. CBR650R" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Year</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="mileage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mileage</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Color</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Matt Black" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="condition"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Condition</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Excellent">Excellent</SelectItem>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Fair">Fair</SelectItem>
                    <SelectItem value="Poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="engineSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Engine Size</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 649cc" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="power"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Power</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 94bhp" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Provide details about the motorcycle's history, features, and condition" 
                  className="h-32"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="images"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Images</FormLabel>
              <FormControl>
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    {field.value.map((image, index) => (
                      <div key={index} className="relative">
                        <img 
                          src={image} 
                          alt={`Motorcycle image ${index + 1}`} 
                          className="w-full h-32 object-cover rounded-md border border-gray-200" 
                        />
                        <button
                          type="button"
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                          onClick={() => form.setValue("images", field.value.filter((_, i) => i !== index))}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handleAddImage}
                  >
                    Add Image
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Auction Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="auctionDuration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Auction Duration</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">1 hour</SelectItem>
                      <SelectItem value="3">3 hours</SelectItem>
                      <SelectItem value="6">6 hours</SelectItem>
                      <SelectItem value="12">12 hours</SelectItem>
                      <SelectItem value="24">24 hours</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    How long the auction will run
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startingPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Starting Price (£)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                  </FormControl>
                  <FormDescription>
                    Minimum bid amount
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reservePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reserve Price (£) (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="No reserve" 
                      value={field.value || ''} 
                      onChange={e => {
                        const value = e.target.value ? parseInt(e.target.value) : undefined;
                        field.onChange(value);
                      }} 
                    />
                  </FormControl>
                  <FormDescription>
                    Minimum price you'll accept
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creating..." : "Create Auction"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
