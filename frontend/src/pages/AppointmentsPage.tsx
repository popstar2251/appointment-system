import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import type { Appointment } from '../types/appointment';
import { getAppointments, updateStatus, deleteAppointment } from '../api/appointments';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AppointmentForm } from '@/components/AppointmentForm';

const statusVariant: Record<Appointment['status'], 'default' | 'secondary' | 'destructive'> = {
  confirmed: 'default',
  pending: 'secondary',
  cancelled: 'destructive',
};

export function AppointmentsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  // pendingDelete holds the appointment awaiting confirmation; null means dialog is closed
  const [pendingDelete, setPendingDelete] = useState<Appointment | null>(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    getAppointments()
      .then(setAppointments)
      .catch(() => toast.error('Failed to load appointments'))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (id: string, status: Appointment['status']) => {
    try {
      const updated = await updateStatus(id, status);
      setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAppointment(id);
      setAppointments((prev) => prev.filter((a) => a.id !== id));
      toast.success('Appointment deleted');
    } catch {
      toast.error('Failed to delete appointment');
    } finally {
      setPendingDelete(null);
    }
  };

  return (
    <div className="p-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/book" className="text-xs text-muted-foreground hover:underline">← Booking page</Link>
            <CardTitle>Appointments</CardTitle>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>Sign out</Button>
            <AppointmentForm onCreated={(a) => setAppointments((prev) => [a, ...prev])} />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            // Skeleton rows shown while the API call is in-flight
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-md" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.clientName}</TableCell>
                    <TableCell>{a.clientPhone}</TableCell>
                    <TableCell>{a.date}</TableCell>
                    <TableCell>{a.time}</TableCell>
                    <TableCell>{a.service}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[a.status]}>{a.status}</Badge>
                    </TableCell>
                    <TableCell className="flex gap-2">
                      {a.status !== 'confirmed' && (
                        <Button size="sm" onClick={() => handleStatusChange(a.id, 'confirmed')}>
                          Confirm
                        </Button>
                      )}
                      {a.status !== 'cancelled' && (
                        <Button size="sm" variant="destructive" onClick={() => handleStatusChange(a.id, 'cancelled')}>
                          Cancel
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => setPendingDelete(a)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {appointments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No appointments yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/*
        Single confirmation dialog, controlled by pendingDelete state.
        Renders outside the table so only one dialog exists in the DOM at a time.
      */}
      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the appointment for{' '}
              <strong>{pendingDelete?.clientName}</strong> on {pendingDelete?.date} at{' '}
              {pendingDelete?.time}. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => pendingDelete && handleDelete(pendingDelete.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
