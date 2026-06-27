import React, { useState, useMemo } from 'react';
import { Send, Calendar, ShieldAlert, Sparkles, Sliders, Smartphone, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { Patient, Settings, Broadcast } from '../types';
import { formatDate, formatDateTime } from '../utils';

interface BroadcastCenterProps {
  patients: Patient[];
  settings: Settings;
  broadcasts: Broadcast[];
  onSaveSettings: (settingsData: Partial<Settings>) => Promise<void>;
  onSendBroadcast: (broadcastData: Omit<Broadcast, 'id' | 'createdAt' | 'senderId'>) => Promise<void>;
}

export default function BroadcastCenter({
  patients,
  settings,
  broadcasts,
  onSaveSettings,
  onSendBroadcast
}: BroadcastCenterProps) {
  // Config state
  const [smsWebhook, setSmsWebhook] = useState(settings.smsWebhook);
  const [appointmentTemplate, setAppointmentTemplate] = useState(settings.appointmentTemplate);
  const [vaccineDueTemplate, setVaccineDueTemplate] = useState(settings.vaccineDueTemplate);
  const [diwaliTemplate, setDiwaliTemplate] = useState(settings.diwaliTemplate);
  const [eidTemplate, setEidTemplate] = useState(settings.eidTemplate);
  const [newYearTemplate, setNewYearTemplate] = useState(settings.newYearTemplate);
  
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Broadcast campaign state
  const [broadcastTitle, setBroadcastTitle] = useState('Festival Well-Wishes Campaign');
  const [broadcastMessage, setBroadcastMessage] = useState(settings.diwaliTemplate || '');
  const [selectedPatientIds, setSelectedPatientIds] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  // Filter patients list for recipient selection
  const [recipientSearch, setRecipientSearch] = useState('');
  const filteredPatients = useMemo(() => {
    const s = recipientSearch.toLowerCase().trim();
    if (!s) return patients.slice(0, 20);
    return patients.filter(p => p.firstName.toLowerCase().includes(s) || p.surname.toLowerCase().includes(s) || p.phone.includes(s));
  }, [patients, recipientSearch]);

  const selectAll = () => {
    setSelectedPatientIds(patients.map(p => p.id));
  };

  const selectNone = () => {
    setSelectedPatientIds([]);
  };

  const togglePatientSelection = (id: string) => {
    if (selectedPatientIds.includes(id)) {
      setSelectedPatientIds(selectedPatientIds.filter(pid => pid !== id));
    } else {
      setSelectedPatientIds([...selectedPatientIds, id]);
    }
  };

  // Save Settings logic
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingSettings(true);
      await onSaveSettings({
        smsWebhook,
        appointmentTemplate,
        vaccineDueTemplate,
        diwaliTemplate,
        eidTemplate,
        newYearTemplate
      });
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 2000);
    } catch (err) {
      console.error(err);
      alert("Error saving campaign configuration.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Send Custom Broadcast
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPatientIds.length === 0) {
      alert("Please select at least one recipient patient.");
      return;
    }
    if (!broadcastMessage.trim()) {
      alert("Please enter a custom message to broadcast.");
      return;
    }

    // Map recipient IDs to phone numbers
    const recipientPhones = patients
      .filter(p => selectedPatientIds.includes(p.id))
      .map(p => p.phone);

    try {
      setIsSending(true);
      await onSendBroadcast({
        title: broadcastTitle,
        message: broadcastMessage,
        recipientPhones
      });

      // Simulation details of hitting webhook gateway
      if (smsWebhook) {
        console.log(`Pinging SMS Gateway [POST ${smsWebhook}] with payload:`, {
          message: broadcastMessage,
          recipients: recipientPhones
        });
      }

      setSendSuccess(true);
      setSelectedPatientIds([]);
      setBroadcastTitle('Festival Well-Wishes Campaign');
      setBroadcastMessage('');
      
      setTimeout(() => setSendSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Error dispatching custom broadcast.");
    } finally {
      setIsSending(false);
    }
  };

  // Populate message field with a saved template
  const applyTemplate = (templateText: string, title: string) => {
    setBroadcastTitle(title);
    setBroadcastMessage(templateText);
  };

  return (
    <div className="space-y-6" id="broadcast-center-root">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* COL 1 & 2: Broadcast dispatcher */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Custom Broadcast Panel */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-5">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-50 text-base flex items-center space-x-2">
                <Send className="h-5 w-5 text-teal-600" />
                <span>Custom Notices & Festival Greetings Broadcast</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Dispatch bulk SMS/WhatsApp messages to parents of patients using the configured gateway.
              </p>
            </div>

            {sendSuccess && (
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 p-3.5 rounded-lg text-xs flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>Campaign sent successfully! {smsWebhook ? "Payload dispatched to webhook." : "Simulated successfully."}</span>
              </div>
            )}

            {/* Quick Templates Buttons */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-400 uppercase">Apply Festival Presets</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyTemplate(diwaliTemplate, "Diwali Festival Greetings")}
                  className="bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-3 py-1.5 rounded-lg text-xs font-semibold border border-amber-200 dark:border-amber-900 transition-colors"
                >
                  🪔 Diwali Greeting
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate(eidTemplate, "Eid Festival Greetings")}
                  className="bg-green-50 hover:bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300 px-3 py-1.5 rounded-lg text-xs font-semibold border border-green-200 dark:border-green-900 transition-colors"
                >
                  🌙 Eid Mubarak
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate(newYearTemplate, "New Year Healthy Greetings")}
                  className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 px-3 py-1.5 rounded-lg text-xs font-semibold border border-blue-200 dark:border-blue-900 transition-colors"
                >
                  🎉 New Year Wish
                </button>
              </div>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              {/* Campaign Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Campaign Title / Event</label>
                <input
                  type="text"
                  required
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="e.g. Diwali Wellness Greetings"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Broadcast Message Body</label>
                <textarea
                  required
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  rows={4}
                  placeholder="Type the SMS content here..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>

              {/* Patient recipient selection list */}
              <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">Select Recipient Patients ({selectedPatientIds.length} Selected)</label>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={selectAll}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded font-bold"
                    >
                      All ({patients.length})
                    </button>
                    <button
                      type="button"
                      onClick={selectNone}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded font-bold"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  value={recipientSearch}
                  onChange={(e) => setRecipientSearch(e.target.value)}
                  placeholder="Filter child name or phone..."
                  className="w-full px-2 py-1 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded text-xs focus:outline-none mb-2"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto p-1 border border-slate-100 dark:border-slate-800 rounded-lg">
                  {filteredPatients.map(p => (
                    <label
                      key={p.id}
                      className={`flex items-center space-x-2 text-xs p-2 rounded-lg cursor-pointer transition-colors border ${
                        selectedPatientIds.includes(p.id)
                          ? 'border-teal-300 bg-teal-50/10 dark:border-teal-800'
                          : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPatientIds.includes(p.id)}
                        onChange={() => togglePatientSelection(p.id)}
                        className="rounded border-slate-300 text-teal-600 h-3.5 w-3.5"
                      />
                      <div className="truncate">
                        <strong className="text-slate-900 dark:text-slate-50 block truncate">{p.firstName} {p.surname}</strong>
                        <span className="text-[10px] text-slate-400 block font-mono">{p.phone}</span>
                      </div>
                    </label>
                  ))}
                  {filteredPatients.length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center py-4 col-span-2">No patients registered.</p>
                  )}
                </div>
              </div>

              {/* Submit btn */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSending || selectedPatientIds.length === 0}
                  className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg text-xs shadow-sm transition-all flex items-center space-x-1.5"
                >
                  {isSending ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Dispatching SMS...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>Send Campaign ({selectedPatientIds.length} Recs)</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>

          {/* Past Broadcast History Logs */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-slate-50 text-sm mb-4">Historical Broadcast Logs</h3>
            
            {broadcasts.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No broadcast campaigns sent yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[300px] overflow-y-auto pr-1">
                {broadcasts.map(bc => (
                  <div key={bc.id} className="py-3 text-xs space-y-1">
                    <div className="flex justify-between">
                      <strong className="text-slate-900 dark:text-slate-100">{bc.title}</strong>
                      <span className="text-[10px] text-slate-400 font-mono">{formatDateTime(bc.createdAt)}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-2 rounded">
                      {bc.message}
                    </p>
                    <p className="text-[10px] text-teal-600 font-semibold">
                      Dispatched to {bc.recipientPhones.length} verified phone numbers.
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* COL 3: Campaign Settings / Integration placeholders */}
        <div>
          <form onSubmit={handleSaveSettings} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-slate-50 text-sm flex items-center space-x-1.5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Sliders className="h-4 w-4 text-teal-600" />
              <span>Gateway & Template Configurations</span>
            </h3>

            {settingsSuccess && (
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 p-2.5 rounded-lg text-xs font-semibold">
                Configurations saved successfully.
              </div>
            )}

            {/* Webhook Endpoint */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center space-x-1">
                <Smartphone className="h-3.5 w-3.5" />
                <span>SMS/WhatsApp Webhook Web-Gateway</span>
              </label>
              <input
                type="url"
                value={smsWebhook}
                onChange={(e) => setSmsWebhook(e.target.value)}
                placeholder="https://api.example.com/sms-webhook"
                className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:border-teal-500"
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                Web API hook pinged whenever a vaccination due alert or notification goes out.
              </span>
            </div>

            {/* Template: Appointments */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Appointment Reminder SMS Template</label>
              <textarea
                value={appointmentTemplate}
                onChange={(e) => setAppointmentTemplate(e.target.value)}
                rows={3}
                className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Template: Vaccines */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Vaccination Due SMS Template</label>
              <textarea
                value={vaccineDueTemplate}
                onChange={(e) => setVaccineDueTemplate(e.target.value)}
                rows={3}
                className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Festival presets customization */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-3">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase">Festival Greetings Copy</h4>
              
              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Diwali Template Preset</label>
                <textarea
                  value={diwaliTemplate}
                  onChange={(e) => setDiwaliTemplate(e.target.value)}
                  rows={2}
                  className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Eid Template Preset</label>
                <textarea
                  value={eidTemplate}
                  onChange={(e) => setEidTemplate(e.target.value)}
                  rows={2}
                  className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">New Year Template Preset</label>
                <textarea
                  value={newYearTemplate}
                  onChange={(e) => setNewYearTemplate(e.target.value)}
                  rows={2}
                  className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingSettings}
              className="w-full bg-teal-600 text-white font-bold px-3 py-2 rounded text-xs hover:bg-teal-700 shadow-sm transition-all"
            >
              {isSavingSettings ? "Saving Templates..." : "Save Campaign Presets"}
            </button>

          </form>
        </div>

      </div>
    </div>
  );
}
