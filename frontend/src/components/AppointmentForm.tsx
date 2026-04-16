import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { createAppointment } from '@/api/appointments';
import type { Appointment } from '@/types/appointment';
import { SERVICES } from '@/lib/services';
import { useState } from 'react';

// Same validation rules as the backend — catches errors before they even reach the API
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

// z.infer extracts the TypeScript type from the schema — no need to define it separately
type FormValues = z.infer<typeof formSchema>;

interface Props {
  onCreated: (appointment: Appointment) => void;
}

export function AppointmentForm({ onCreated }: Props) {
  const [open, setOpen] = useState(false);

  // useForm wires up the form state, validation, and submission
  // zodResolver connects react-hook-form to our Zod schema
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { clientName: '', clientPhone: '', clientEmail: '', date: '', time: '', service: '' },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const appointment = await createAppointment(values);
      onCreated(appointment); // tells the parent to add it to the list
      toast.success('Appointment created');
      form.reset();
      setOpen(false);
    } catch (e) {
      const serverMsg = (e as { response?: { data?: { error?: string } } }).response?.data?.error;
      toast.error(serverMsg ?? 'Failed to create appointment. Please try again.');
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>New Appointment</Button>
      <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Appointment</DialogTitle>
        </DialogHeader>

        {/* Form component from Shadcn wraps react-hook-form's FormProvider */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {/* FormField connects each input to react-hook-form — handles value, onChange, errors */}
            <FormField control={form.control} name="clientName" render={({ field }) => (
              <FormItem>
                <FormLabel>Client name</FormLabel>
                <FormControl><Input placeholder="Maria Gomez" {...field} /></FormControl>
                <FormMessage /> {/* shows the Zod error for this field */}
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

            {/*
              Select needs special handling vs. a plain Input.
              Native inputs support ref, so {...field} works directly.
              Shadcn Select is a custom component — react-hook-form can't attach a ref,
              so we pass value and onChange manually via onValueChange and value props.
            */}
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
              {form.formState.isSubmitting ? 'Saving...' : 'Create appointment'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    </>
  );
}
