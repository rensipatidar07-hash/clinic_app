import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, FileText, Plus, ShieldCheck, HeartPulse, Sparkles, Upload, ExternalLink, Activity, ArrowLeft, Trash2 } from 'lucide-react';
import { Patient, Visit, Vaccination, Milestone, PrescriptionItem, LabReportItem } from '../types';
import { calculateAgeDetail, formatDate, formatDateTime } from '../utils';
import { PED_MILESTONES, PED_VACCINE_SCHEDULE, STANDARD_SYMPTOMS } from '../data';

interface ChronologicalEMRProps {
  patient: Patient;
  visits: Visit[];
  vaccinations: Vaccination[];
  milestones: Milestone[];
  onAddVisit: (visitData: Omit<Visit, 'id' | 'patientId' | 'createdAt' | 'updatedAt' | 'creatorId'>) => Promise<void>;
  onUpdateVaccineStatus: (vaccineId: string, status: Vaccination['status'], givenDate?: string) => Promise<void>;
  onUpdateMilestoneStatus: (milestoneId: string, status: Milestone['status'], achievedDate?: string) => Promise<void>;
  onBack: () => void;
  userRole: 'Doctor' | 'Staff';
}

export default function ChronologicalEMR({
  patient,
  visits,
  vaccinations,
  milestones,
  onAddVisit,
  onUpdateVaccineStatus,
  onUpdateMilestoneStatus,
  onBack,
  userRole
}: ChronologicalEMRProps) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'new-encounter' | 'vaccines' | 'milestones'>('timeline');

  // New Encounter States
  const [weightOption, setWeightOption] = useState<string>('5');
  const [customWeight, setCustomWeight] = useState<string>('');
  
  const [heightOption, setHeightOption] = useState<string>('60');
  const [customHeight, setCustomHeight] = useState<string>('');
  
  const [headOption, setHeadOption] = useState<string>('40');
  const [customHead, setCustomHead] = useState<string>('');

  const [tempOption, setTempOption] = useState<string>('98.6');
  const [customTemp, setCustomTemp] = useState<string>('');

  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [showOtherSymptom, setShowOtherSymptom] = useState(false);
  const [customSymptom, setCustomSymptom] = useState('');

  const [clinicalNotes, setClinicalNotes] = useState('');
  const [historyNotes, setHistoryNotes] = useState('');

  // Prescription states
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('2.5 ml');
  const [customDosage, setCustomDosage] = useState('');
  const [frequency, setFrequency] = useState('Once daily');
  const [customFrequency, setCustomFrequency] = useState('');
  const [duration, setDuration] = useState('5 days');
  const [customDuration, setCustomDuration] = useState('');
  const [instructions, setInstructions] = useState('After feed');

  // Lab reports states in encounter
  const [labReports, setLabReports] = useState<LabReportItem[]>([]);
  const [labName, setLabName] = useState('');
  const [labUrl, setLabUrl] = useState('');
  const [labNotes, setLabNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Vitals Dropdown Option Lists
  const weightOptions = Array.from({ length: 25 }, (_, i) => String(i + 1)); // 1 to 25 kg
  const heightOptions = Array.from({ length: 80 }, (_, i) => String(i + 45)); // 45 to 125 cm
  const headOptions = Array.from({ length: 30 }, (_, i) => String(i + 30)); // 30 to 60 cm
  const tempOptions = ['97.0', '98.0', '98.6', '99.5', '100.4', '101.5', '102.5', '103.5', '104.0'];

  // Prescription presets
  const dosageOptions = ['1.0 ml', '2.5 ml', '5.0 ml', '7.5 ml', '10.0 ml', '1/2 Tablet', '1 Tablet', '1 Drops'];
  const frequencyOptions = ['Once daily (OD)', 'Twice daily (BD)', 'Three times daily (TD)', 'Four times daily (QID)', 'As needed (PRN)'];
  const durationOptions = ['3 days', '5 days', '7 days', '10 days', '14 days', 'Single dose'];

  // Add Prescription to list
  const addPrescription = () => {
    const finalMedName = medicineName.trim();
    if (!finalMedName) return;

    const finalDosage = dosage === 'Other' ? customDosage : dosage;
    const finalFrequency = frequency === 'Other' ? customFrequency : frequency;
    const finalDuration = duration === 'Other' ? customDuration : duration;

    setPrescriptions([...prescriptions, {
      medicineName: finalMedName,
      dosage: finalDosage,
      frequency: finalFrequency,
      duration: finalDuration,
      instructions
    }]);

    setMedicineName('');
    setCustomDosage('');
    setCustomFrequency('');
    setCustomDuration('');
    setInstructions('After feed');
  };

  // Remove Prescription from list
  const removePrescription = (index: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  // Add Lab Report
  const addLabReport = () => {
    const finalName = labName.trim();
    const finalUrl = labUrl.trim();
    if (!finalName) return;

    setLabReports([...labReports, {
      id: `lab-${Date.now()}`,
      fileName: finalName,
      fileUrl: finalUrl || "https://example.com/mock-lab-report.pdf", // default mock pdf if empty
      notes: labNotes,
      uploadedAt: new Date().toISOString()
    }]);

    setLabName('');
    setLabUrl('');
    setLabNotes('');
  };

  const removeLabReport = (id: string) => {
    setLabReports(labReports.filter(lr => lr.id !== id));
  };

  // Handle symptom checkbox toggle
  const toggleSymptom = (symptom: string) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };

  // Submit visit
  const handleSubmitVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole !== 'Doctor') {
      alert("Only the doctor is permitted to write clinical records.");
      return;
    }

    // Resolve final Vitals
    const weightVal = Number(weightOption === 'Other' ? customWeight : weightOption);
    const heightVal = Number(heightOption === 'Other' ? customHeight : heightOption);
    const headVal = Number(headOption === 'Other' ? customHead : headOption);
    const tempVal = Number(tempOption === 'Other' ? customTemp : tempOption);

    if (isNaN(weightVal) || weightVal <= 0) {
      alert("Please specify a valid Weight.");
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddVisit({
        date: new Date().toISOString(),
        weight: weightVal,
        height: heightVal || 0,
        headCircumference: headVal || 0,
        temperature: tempVal || 98.6,
        vitalsOther: `W:${weightOption === 'Other' ? 'Custom' : 'Selected'}, H:${heightOption === 'Other' ? 'Custom' : 'Selected'}, HC:${headOption === 'Other' ? 'Custom' : 'Selected'}, T:${tempOption === 'Other' ? 'Custom' : 'Selected'}`,
        symptoms: selectedSymptoms,
        symptomsOther: showOtherSymptom ? customSymptom : '',
        clinicalNotes,
        history: historyNotes,
        vaccinationsGiven: [],
        milestonesChecked: [],
        prescriptions,
        labReports
      });

      // Clear Form states
      setWeightOption('5');
      setCustomWeight('');
      setHeightOption('60');
      setCustomHeight('');
      setHeadOption('40');
      setCustomHead('');
      setTempOption('98.6');
      setCustomTemp('');
      setSelectedSymptoms([]);
      setShowOtherSymptom(false);
      setCustomSymptom('');
      setClinicalNotes('');
      setHistoryNotes('');
      setPrescriptions([]);
      setLabReports([]);

      setActiveTab('timeline');
      alert("Encounter notes saved successfully.");
    } catch (err) {
      console.error(err);
      alert("Error saving encounter notes.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sort visits chronologically
  const sortedVisits = useMemo(() => {
    return [...visits].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [visits]);

  // Sync / Initialize milestones and vaccinations if empty (calculated based on vaccination schedule from data.ts)
  const missingVaccines = useMemo(() => {
    const registeredVaccines = new Set(vaccinations.map(v => v.vaccineName));
    return PED_VACCINE_SCHEDULE.filter(v => !registeredVaccines.has(v.name));
  }, [vaccinations]);

  const missingMilestones = useMemo(() => {
    const registeredMilestones = new Set(milestones.map(m => m.milestoneName));
    return PED_MILESTONES.filter(m => !registeredMilestones.has(m.name));
  }, [milestones]);

  const ageDetails = useMemo(() => {
    return calculateAgeDetail(patient.birthDate);
  }, [patient.birthDate]);

  return (
    <div className="space-y-6" id="emr-workspace-root">
      {/* Header Profile Summary */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 px-2 py-0.5 rounded font-bold">
                {patient.id}
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                {patient.firstName} {patient.surname}
              </h2>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                patient.gender === 'Male' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' :
                patient.gender === 'Female' ? 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300' :
                'bg-purple-50 text-purple-700 dark:bg-purple-950/40'
              }`}>
                {patient.gender}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Parent: <span className="font-semibold text-slate-700 dark:text-slate-300">{patient.parentName}</span> • 
              Place: <span className="font-semibold text-slate-700 dark:text-slate-300">{patient.nativePlace}</span> • 
              Age: <span className="font-semibold text-teal-600 dark:text-teal-400">{ageDetails.display}</span> (DOB: {formatDate(patient.birthDate)})
              {patient.weight && (
                <> • Birth Weight: <span className="font-semibold text-teal-600 dark:text-teal-400">{patient.weight} kg</span></>
              )}
            </p>
          </div>
        </div>

        {/* Action Button: New Visit */}
        {userRole === 'Doctor' && activeTab !== 'new-encounter' && (
          <button
            onClick={() => setActiveTab('new-encounter')}
            className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2 rounded-lg text-xs shadow-sm transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>New EMR Encounter</span>
          </button>
        )}
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-5 py-3 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === 'timeline'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>Chronological EMR Timeline</span>
        </button>

        {userRole === 'Doctor' && (
          <button
            onClick={() => setActiveTab('new-encounter')}
            className={`px-5 py-3 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'new-encounter'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Clinical Active Encounter</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('vaccines')}
          className={`px-5 py-3 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === 'vaccines'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Vaccinations ({vaccinations.filter(v => v.status === 'completed').length} Given)</span>
        </button>

        <button
          onClick={() => setActiveTab('milestones')}
          className={`px-5 py-3 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === 'milestones'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <HeartPulse className="h-4 w-4" />
          <span>Developmental Milestones</span>
        </button>
      </div>

      {/* Workspace Area */}
      <div className="space-y-6">

        {/* TAB 1: EMR TIMELINE */}
        {activeTab === 'timeline' && (
          <div className="space-y-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center space-x-1.5">
              <Calendar className="h-4 w-4 text-teal-600" />
              <span>Pediatric Growth & Consultation Timeline</span>
            </h3>

            {sortedVisits.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-xl text-center text-slate-400 dark:text-slate-500">
                <FileText className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                <p className="text-sm font-semibold">No past medical consultations logged.</p>
                {userRole === 'Doctor' ? (
                  <button
                    onClick={() => setActiveTab('new-encounter')}
                    className="mt-3 bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900 text-xs px-4 py-2 rounded-lg font-bold transition-all"
                  >
                    Create First Encounter Notes
                  </button>
                ) : (
                  <p className="text-xs mt-1">Consultation files are locked until entered by the attending Pediatrician.</p>
                )}
              </div>
            ) : (
              <div className="relative border-l-2 border-slate-200 dark:border-slate-800 pl-6 ml-4 space-y-8">
                {sortedVisits.map((visit) => (
                  <div key={visit.id} className="relative">
                    {/* Timestamp Dot */}
                    <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-teal-500 border-4 border-white dark:border-slate-955 shadow" />

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm space-y-4">
                      {/* Visit Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatDateTime(visit.date)}</p>
                          <p className="text-[11px] text-slate-400">Dr. Pediatrician Consultation Notes</p>
                        </div>
                        
                        {/* Vitals summary bar */}
                        <div className="flex flex-wrap items-center gap-3 mt-2 sm:mt-0 text-xs">
                          <span className="bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded border border-slate-100 dark:border-slate-800">
                            Weight: <strong className="text-teal-600 dark:text-teal-400">{visit.weight} kg</strong>
                          </span>
                          {visit.height > 0 && (
                            <span className="bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded border border-slate-100 dark:border-slate-800">
                              Height: <strong className="text-teal-600 dark:text-teal-400">{visit.height} cm</strong>
                            </span>
                          )}
                          {visit.headCircumference > 0 && (
                            <span className="bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded border border-slate-100 dark:border-slate-800">
                              HC: <strong className="text-teal-600 dark:text-teal-400">{visit.headCircumference} cm</strong>
                            </span>
                          )}
                          <span className="bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded border border-slate-100 dark:border-slate-800">
                            Temp: <strong className="text-rose-600 dark:text-rose-400">{visit.temperature}°F</strong>
                          </span>
                        </div>
                      </div>

                      {/* Symptoms & History */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        {/* Symptoms Checked */}
                        <div>
                          <p className="font-semibold text-slate-500 mb-1">Chief Symptoms / Presentation</p>
                          <div className="flex flex-wrap gap-1.5">
                            {visit.symptoms.map(sym => (
                              <span key={sym} className="bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded border border-amber-100 dark:border-amber-900">
                                {sym}
                              </span>
                            ))}
                            {visit.symptomsOther && (
                              <span className="bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded border border-purple-100 dark:border-purple-900">
                                Other: {visit.symptomsOther}
                              </span>
                            )}
                            {visit.symptoms.length === 0 && !visit.symptomsOther && (
                              <span className="text-slate-400 italic">None logged (Routine exam)</span>
                            )}
                          </div>
                        </div>

                        {/* History notes */}
                        {visit.history && (
                          <div>
                            <p className="font-semibold text-slate-500 mb-1">Patient History / Parental Concerns</p>
                            <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded border border-slate-100 dark:border-slate-800">
                              {visit.history}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Clinical Notes */}
                      <div className="text-xs">
                        <p className="font-semibold text-slate-500 mb-1">Pediatrician Examination Notes & Assessment</p>
                        <p className="text-slate-800 dark:text-slate-200 bg-teal-50/10 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800 leading-relaxed whitespace-pre-wrap">
                          {visit.clinicalNotes}
                        </p>
                      </div>

                      {/* Prescriptions */}
                      {visit.prescriptions && visit.prescriptions.length > 0 && (
                        <div className="border border-teal-100 dark:border-teal-900/60 rounded-lg p-4 bg-teal-50/5 dark:bg-teal-950/5">
                          <h4 className="text-xs font-bold text-teal-800 dark:text-teal-400 mb-2 flex items-center space-x-1.5">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Prescribed Pharmacotherapy / Dosing</span>
                          </h4>
                          <div className="divide-y divide-teal-100 dark:divide-teal-900/40">
                            {visit.prescriptions.map((p, idx) => (
                              <div key={idx} className="py-2 text-xs flex justify-between items-center">
                                <div>
                                  <strong className="text-slate-900 dark:text-slate-50">{p.medicineName}</strong>
                                  <span className="text-slate-500 ml-2">({p.dosage} • {p.frequency} • {p.duration})</span>
                                </div>
                                {p.instructions && (
                                  <span className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded">
                                    {p.instructions}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Lab reports and attachments */}
                      {visit.labReports && visit.labReports.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 mb-1.5">Blood Tests & Lab Attachments</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {visit.labReports.map((lr) => (
                              <a
                                key={lr.id}
                                href={lr.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-between border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg text-xs bg-slate-50/50 dark:bg-slate-800 hover:border-teal-300 transition-colors"
                              >
                                <div className="truncate pr-2">
                                  <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">{lr.fileName}</span>
                                  {lr.notes && <span className="text-[10px] text-slate-500 truncate block">{lr.notes}</span>}
                                </div>
                                <ExternalLink className="h-4 w-4 text-teal-600 flex-shrink-0" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ACTIVE CLINICAL ENCOUNTER FORM */}
        {activeTab === 'new-encounter' && userRole === 'Doctor' && (
          <form onSubmit={handleSubmitVisit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-950 dark:text-slate-50 text-sm border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center space-x-1.5">
              <FileText className="h-5 w-5 text-teal-600" />
              <span>Dr. Pediatrician - Active Clinical Encounter Record</span>
            </h3>

            {/* Section 1: Dropdown-Driven Vitals */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-teal-700 dark:text-teal-400 flex items-center space-x-1">
                <HeartPulse className="h-4 w-4" />
                <span>1. Anthropometrics & Clinical Vitals</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                
                {/* Weight Dropdown with "Other" */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Weight (kg) *</label>
                  <select
                    value={weightOption}
                    onChange={(e) => setWeightOption(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:border-teal-500 focus:outline-none"
                  >
                    {weightOptions.map(w => (
                      <option key={w} value={w}>{w} kg</option>
                    ))}
                    <option value="Other">Other / Custom Weight</option>
                  </select>
                  {weightOption === 'Other' && (
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="Type weight (e.g. 12.4)"
                      value={customWeight}
                      onChange={(e) => setCustomWeight(e.target.value)}
                      className="w-full mt-2 px-3 py-1.5 rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50/20 text-sm focus:outline-none"
                    />
                  )}
                </div>

                {/* Height Dropdown with "Other" */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Height (cm) *</label>
                  <select
                    value={heightOption}
                    onChange={(e) => setHeightOption(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:border-teal-500 focus:outline-none"
                  >
                    {heightOptions.map(h => (
                      <option key={h} value={h}>{h} cm</option>
                    ))}
                    <option value="Other">Other / Custom Height</option>
                  </select>
                  {heightOption === 'Other' && (
                    <input
                      type="number"
                      step="0.1"
                      required
                      placeholder="Type height (e.g. 74.5)"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(e.target.value)}
                      className="w-full mt-2 px-3 py-1.5 rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50/20 text-sm focus:outline-none"
                    />
                  )}
                </div>

                {/* Head Circumference Dropdown with "Other" */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Head Circ. (cm)</label>
                  <select
                    value={headOption}
                    onChange={(e) => setHeadOption(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:border-teal-500 focus:outline-none"
                  >
                    {headOptions.map(hc => (
                      <option key={hc} value={hc}>{hc} cm</option>
                    ))}
                    <option value="Other">Other / Custom Head Circ.</option>
                  </select>
                  {headOption === 'Other' && (
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Type head circumference"
                      value={customHead}
                      onChange={(e) => setCustomHead(e.target.value)}
                      className="w-full mt-2 px-3 py-1.5 rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50/20 text-sm focus:outline-none"
                    />
                  )}
                </div>

                {/* Temperature Dropdown with "Other" */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Temperature (°F) *</label>
                  <select
                    value={tempOption}
                    onChange={(e) => setTempOption(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:border-teal-500 focus:outline-none"
                  >
                    {tempOptions.map(t => (
                      <option key={t} value={t}>{t} °F</option>
                    ))}
                    <option value="Other">Other / Custom Temp</option>
                  </select>
                  {tempOption === 'Other' && (
                    <input
                      type="number"
                      step="0.1"
                      required
                      placeholder="Type temp (e.g. 101.2)"
                      value={customTemp}
                      onChange={(e) => setCustomTemp(e.target.value)}
                      className="w-full mt-2 px-3 py-1.5 rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50/20 text-sm focus:outline-none"
                    />
                  )}
                </div>

              </div>
            </div>

            {/* Section 2: Symptoms checklist with "Other" */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-teal-700 dark:text-teal-400 flex items-center space-x-1">
                <HeartPulse className="h-4 w-4" />
                <span>2. Chief Symptoms & Presentation Checklist</span>
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                {STANDARD_SYMPTOMS.map((symptom) => (
                  <label key={symptom} className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedSymptoms.includes(symptom)}
                      onChange={() => toggleSymptom(symptom)}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
                    />
                    <span>{symptom}</span>
                  </label>
                ))}
                
                {/* Other Checkbox */}
                <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOtherSymptom}
                    onChange={(e) => setShowOtherSymptom(e.target.checked)}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
                  />
                  <span className="font-bold text-teal-600 dark:text-teal-400">Other Symptom...</span>
                </label>
              </div>

              {showOtherSymptom && (
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Type customized pediatric symptoms (e.g. colic spasm, ear discharge)"
                    value={customSymptom}
                    onChange={(e) => setCustomSymptom(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-teal-200 dark:border-teal-800 text-sm bg-teal-50/20 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* History Notes & Parental Concerns */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Parental Concerns & Clinical History</label>
              <textarea
                value={historyNotes}
                onChange={(e) => setHistoryNotes(e.target.value)}
                rows={2}
                placeholder="e.g. Infant crying continuously after feed, history of mild nasal congestion..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:border-teal-500 focus:outline-none"
              />
            </div>

            {/* Clinical Assessment and Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Clinical Assessment, Diagnosis & Examination Notes *</label>
              <textarea
                required
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                rows={4}
                placeholder="e.g. Chest clear on auscultation. Pharynx mildly congested. Abdomen soft. Diagnose: Mild URTI. Advised hydration and temperature monitoring..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:border-teal-500 focus:outline-none"
              />
            </div>

            {/* Pharmacotherapy & Prescription Section */}
            <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
              <h4 className="text-xs font-bold text-teal-700 dark:text-teal-400 flex items-center space-x-1">
                <Sparkles className="h-4 w-4" />
                <span>3. Pediatric Prescription Engine (Modular Pharmacotherapy)</span>
              </h4>

              {/* Prescription Form Row */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 items-end">
                {/* Med Name */}
                <div className="md:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Medicine Name</label>
                  <input
                    type="text"
                    value={medicineName}
                    onChange={(e) => setMedicineName(e.target.value)}
                    placeholder="e.g. Paracetamol Syp"
                    className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none"
                  />
                </div>

                {/* Dosage */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Dosage</label>
                  <select
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none"
                  >
                    {dosageOptions.map(d => <option key={d} value={d}>{d}</option>)}
                    <option value="Other">Other...</option>
                  </select>
                  {dosage === 'Other' && (
                    <input
                      type="text"
                      placeholder="e.g. 4 drops"
                      value={customDosage}
                      onChange={(e) => setCustomDosage(e.target.value)}
                      className="mt-1 w-full px-2 py-1 rounded border border-teal-200 text-xs bg-teal-50/20"
                    />
                  )}
                </div>

                {/* Frequency */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none"
                  >
                    {frequencyOptions.map(f => <option key={f} value={f}>{f}</option>)}
                    <option value="Other">Other...</option>
                  </select>
                  {frequency === 'Other' && (
                    <input
                      type="text"
                      placeholder="e.g. Hourly"
                      value={customFrequency}
                      onChange={(e) => setCustomFrequency(e.target.value)}
                      className="mt-1 w-full px-2 py-1 rounded border border-teal-200 text-xs bg-teal-50/20"
                    />
                  )}
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Duration</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none"
                  >
                    {durationOptions.map(du => <option key={du} value={du}>{du}</option>)}
                    <option value="Other">Other...</option>
                  </select>
                  {duration === 'Other' && (
                    <input
                      type="text"
                      placeholder="e.g. For 2 weeks"
                      value={customDuration}
                      onChange={(e) => setCustomDuration(e.target.value)}
                      className="mt-1 w-full px-2 py-1 rounded border border-teal-200 text-xs bg-teal-50/20"
                    />
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Instructions</label>
                    <input
                      type="text"
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      placeholder="e.g. After food"
                      className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addPrescription}
                    className="bg-teal-600 text-white font-bold px-3 py-1.5 rounded text-xs hover:bg-teal-700 h-[32px] self-end shadow-sm"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Prescription Items list */}
              {prescriptions.length > 0 && (
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-2 bg-slate-50/40 dark:bg-slate-900">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Encounter Prescription List ({prescriptions.length})</p>
                  <div className="space-y-1">
                    {prescriptions.map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-xs p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg shadow-sm">
                        <div>
                          <strong className="text-teal-600 dark:text-teal-400">{item.medicineName}</strong>
                          <span className="text-slate-500 font-medium ml-2">({item.dosage} • {item.frequency} • {item.duration})</span>
                          {item.instructions && <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded ml-2">{item.instructions}</span>}
                        </div>
                        <button
                          type="button"
                          onClick={() => removePrescription(index)}
                          className="text-red-500 hover:text-red-700 p-1 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Blood Tests & Lab Reports Upload */}
            <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
              <h4 className="text-xs font-bold text-teal-700 dark:text-teal-400 flex items-center space-x-1">
                <Upload className="h-4 w-4" />
                <span>4. Blood Tests & Lab Report Attachments</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 items-end">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Report / Test Name</label>
                  <input
                    type="text"
                    value={labName}
                    onChange={(e) => setLabName(e.target.value)}
                    placeholder="e.g. Complete Blood Count (CBC)"
                    className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Document/Image URL (optional)</label>
                  <input
                    type="text"
                    value={labUrl}
                    onChange={(e) => setLabUrl(e.target.value)}
                    placeholder="Paste link to pdf or file..."
                    className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <button
                    type="button"
                    onClick={addLabReport}
                    className="w-full bg-slate-600 text-white font-bold px-3 py-1.5 rounded text-xs hover:bg-slate-700 h-[32px] shadow-sm"
                  >
                    Attach Report
                  </button>
                </div>
              </div>

              {labReports.length > 0 && (
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-2 bg-slate-50/40">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Attached Lab Records ({labReports.length})</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {labReports.map((report) => (
                      <div key={report.id} className="flex justify-between items-center text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg">
                        <div className="truncate pr-2">
                          <strong className="text-slate-800 dark:text-slate-200 truncate block">{report.fileName}</strong>
                          <span className="text-[10px] text-slate-400 truncate block">{report.fileUrl}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeLabReport(report.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Form actions */}
            <div className="flex justify-end space-x-3 border-t border-slate-100 dark:border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setActiveTab('timeline')}
                className="px-5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg text-xs shadow-sm transition-all"
              >
                {isSubmitting ? "Saving Encounter..." : "Save Pediatric Consultation Record"}
              </button>
            </div>

          </form>
        )}

        {/* TAB 3: VACCINATIONS TRACKER */}
        {activeTab === 'vaccines' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-50 text-base flex items-center space-x-2">
                  <ShieldCheck className="h-5 w-5 text-teal-600" />
                  <span>Pediatric Immunization Record Tracker</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track and schedule standard vaccines for age category: {ageDetails.display}.
                </p>
              </div>
              <div className="flex space-x-2">
                <span className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-xs font-semibold px-3 py-1 rounded">
                  {vaccinations.filter(v => v.status === 'completed').length} Given
                </span>
                <span className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-semibold px-3 py-1 rounded">
                  {vaccinations.filter(v => v.status === 'scheduled').length} Due
                </span>
              </div>
            </div>

            {/* Active vaccinations status chart */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Existing Completed/Scheduled list */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase">Logged Vaccines</h4>
                
                {vaccinations.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-4">No custom vaccine logs registered. Click are ready below to update vaccine schedules.</p>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                    {vaccinations.map(v => (
                      <div key={v.id} className="p-3 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 rounded-lg text-xs flex justify-between items-center">
                        <div>
                          <strong className="text-slate-900 dark:text-slate-100">{v.vaccineName}</strong>
                          <p className="text-[10px] text-slate-400 mt-0.5">Due: {v.dueDate} {v.givenDate ? `• Given: ${v.givenDate}` : ''}</p>
                        </div>
                        <select
                          value={v.status}
                          onChange={(e) => onUpdateVaccineStatus(v.id, e.target.value as Vaccination['status'], e.target.value === 'completed' ? new Date().toISOString().split('T')[0] : undefined)}
                          className="px-2 py-1 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 font-semibold"
                        >
                          <option value="scheduled">Scheduled / Due</option>
                          <option value="completed">Completed / Given</option>
                          <option value="overdue">Overdue</option>
                        </select>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Vaccine Recommendation / Booster Checklist */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase">Standard Vaccine Recommendation Engine</h4>
                <div className="space-y-2 border border-slate-100 dark:border-slate-800 rounded-lg p-3 bg-teal-50/5 dark:bg-teal-950/5 max-h-[400px] overflow-y-auto pr-1">
                  {missingVaccines.map(rec => {
                    const isDue = ageDetails.totalMonths >= rec.ageDueMonths;
                    return (
                      <div key={rec.name} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg text-xs flex items-center justify-between">
                        <div className="pr-2">
                          <strong className="text-slate-900 dark:text-slate-50">{rec.name}</strong>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Rec Age: {rec.ageDueMonths === 0 ? 'Birth' : `${rec.ageDueMonths} Months`}</span>
                        </div>
                        <button
                          onClick={() => {
                            // Automatically add and mark as completed
                            onUpdateVaccineStatus(
                              `vac-${rec.name.replace(/\s+/g, '-')}`,
                              'completed',
                              new Date().toISOString().split('T')[0]
                            );
                          }}
                          className={`px-2 py-1 rounded text-[10px] font-bold ${
                            isDue
                              ? 'bg-teal-600 text-white hover:bg-teal-700'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          Mark Given
                        </button>
                      </div>
                    );
                  })}
                  {missingVaccines.length === 0 && (
                    <p className="text-xs text-green-600 font-semibold text-center py-4">All standard pediatric vaccines have been registered!</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DEVELOPMENTAL MILESTONES CHECKLIST */}
        {activeTab === 'milestones' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-50 text-base flex items-center space-x-2">
                  <HeartPulse className="h-5 w-5 text-teal-600" />
                  <span>Developmental Milestone Tracklist</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirm age-specific pediatric growth metrics (gross motor, social, and language skills).
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold px-3 py-1 rounded">
                Verified: {milestones.filter(m => m.status === 'achieved').length} / {PED_MILESTONES.length} Metrics
              </div>
            </div>

            {/* Milestones grid list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Existing tracker */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase">Recorded Developmental Milestones</h4>
                {milestones.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-4">No developmental milestones logged yet. Confirm the milestones below.</p>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                    {milestones.map(m => (
                      <div key={m.id} className="p-3 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 rounded-lg text-xs flex justify-between items-center">
                        <div>
                          <strong className="text-slate-950 dark:text-slate-50">{m.milestoneName}</strong>
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded ml-2">{m.ageCategory}</span>
                          {m.achievedDate && <p className="text-[10px] text-teal-600 font-semibold mt-0.5">Achieved: {m.achievedDate}</p>}
                        </div>
                        <select
                          value={m.status}
                          onChange={(e) => onUpdateMilestoneStatus(m.id, e.target.value as Milestone['status'], e.target.value === 'achieved' ? new Date().toISOString().split('T')[0] : undefined)}
                          className="px-2 py-1 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 font-semibold"
                        >
                          <option value="pending">Pending</option>
                          <option value="achieved">Achieved / Passed</option>
                          <option value="delayed">Delayed</option>
                        </select>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Standard checklist for pediatricians */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase">Milestones Checklist Template</h4>
                <div className="space-y-2 border border-slate-100 dark:border-slate-800 rounded-lg p-3 bg-teal-50/5 dark:bg-teal-950/5 max-h-[400px] overflow-y-auto pr-1">
                  {missingMilestones.map(m => (
                    <div key={m.name} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg text-xs">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <strong className="text-slate-900 dark:text-slate-50">{m.name}</strong>
                          <span className="text-[10px] text-teal-600 font-bold ml-2">({m.ageCategory})</span>
                        </div>
                        <button
                          onClick={() => {
                            onUpdateMilestoneStatus(
                              `mil-${m.name.replace(/\s+/g, '-')}`,
                              'achieved',
                              new Date().toISOString().split('T')[0]
                            );
                          }}
                          className="bg-teal-55 text-teal-600 border border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-900 px-2.5 py-1 rounded text-[10px] font-semibold hover:bg-teal-100 transition-colors"
                        >
                          Mark Achieved
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">{m.description}</p>
                    </div>
                  ))}
                  {missingMilestones.length === 0 && (
                    <p className="text-xs text-green-600 font-semibold text-center py-4">All developmental milestones checked and achieved!</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
