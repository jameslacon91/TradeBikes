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
  auctionDuration: z.enum(['1day', '1week', '2weeks', '1month'], {
    required_error: "Please select an auction duration",
  }),
  images: z.any().optional(),
  
  // Visibility options
  visibilityType: z.enum(['all', 'favorites', 'radius'], {
    required_error: "Please select a visibility option",
  }),
  visibilityRadius: z.preprocess(
    (val) => (val === '' ? null : Number(val)),
    z.number().nullable().optional(),
  ),
  
  // Additional fields based on site plan
  serviceHistory: z.string().optional(),
  tyreCondition: z.string().optional(),
  accessories: z.string().optional(),
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
    { value: '1day', label: '1 day' },
    { value: '1week', label: '1 week' },
    { value: '2weeks', label: '2 weeks' },
    { value: '1month', label: '1 month' },
  ];
  
  // Define visibility options
  const visibilityOptions = [
    { value: 'all', label: 'All Dealers', description: 'Show to all registered dealers' },
    { value: 'favorites', label: 'Favorite Dealers Only', description: 'Only show to dealers in your favorites list' },
    { value: 'radius', label: 'Dealers in Radius', description: 'Only show to dealers within a specific radius' },
  ];

  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      make: '',
      model: '',
      year: currentYear,
      color: 'Black',
      condition: 'Excellent',
      mileage: undefined, // Changed from 0 to undefined to fix mileage issue
      engineSize: '',
      description: '',
      auctionDuration: '1day',
      images: [],
      
      // Visibility options
      visibilityType: 'all',
      visibilityRadius: null,
      
      // Fields from the site plan
      regNumber: '',
      serviceHistory: '',
      tyreCondition: '',
      accessories: '',
      damage: '',
      dateAvailable: undefined
    },
  });

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      
      // Limit to 20 images
      const maxImages = 20;
      const newFiles = filesArray.slice(0, maxImages - imageFiles.length);
      
      if (imageFiles.length + newFiles.length > maxImages) {
        toast({
          title: `Maximum ${maxImages} images allowed`,
          description: `You can upload a maximum of ${maxImages} images per motorcycle.`,
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
    const DAY_IN_MS = 24 * 60 * 60 * 1000;
    const WEEK_IN_MS = 7 * DAY_IN_MS;
    const MONTH_IN_MS = 30 * DAY_IN_MS;
    
    switch (duration) {
      case '1day': return DAY_IN_MS;
      case '1week': return WEEK_IN_MS;
      case '2weeks': return 2 * WEEK_IN_MS;
      case '1month': return MONTH_IN_MS;
      default: return DAY_IN_MS; // Default 1 day
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
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          visibilityType: data.visibilityType,
          visibilityRadius: data.visibilityType === 'radius' ? data.visibilityRadius : null,
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
        
        {/* Registration Number */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Registration Information</h2>
          <FormField
            control={form.control}
            name="regNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Registration Number</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="e.g. AB12 CDE" 
                  />
                </FormControl>
                <FormDescription>Enter the vehicle registration number</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <Separator />
        
        {/* Additional Vehicle Details Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Condition</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="serviceHistory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service History</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select service history" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Full">Full Service History</SelectItem>
                      <SelectItem value="Partial">Partial Service History</SelectItem>
                      <SelectItem value="None">No Service History</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="tyreCondition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tyre Condition</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tyre condition" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="New">New (90-100%)</SelectItem>
                      <SelectItem value="Excellent">Excellent (70-90%)</SelectItem>
                      <SelectItem value="Good">Good (50-70%)</SelectItem>
                      <SelectItem value="Fair">Fair (30-50%)</SelectItem>
                      <SelectItem value="Poor">Poor (Less than 30%)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            

            
            <FormField
              control={form.control}
              name="dateAvailable"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date Available</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      {...field} 
                      value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                      onChange={(e) => {
                        const date = e.target.value ? new Date(e.target.value) : undefined;
                        field.onChange(date);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <Separator />
        
        {/* Accessories & Damage */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Accessories & Damage</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="accessories"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Accessories</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      value={field.value || ''}
                      placeholder="List any accessories included with the bike (e.g., panniers, heated grips, aftermarket exhaust)"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="damage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Damage</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      value={field.value || ''}
                      placeholder="Describe any damage or defects (e.g., scratches, dents, mechanical issues)"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <Separator />
        
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
                    placeholder="Provide a detailed description of the motorcycle, including any modifications, special features, etc."
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
            <Label htmlFor="images">Upload Images (max 20)</Label>
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
          <div className="mt-4 space-y-6">
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
            
            {/* Visibility Options */}
            <div>
              <h3 className="text-md font-semibold text-gray-800 mb-2">Listing Visibility</h3>
              <FormField
                control={form.control}
                name="visibilityType"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="space-y-3"
                      >
                        {visibilityOptions.map((option) => (
                          <div key={option.value} className="flex items-start space-x-2 p-2 rounded-md border border-transparent hover:border-gray-200 hover:bg-gray-50">
                            <RadioGroupItem value={option.value} id={`visibility-${option.value}`} className="mt-1" />
                            <div>
                              <Label htmlFor={`visibility-${option.value}`} className="font-medium">{option.label}</Label>
                              <p className="text-sm text-gray-500">{option.description}</p>
                            </div>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Radius input - only show when radius option is selected */}
              {form.watch('visibilityType') === 'radius' && (
                <FormField
                  control={form.control}
                  name="visibilityRadius"
                  render={({ field }) => (
                    <FormItem className="mt-4 ml-6">
                      <FormLabel>Radius (miles)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => {
                            const value = e.target.value === '' ? null : parseInt(e.target.value, 10);
                            field.onChange(value);
                          }}
                          min={1}
                          max={500}
                          placeholder="e.g. 50" 
                          className="w-32"
                          value={field.value === null ? '' : field.value}
                        />
                      </FormControl>
                      <FormDescription>
                        Only dealers within this distance will see your listing
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
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