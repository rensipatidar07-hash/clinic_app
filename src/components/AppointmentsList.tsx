import React, { useState, useMemo } from 'react';
import { Calendar, Plus, Clock, Search, AlertCircle, Info, RefreshCw, CheckCircle } from 'lucide-react';
import { Patient, Appointment } from '../types';
import { formatDateTime } from '../utils';

interface AppointmentsListProps {
  patients: Patient[];
  appointments: Appointment[];
  onScheduleAppointment: (appData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt' | 'creatorId'>) => Promise<void>;
  onCheckIn: (appId: string) => void;
  onCancel: (appId: string) => void;
  onComplete: (appId: string) => void;
}

export default function AppointmentsList({
  patients,
  appointments,
  onScheduleAppointment,
  onCheckIn,
  onCancel,
  onComplete
}: AppointmentsListProps) {
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentNotes, setAppointmentNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search filter for appointments
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredAppointments = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const sorted = [...appointments].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    if (!q) return sorted;
    return sorted.filter(app => 
      app.patientName.toLowerCase().includes(q) || 
      app.patientPhone.includes(q) ||
      app.patientId.toLowerCase().includes(q)
    );
  }, [appointments, searchQuery]);

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !appointmentDate) {
      alert("Please select a patient and select appointment date/time.");
      return;
    }

    const patientObj = patients.find(p => p.id === selectedPatientId);
    if (!patientObj) {
      alert("Selected patient is invalid.");
      return;
    }

    try {
      setIsSubmitting(true);
      await onScheduleAppointment({
        patientId: selectedPatientId,
        patientName: `${patientObj.firstName} ${patientObj.surname}`,
        patientPhone: patientObj.phone,
        date: new Date(appointmentDate).toISOString(),
        status: 'scheduled',
        notes: appointmentNotes
      });

      setSelectedPatientId('');
      setAppointmentDate('');
      setAppointmentNotes('');
      setShowScheduleForm(false);
      alert("Appointment scheduled successfully.");
    } catch (err) {
      console.error(err);
      alert("Error scheduling appointment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" id="appointments-list-root">
      {/* Search and Action Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Appointment Scheduler</h2>
            <p className="text-xs text-slate-500 mt-1">Book consultations, check in arrivals, and manage the clinic queue.</p>
          </div>
          <button
            onClick={() => setShowScheduleForm(!showScheduleForm)}
            className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2 rounded-lg text-sm shadow-sm transition-colors self-start md:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>{showScheduleForm ? "Hide Form" : "Book Appointment"}</span>
          </button>
        </div>

        {/* Schedule Form Drawer/Panel */}
        {showScheduleForm && (
          <form onSubmit={handleScheduleSubmit} className="mt-4 border border-teal-100 dark:border-teal-900 bg-teal-50/10 dark:bg-teal-950/10 p-5 rounded-xl space-y-4">
            <h3 className="font-bold text-teal-800 dark:text-teal-400 text-sm flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Schedule New Consultation Booking</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Select Patient */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Select Patient *</label>
                <select
                  required
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:border-teal-500 focus:outline-none"
                >
                  <option value="">-- Choose Kid Profile --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.surname} ({p.id})</option>
                  ))}
                </select>
                {patients.length === 0 && (
                  <p className="text-[10px] text-amber-600 font-semibold mt-1">⚠️ Please register a patient first.</p>
                )}
              </div>

              {/* Date / Time */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>

              {/* Reason / Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Reason for Visit / Complaint</label>
                <input
                  type="text"
                  value={appointmentNotes}
                  onChange={(e) => setAppointmentNotes(e.target.value)}
                  placeholder="e.g. Vaccination booster, high fever"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:border-teal-500"
                />
              </div>

            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowScheduleForm(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || patients.length === 0}
                className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg text-xs shadow-sm transition-colors flex items-center space-x-1.5"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Booking...</span>
                  </>
                ) : (
                  <span>Book Slot</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Search filter input */}
        <div className="mt-4 relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter bookings by child name, ID, or phone..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {/* Scheduler Table / Queue Results */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
          <h3 className="font-bold text-slate-900 dark:text-slate-50 text-sm">Consultation Queue ({filteredAppointments.length} bookings)</h3>
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Clinic Ingress Workflow</p>
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="p-10 text-center text-slate-400 dark:text-slate-500">
            <Clock className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
            <p className="text-sm font-semibold">No appointments found.</p>
            <p className="text-xs mt-1">Book slot allocations or modify keyword filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/30 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-3">Slot Time</th>
                  <th className="px-6 py-3">Patient ID</th>
                  <th className="px-6 py-3">Child Name</th>
                  <th className="px-6 py-3">Phone</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Complaint / Notes</th>
                  <th className="px-6 py-3 text-right">Queue Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 text-sm">
                {filteredAppointments.map(app => (
                  <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-slate-50">
                      {formatDateTime(app.date)}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs font-bold text-teal-600 dark:text-teal-400">
                      {app.patientId}
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-slate-900 dark:text-slate-50">
                      {app.patientName}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs">
                      {app.patientPhone}
                    </td>
                    <td className="px-6 py-3.5 text-xs">
                      <span className={`px-2 py-1 rounded-full font-bold ${
                        app.status === 'scheduled' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                        app.status === 'checked-in' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                        app.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300' :
                        'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-500 italic max-w-xs truncate">
                      {app.notes || 'None logged'}
                    </td>
                    <td className="px-6 py-3.5 text-right space-x-2">
                      {app.status === 'scheduled' && (
                        <>
                          <button
                            onClick={() => onCheckIn(app.id)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-2.5 py-1 rounded text-xs font-bold transition-all"
                          >
                            Check In
                          </button>
                          <button
                            onClick={() => onCancel(app.id)}
                            className="bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 px-2.5 py-1 rounded text-xs font-bold transition-all"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {app.status === 'checked-in' && (
                        <button
                          onClick={() => onComplete(app.id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-2.5 py-1 rounded text-xs font-bold transition-all shadow-sm"
                        >
                          Mark Done
                        </button>
                      )}
                      {app.status === 'completed' && (
                        <span className="text-[11px] text-green-600 font-bold flex items-center justify-end space-x-1">
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>Served</span>
                        </span>
                      )}
                      {app.status === 'cancelled' && (
                        <span className="text-[11px] text-slate-400">Cancelled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
