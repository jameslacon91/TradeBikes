import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { StarFilledIcon, StarIcon } from "@radix-ui/react-icons";

// Define the schema for review form
const reviewSchema = z.object({
  rating: z.number().min(1, "Please select a rating").max(5),
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  comment: z.string().min(10, "Review must be at least 10 characters").max(500),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

interface DealerReviewFormProps {
  dealerId: number;
  auctionId: number;
  motorcycleId: number;
  dealerName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function DealerReviewForm({
  dealerId,
  auctionId,
  motorcycleId,
  dealerName,
  onSuccess,
  onCancel,
}: DealerReviewFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  
  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      title: "",
      comment: "",
    },
  });

  const handleSubmit = async (values: ReviewFormValues) => {
    setIsSubmitting(true);
    
    try {
      // In a real implementation, this would call an API to save the review
      console.log("Submitting review:", { 
        dealerId, 
        auctionId,
        motorcycleId,
        ...values 
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSuccess();
    } catch (error) {
      console.error("Error submitting review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const { watch, setValue } = form;
  const currentRating = watch("rating");

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Rate Your Experience</CardTitle>
        <CardDescription>
          Please share your experience with {dealerName}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-6">
            {/* Star Rating */}
            <div className="space-y-2">
              <FormLabel>Rating</FormLabel>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="text-2xl focus:outline-none transition-all duration-150"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setValue("rating", star)}
                  >
                    {star <= (hoverRating || currentRating) ? (
                      <StarFilledIcon className="h-8 w-8 text-amber-500" />
                    ) : (
                      <StarIcon className="h-8 w-8 text-gray-300" />
                    )}
                  </button>
                ))}
              </div>
              {form.formState.errors.rating && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.rating.message}
                </p>
              )}
            </div>
            
            {/* Review Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Review Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Summarize your experience" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Review Comment */}
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Review</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share details of your experience with this dealer..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Your review helps other traders make informed decisions
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}