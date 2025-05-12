import { useState } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { insertMotorcycleSchema } from '@shared/schema';
import { useWebSocket } from '@/hooks/use-websocket';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, Plus, Upload, X } from 'lucide-react';

// Condition options
const conditionOptions = [
  { value: 'Excellent', label: 'Excellent - Like new condition' },
  { value: 'Very Good', label: 'Very Good - Minor wear, fully functional' },
  { value: 'Good', label: 'Good - Normal wear for age/mileage' },
  { value: 'Fair', label: 'Fair - Usable, may need minor repairs' },
  { value: 'Poor', label: 'Poor - Needs significant repairs' },
];

// Color options
const colorOptions = [
  'Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 
  'Silver', 'Grey', 'Brown', 'Purple', 'Custom'
];

// Motorcycle makes
const motorcycleMakes = [
  'BMW', 'Ducati', 'Harley-Davidson', 'Honda', 'Kawasaki', 
  'KTM', 'Suzuki', 'Triumph', 'Yamaha', 'Other'
];

// Current year for year selection
const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 50 }, (_, i) => currentYear - i);

// Extend the motorcycle schema for form validation
const uploadSchema = insertMotorcycleSchema.extend({
  startingPrice: z.preprocess(
    (a) => parseInt(z.string().parse(a), 10),
    z.number().positive("Starting price must be positive").min(1, "Starting price is required")
  ),
  reservePrice: z.preprocess(
    (a) => a === '' ? undefined : parseInt(z.string().parse(a), 10),
    z.number().positive("Reserve price must be positive").optional()
  ),
  auctionDuration: z.enum(['15min', '30min', '1hr', '2hr', '4hr', '8hr', '12hr', '24hr'], {
    required_error: "Please select an auction duration",
  }),
  images: z.any().optional(),
  
  // Additional fields based on site plan
  serviceHistory: z.string().optional(),
  tyreCondition: z.string().optional(),
  accessories: z.string().optional(),
  driveType: z.enum(['Chain', 'Belt', 'Shaft']).optional(),
  damage: z.string().optional(),
  dateAvailable: z.preprocess(
    (a) => a ? new Date(z.string().parse(a)) : undefined,
    z.date().optional()
  ),
  regNumber: z.string().optional(),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

export default function BikeUploadForm() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const { sendMessage } = useWebSocket();
  
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Define auction duration options
  const durationOptions = [
    { value: '15min', label: '15 minutes' },
    { value: '30min', label: '30 minutes' },
    { value: '1hr', label: '1 hour' },
    { value: '2hr', label: '2 hours' },
    { value: '4hr', label: '4 hours' },
    { value: '8hr', label: '8 hours' },
    { value: '12hr', label: '12 hours' },
    { value: '24hr', label: '24 hours' },
  ];

  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      make: '',
      model: '',
      year: currentYear,
      color: 'Black',
      condition: 'Excellent',
      mileage: 0,
      engineSize: '',
      power: '',
      description: '',
      startingPrice: 0,
      reservePrice: undefined,
      auctionDuration: '1hr',
      images: []
    },
  });

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      
      // Limit to 5 images
      const newFiles = filesArray.slice(0, 5 - imageFiles.length);
      
      if (imageFiles.length + newFiles.length > 5) {
        toast({
          title: "Maximum 5 images allowed",
          description: "You can upload a maximum of 5 images per motorcycle.",
          variant: "destructive",
        });
      }
      
      setImageFiles(prev => [...prev, ...newFiles]);
      
      // Create URLs for preview
      const newUrls = newFiles.map(file => URL.createObjectURL(file));
      setImageUrls(prev => [...prev, ...newUrls]);
    }
  };

  // Remove an image from the selection
  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    
    // Also remove from preview and revoke the URL to prevent memory leaks
    URL.revokeObjectURL(imageUrls[index]);
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Handle image upload using local URLs for development
  const uploadImages = async (files: File[]): Promise<string[]> => {
    // In a production implementation, you would upload each file to cloud storage
    // For now, we'll use the existing object URLs that we created for the previews
    // This is just for development, as these URLs will not persist after the page reloads
    return imageUrls;
  };

  // Convert auction duration to milliseconds
  const getDurationMs = (duration: string): number => {
    const matches = duration.match(/^(\d+)(\w+)$/);
    if (!matches) return 60 * 60 * 1000; // Default 1 hour
    
    const [_, value, unit] = matches;
    const amount = parseInt(value, 10);
    
    switch (unit) {
      case 'min': return amount * 60 * 1000;
      case 'hr': return amount * 60 * 60 * 1000;
      default: return 60 * 60 * 1000;
    }
  };

  // Create motorcycle and auction mutation
  const createAuctionMutation = useMutation({
    mutationFn: async (data: UploadFormValues) => {
      setIsUploading(true);
      try {
        // First, mock upload the images
        const imageUrls = await uploadImages(imageFiles);
        
        // Create the motorcycle
        const motorcycleRes = await apiRequest("POST", "/api/motorcycles", {
          ...data,
          images: imageUrls,
          // Only include dealerId if not included in schema
        });
        const motorcycle = await motorcycleRes.json();
        
        // Calculate end time based on duration
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + getDurationMs(data.auctionDuration));
        
        // Create the auction
        const auctionRes = await apiRequest("POST", "/api/auctions", {
          motorcycleId: motorcycle.id,
          startingPrice: data.startingPrice,
          reservePrice: data.reservePrice,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        });
        
        return await auctionRes.json();
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: (auction) => {
      toast({
        title: "Auction created successfully",
        description: "Your motorcycle has been listed for auction.",
      });
      
      // Send WebSocket notification about new auction
      sendMessage({
        type: "auction_created",
        data: { auctionId: auction.id },
        timestamp: Date.now()
      });
      
      // Invalidate auctions query to update lists
      queryClient.invalidateQueries({ queryKey: ['/api/auctions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auctions/dealer'] });
      
      // Navigate to the auction detail page
      navigate(`/auctions/${auction.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create auction",
        description: error.message || "An error occurred while creating your auction.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: UploadFormValues) {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in as a dealer to create an auction.",
        variant: "destructive",
      });
      return;
    }
    
    if (imageFiles.length === 0) {
      toast({
        title: "Images required",
        description: "Please upload at least one image of the motorcycle.",
        variant: "destructive",
      });
      return;
    }
    
    createAuctionMutation.mutate(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Details Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="make"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Make</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a make" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {motorcycleMakes.map((make) => (
                        <SelectItem key={make} value={make}>{make}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <Input {...field} placeholder="e.g. Street Triple, Ninja 650" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value, 10))} 
                    defaultValue={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {yearOptions.map((year) => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                      min={0}
                      placeholder="e.g. 5000" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <Separator />
        
        {/* Specifications Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Specifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="engineSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Engine Size</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      value={field.value || ''}
                      placeholder="e.g. 675cc, 1200cc" 
                    />
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
                    <Input 
                      {...field} 
                      value={field.value || ''}
                      placeholder="e.g. 95 HP, 70 kW" 
                    />
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a color" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {colorOptions.map((color) => (
                        <SelectItem key={color} value={color}>{color}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
                      {conditionOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        {/* Description Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Detailed Description</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    value={field.value || ''}
                    placeholder="Provide a detailed description of the motorcycle, including any modifications, special features, service history, etc."
                    rows={5}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Images Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Images</h2>
          
          <div className="mb-4">
            <Label htmlFor="images">Upload Images (max 5)</Label>
            <div className="mt-2 flex items-center">
              <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                <Upload className="h-4 w-4 mr-2" />
                Add Images
                <input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="sr-only"
                  disabled={imageFiles.length >= 5}
                />
              </label>
              <span className="ml-2 text-sm text-gray-500">
                {imageFiles.length} of 5 images selected
              </span>
            </div>
          </div>
          
          {imageUrls.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="h-32 w-full object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <Separator />
        
        {/* Auction Details Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Auction Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startingPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Starting Price (£)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="e.g. 3500" 
                    />
                  </FormControl>
                  <FormDescription>Minimum bid to start the auction</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="reservePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reserve Price (£) - Optional</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      value={field.value === undefined ? '' : field.value}
                      onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.value)}
                      placeholder="e.g. 4500" 
                    />
                  </FormControl>
                  <FormDescription>Minimum price you're willing to accept</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="mt-4">
            <FormField
              control={form.control}
              name="auctionDuration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Auction Duration</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-2 gap-4 sm:grid-cols-4"
                    >
                      {durationOptions.map((option) => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={option.value} id={option.value} />
                          <Label htmlFor={option.value}>{option.label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormDescription>
                    How long the auction will run for
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="flex justify-end">
          <Button 
            type="submit" 
            size="lg" 
            disabled={isUploading || createAuctionMutation.isPending}
            className="bg-primary hover:bg-primary-dark"
          >
            {(isUploading || createAuctionMutation.isPending) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Auction...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Auction
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}