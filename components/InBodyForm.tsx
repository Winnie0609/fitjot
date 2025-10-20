'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import {
  CalendarIcon,
  ChevronDown,
  File,
  Loader2,
  Sparkles,
  Upload,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { type Resolver, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useAuth } from '@/lib/AuthContext';
import { addInBodyData, updateInBodyData } from '@/lib/db';
import { InBodyDataDocument } from '@/lib/types';
import { cn, deepClean } from '@/lib/utils';

interface InBodyFormProps {
  onSaved: (record: InBodyDataDocument & { id: string }) => void;
  onClose: () => void;
  initialData?: (InBodyDataDocument & { id: string }) | null;
}

// Zod schema (all fields optional; nested objects partial)
const inBodyFormSchema = z
  .object({
    reportDate: z.date().optional(),
    reportTime: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)')
      .optional(),
    overallScore: z
      .union([
        z.coerce.number().min(0, 'Score cannot be negative'),
        z.undefined(),
      ])
      .optional(),

    // Basic Body Composition
    bodyComposition: z
      .object({
        totalWeight: z
          .object({
            value: z.coerce
              .number()
              .min(0, 'Weight cannot be negative')
              .optional(),
          })
          .optional(),
        skeletalMuscleMass: z
          .object({ value: z.coerce.number().min(0).optional() })
          .optional(),
        bodyFatMass: z
          .object({ value: z.coerce.number().min(0).optional() })
          .optional(),
        bmi: z
          .object({ value: z.coerce.number().min(0).optional() })
          .optional(),
        pbf: z
          .object({
            value: z.coerce
              .number()
              .min(0, 'PBF cannot be negative')
              .optional(),
          })
          .optional(),
      })
      .partial()
      .optional(),

    // Advanced Fields (partial nested)
    bodyCompositionAnalysis: z
      .object({
        totalBodyWater: z
          .object({ value: z.coerce.number().optional() })
          .optional(),
        protein: z.object({ value: z.coerce.number().optional() }).optional(),
        mineral: z.object({ value: z.coerce.number().optional() }).optional(),
      })
      .partial()
      .optional(),

    segmentalLeanAnalysis: z
      .object({
        rightArm: z
          .object({
            weight: z.coerce.number().optional(),
            percentage: z.coerce.number().optional(),
          })
          .optional(),
        leftArm: z
          .object({
            weight: z.coerce.number().optional(),
            percentage: z.coerce.number().optional(),
          })
          .optional(),
        trunk: z
          .object({
            weight: z.coerce.number().optional(),
            percentage: z.coerce.number().optional(),
          })
          .optional(),
        rightLeg: z
          .object({
            weight: z.coerce.number().optional(),
            percentage: z.coerce.number().optional(),
          })
          .optional(),
        leftLeg: z
          .object({
            weight: z.coerce.number().optional(),
            percentage: z.coerce.number().optional(),
          })
          .optional(),
      })
      .partial()
      .optional(),

    segmentalFatAnalysis: z
      .object({
        rightArm: z
          .object({
            weight: z.coerce.number().optional(),
            percentage: z.coerce.number().optional(),
          })
          .optional(),
        leftArm: z
          .object({
            weight: z.coerce.number().optional(),
            percentage: z.coerce.number().optional(),
          })
          .optional(),
        trunk: z
          .object({
            weight: z.coerce.number().optional(),
            percentage: z.coerce.number().optional(),
          })
          .optional(),
        rightLeg: z
          .object({
            weight: z.coerce.number().optional(),
            percentage: z.coerce.number().optional(),
          })
          .optional(),
        leftLeg: z
          .object({
            weight: z.coerce.number().optional(),
            percentage: z.coerce.number().optional(),
          })
          .optional(),
      })
      .partial()
      .optional(),
  })
  .refine(
    (data) => {
      const w = data.bodyComposition?.totalWeight?.value;
      const p = data.bodyComposition?.pbf?.value;
      return w != null || p != null;
    },
    {
      message: 'Either Weight or PBF is required.',
      path: ['bodyComposition'],
    }
  );

type InBodyFormValues = z.infer<typeof inBodyFormSchema>;

