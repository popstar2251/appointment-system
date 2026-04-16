import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { createAppointment } from '@/api/appointments';
import { SERVICES } from '@/lib/services';

const formSchema = z.object({
  clientName: z.string().min(2, 'Name must be at least 2 characters'),
  clientPhone: z.string().min(7, 'Invalid phone number'),
  clientEmail: z.string().email('Invalid email address'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:MM'),
  service: z.string().min(1, 'Service is required'),
}).refine(
  (data) => new Date(`${data.date}T${data.time}`) > new Date(),
  { message: 'Cannot book in the past', path: ['date'] }
);

type FormValues = z.infer<typeof formSchema>;

export function BookingPage() {
  // When submitted is true, we show the success card instead of the form.
  // This is conditional rendering: one boolean drives which UI branch renders.
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { clientName: '', clientPhone: '', clientEmail: '', date: '', time: '', service: '' },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await createAppointment(values);
      setSubmitted(true);
    } catch (e) {
      // Extract the server's error message if available (e.g. "That time slot is already booked")
      const serverMsg = (e as { response?: { data?: { error?: string } } }).response?.data?.error;
      toast.error(serverMsg ?? 'Failed to book appointment. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-muted/40 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Book an Appointment</CardTitle>
          </CardHeader>
          <CardContent>
            {submitted ? (
              // Success state — shown after form submission
              <div className="text-center space-y-4 py-4">
                <p className="text-2xl">✓</p>
                <p className="font-semibold text-lg">Appointment booked!</p>
                <p className="text-muted-foreground text-sm">
                  We'll send a confirmation to your email.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    form.reset();
                    setSubmitted(false);
                  }}
                >
                  Book another
                </Button>
              </div>
            ) : (
              // Form state — shown by default
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="clientName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full name</FormLabel>
                      <FormControl><Input placeholder="Maria Gomez" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="clientPhone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl><Input placeholder="+5491155667788" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="clientEmail" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input type="email" placeholder="maria@example.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="date" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="time" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time</FormLabel>
                        <FormControl><Input type="time" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="service" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a service" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SERVICES.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Booking...' : 'Book appointment'}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        {/* Link component from React Router — navigates without a full page reload */}
        <div className="text-right mt-3">
          <Link to="/admin" className="text-xs text-muted-foreground hover:underline">
            Admin →
          </Link>
        </div>
      </div>
    </div>
  );
}