export function InBodyForm({ onSaved, onClose, initialData }: InBodyFormProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { user } = useAuth();

  const form = useForm<InBodyFormValues>({
    resolver: zodResolver(inBodyFormSchema) as Resolver<InBodyFormValues>,
    defaultValues: {
      reportDate: new Date(),
      reportTime: format(new Date(), 'HH:mm'),
      overallScore: undefined,
      bodyComposition: {
        totalWeight: { value: undefined },
        skeletalMuscleMass: { value: undefined },
        bodyFatMass: { value: undefined },
        bmi: { value: undefined },
        pbf: { value: undefined },
      },
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [form, initialData]);

  const onSubmit = async (formData: InBodyFormValues) => {
    if (!user) {
      toast.error('You must be logged in to save a record.');
      return;
    }

    const cleaned = deepClean(formData);

    try {
      if (initialData?.id) {
        // Update existing record
        await updateInBodyData({
          recordId: initialData.id,
          uid: user.uid,
          inBodyData: cleaned,
        });
        onSaved(
          deepClean({
            ...formData,
            id: initialData.id,
          }) as InBodyDataDocument & {
            id: string;
          }
        );
        toast.success(
          `InBody record for ${format(
            formData.reportDate || new Date(),
            'P'
          )} has been updated.`
        );
      } else {
        // Create new record
        const docRef = await addInBodyData({
          uid: user.uid,
          inBodyData: cleaned as InBodyDataDocument,
        });
        onSaved(
          deepClean({ ...formData, id: docRef.id }) as InBodyDataDocument & {
            id: string;
          }
        );
        toast.success(
          `InBody record for ${format(
            formData.reportDate || new Date(),
            'P'
          )} has been saved.`
        );
      }
      onClose();
    } catch (error) {
      console.error('Failed to save InBody record:', error);
      toast.error('Failed to save record. Please try again.');
    }
  };

  const { isSubmitting } = form.formState;

  // const startAnalysis = () => {
  //   setIsAnalyzing(true);
  //   setAnalysisProgress(0);
  //   toast.message('Starting analysis...');
  //   const timer = setInterval(() => {
  //     setAnalysisProgress((p) => {
  //       const next = Math.min(100, p + Math.floor(10 + Math.random() * 15));
  //       if (next >= 100) {
  //         clearInterval(timer);
  //         setTimeout(() => {
  //           setIsAnalyzing(false);
  //           toast.success(
  //             'Analysis completed! Please check the auto-filled data.'
  //           );
  //         }, 400);
  //       }
  //       return next;
  //     });
  //   }, 400);
  // };

  // const handleSelectedFile = (file: File) => {
  //   setUploadedFileName(file.name);
  //   setIsImageUploading(true);
  //   // Simulate upload success
  //   setTimeout(() => {
  //     setIsImageUploading(false);
  //     startAnalysis();
  //   }, 800);
  // };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    toast.info('Image upload function is coming soon!');
    // const file = event.target.files?.[0];
    // if (file) {
    //   console.log('Image uploaded:', file);
    //   handleSelectedFile(file);
    // }
  };

  return (
    <>
      {/* Quick Log: top card for fast entry */}
      <Card className="w-full max-w-4xl mx-auto mb-6">
        <CardHeader>
          <CardTitle>Quick Log</CardTitle>
          <CardDescription>Update weight or PBF score quickly.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <div className="flex gap-4 ">
                  {/* Weight */}
                  <FormField
                    control={form.control}
                    name="bodyComposition.totalWeight.value"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Weight (kg)</FormLabel>
                        <FormControl>
                          <Input type="number" step={0.1} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* PBF */}
                  <FormField
                    control={form.control}
                    name="bodyComposition.pbf.value"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>PBF (%)</FormLabel>
                        <FormControl>
                          <Input type="number" step={0.1} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {/* Cross-field validation message for Weight or PBF requirement */}
                {form.formState.errors.bodyComposition?.message && (
                  <p className="text-sm text-destructive">
                    {String(form.formState.errors.bodyComposition.message)}
                  </p>
                )}
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Quick Log'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>New InBody Record</CardTitle>
          <CardDescription>
            Fill in your InBody data manually or upload a photo to auto-fill.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              'bg-muted/40 p-6 rounded-lg mb-8 border border-dashed transition-colors cursor-pointer py-10',
              isDragging ? 'border-primary bg-muted' : 'border-border'
            )}
            onClick={() => {
              toast.info('Image upload function is coming soon!');
              // fileInputRef.current?.click()
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              toast.info('Image upload function is coming soon!');
              // const file = e.dataTransfer.files?.[0];
              // if (file) handleSelectedFile(file);
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Upload className="h-7 w-7 mr-2 mb-2" />
              </div>
              <h3 className="text-lg font-semibold mb-2 flex items-center justify-center">
                <Sparkles className="h-5 w-5 mr-2" /> Auto-fill with a Photo
              </h3>
              {!uploadedFileName && !isAnalyzing && !isImageUploading && (
                <>
                  <p className="text-sm text-muted-foreground">
                    Click or drag InBody report image here to upload.
                  </p>
                  <Button variant="outline" className="mt-4">
                    Choose File
                  </Button>
                </>
              )}

              {uploadedFileName && (
                <p className="text-sm mt-2">
                  <File className="h-5 w-5 mr-2" />
                  File: {uploadedFileName}
                </p>
              )}
              {isImageUploading && (
                <div className="mt-3 inline-flex items-center text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...
                </div>
              )}
              {isAnalyzing && (
                <div className="mt-4 space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Analyzing image, please wait...
                  </div>
                  <div className="h-2 w-full bg-muted-foreground/20 rounded overflow-hidden">
                    <div
                      className="h-full bg-primary transition-[width] duration-300"
                      style={{ width: `${analysisProgress}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {analysisProgress}%
                  </div>
                </div>
              )}
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Date and Time Section */}
              <div className="flex flex-wrap gap-4">
                <FormField
                  control={form.control}
                  name="reportDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date & Time</FormLabel>
                      <div className="flex gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={'outline'}
                                className={cn(
                                  'w-[150px] justify-start text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? (
                                  format(field.value, 'dd MMM yyyy')
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormField
                          control={form.control}
                          name="reportTime"
                          render={({ field: timeField }) => (
                            <FormControl>
                              <Input
                                type="time"
                                className="w-[145px]"
                                {...timeField}
                              />
                            </FormControl>
                          )}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="overallScore"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>InBody Score</FormLabel>
                      <FormControl>
                        <Input type="number" className="w-[120px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Body Composition Section */}
              <div className="space-y-4">
                <FormLabel>Body Composition</FormLabel>
                <div className="flex flex-wrap gap-4">
                  <FormField
                    control={form.control}
                    name="bodyComposition.skeletalMuscleMass.value"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-xs text-muted-foreground">
                          SMM (kg)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            className="w-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bodyComposition.bodyFatMass.value"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-xs text-muted-foreground">
                          Body Fat (kg)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            className="w-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bodyComposition.bmi.value"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-xs text-muted-foreground">
                          BMI
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            className="w-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Collapsible
                open={isAdvancedOpen}
                onOpenChange={setIsAdvancedOpen}
                className="mt-8"
              >
                <CollapsibleTrigger asChild>
                  <Button variant="link" className="p-0">
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 mr-2 transition-transform',
                        isAdvancedOpen && 'rotate-180'
                      )}
                    />
                    {isAdvancedOpen ? 'Hide' : 'Show'} Advanced Metrics
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-6 space-y-8">
                  {/* Body Composition Analysis */}
                  <div className="space-y-4">
                    <FormLabel>Body Composition Analysis</FormLabel>
                    <div className="flex flex-wrap gap-4">
                      <FormField
                        control={form.control}
                        name="bodyCompositionAnalysis.totalBodyWater.value"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="text-xs text-muted-foreground">
                              Total Body Water (L)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                className="w-[140px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="bodyCompositionAnalysis.protein.value"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="text-xs text-muted-foreground">
                              Protein (kg)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                className="w-[120px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="bodyCompositionAnalysis.mineral.value"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="text-xs text-muted-foreground">
                              Mineral (kg)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                className="w-[120px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Segmental Lean Analysis */}
                  <div className="space-y-4">
                    <FormLabel>Segmental Lean Analysis (kg)</FormLabel>
                    <div className="flex flex-wrap gap-4">
                      <FormField
                        control={form.control}
                        name="segmentalLeanAnalysis.rightArm.weight"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="text-xs text-muted-foreground">
                              Right Arm
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                className="w-[100px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="segmentalLeanAnalysis.leftArm.weight"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="text-xs text-muted-foreground">
                              Left Arm
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                className="w-[100px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="segmentalLeanAnalysis.trunk.weight"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="text-xs text-muted-foreground">
                              Trunk
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                className="w-[100px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="segmentalLeanAnalysis.rightLeg.weight"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="text-xs text-muted-foreground">
                              Right Leg
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                className="w-[100px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="segmentalLeanAnalysis.leftLeg.weight"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="text-xs text-muted-foreground">
                              Left Leg
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                className="w-[100px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Segmental Fat Analysis */}
                  <div className="space-y-4">
                    <FormLabel>Segmental Fat Analysis (kg)</FormLabel>
                    <div className="flex flex-wrap gap-4">
                      <FormField
                        control={form.control}
                        name="segmentalFatAnalysis.rightArm.weight"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="text-xs text-muted-foreground">
                              Right Arm
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                className="w-[100px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="segmentalFatAnalysis.leftArm.weight"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="text-xs text-muted-foreground">
                              Left Arm
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                className="w-[100px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="segmentalFatAnalysis.trunk.weight"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="text-xs text-muted-foreground">
                              Trunk
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                className="w-[100px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="segmentalFatAnalysis.rightLeg.weight"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="text-xs text-muted-foreground">
                              Right Leg
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                className="w-[100px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="segmentalFatAnalysis.leftLeg.weight"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="text-xs text-muted-foreground">
                              Left Leg
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                className="w-[100px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-6">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Record'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
