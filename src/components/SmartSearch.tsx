import React, { useState, useMemo } from 'react';
import { Search, UserPlus, AlertCircle, RefreshCw, CheckCircle, Info } from 'lucide-react';
import { Patient } from '../types';
import { calculateAgeDetail, generatePatientId } from '../utils';

interface SmartSearchProps {
  patients: Patient[];
  onRegisterPatient: (patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt' | 'creatorId'>) => Promise<string>;
  onSelectPatient: (patientId: string) => void;
}

export default function SmartSearch({ patients, onRegisterPatient, onSelectPatient }: SmartSearchProps) {
  // Search query states
  const [searchTerm, setSearchTerm] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [searchParentName, setSearchParentName] = useState('');
  const [searchPlace, setSearchPlace] = useState('');

  // Register state
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [newFirst, setNewFirst] = useState('');
  const [newSurname, setNewSurname] = useState('');
  const [newParent, setNewParent] = useState('');
  const [newPlace, setNewPlace] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newBirth, setNewBirth] = useState('');
  const [newGender, setNewGender] = useState<Patient['gender']>('Male');
  const [newWeight, setNewWeight] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registerSuccessId, setRegisterSuccessId] = useState<string | null>(null);

  // Computed Age dynamically in registration
  const computedAgeDisplay = useMemo(() => {
    if (!newBirth) return null;
    return calculateAgeDetail(newBirth).display;
  }, [newBirth]);

  // Real-time Duplicate Detection
  // Matches Name (First + Surname) + Father/Mother Name + Native Place
  const potentialDuplicates = useMemo(() => {
    if (!newFirst.trim()) return [];
    
    return patients.filter(p => {
      const nameMatch = p.firstName.toLowerCase().trim() === newFirst.toLowerCase().trim() &&
                         p.surname.toLowerCase().trim() === newSurname.toLowerCase().trim();
      const parentMatch = newParent.trim() ? p.parentName.toLowerCase().includes(newParent.toLowerCase().trim()) : false;
      const placeMatch = newPlace.trim() ? p.nativePlace.toLowerCase().includes(newPlace.toLowerCase().trim()) : false;
      
      // We flag as potential duplicate if name matches, and either parent or native place matches
      return nameMatch || (parentMatch && placeMatch);
    });
  }, [newFirst, newSurname, newParent, newPlace, patients]);

  // Master Search Filter
  const filteredPatients = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const phone = searchPhone.trim();
    const parent = searchParentName.toLowerCase().trim();
    const place = searchPlace.toLowerCase().trim();

    if (!term && !phone && !parent && !place) {
      return patients.slice(0, 50); // Show top 50 recently updated by default
    }

    return patients.filter(p => {
      // 1. Search term matches ID, First Name, Surname, or parent Name
      let matchesTerm = true;
      if (term) {
        matchesTerm = p.id.toLowerCase().includes(term) ||
                      p.firstName.toLowerCase().includes(term) ||
                      p.surname.toLowerCase().includes(term) ||
                      p.parentName.toLowerCase().includes(term);
      }

      // 2. Phone matches
      let matchesPhone = true;
      if (phone) {
        matchesPhone = p.phone.includes(phone);
      }

      // 3. Parent matches
      let matchesParent = true;
      if (parent) {
        matchesParent = p.parentName.toLowerCase().includes(parent);
      }

      // 4. Place matches
      let matchesPlace = true;
      if (place) {
        matchesPlace = p.nativePlace.toLowerCase().includes(place);
      }

      return matchesTerm && matchesPhone && matchesParent && matchesPlace;
    });
  }, [searchTerm, searchPhone, searchParentName, searchPlace, patients]);

  // Handle registration submit
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirst || !newSurname || !newParent || !newPlace || !newPhone || !newBirth) {
      alert("Please fill all required registration fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      const generatedId = await onRegisterPatient({
        firstName: newFirst,
        surname: newSurname,
        parentName: newParent,
        nativePlace: newPlace,
        phone: newPhone,
        birthDate: newBirth,
        gender: newGender,
        weight: newWeight ? parseFloat(newWeight) : undefined
      });

      setRegisterSuccessId(generatedId);
      // Reset registration form
      setNewFirst('');
      setNewSurname('');
      setNewParent('');
      setNewPlace('');
      setNewPhone('');
      setNewBirth('');
      setNewGender('Male');
      setNewWeight('');
      
      setTimeout(() => {
        setRegisterSuccessId(null);
        setShowRegisterForm(false);
        // Automatically direct to the registered patient
        onSelectPatient(generatedId);
      }, 2500);

    } catch (err) {
      console.error(err);
      alert("Registration failed. Please check your credentials or network.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSearchPhone('');
    setSearchParentName('');
    setSearchPlace('');
  };

  return (
    <div className="space-y-6" id="smart-search-root">
      {/* Upper Panel: Main Search & Actions */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Patient Directory & Smart Registration</h2>
            <p className="text-xs text-slate-500 mt-1">
              Search by Unique ID, Phone, or perform advanced cross-matching to eliminate duplicates.
            </p>
          </div>
          
          <button
            onClick={() => {
              setShowRegisterForm(!showRegisterForm);
              setRegisterSuccessId(null);
            }}
            className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2 rounded-lg text-sm shadow-sm transition-colors self-start md:self-auto"
          >
            <UserPlus className="h-4 w-4" />
            <span>{showRegisterForm ? "Hide Registration" : "Register New Kid"}</span>
          </button>
        </div>

        {/* Real-time Registration Form Overlay / Panel */}
        {showRegisterForm && (
          <form onSubmit={handleRegister} className="border border-teal-100 dark:border-teal-900 bg-teal-50/20 dark:bg-teal-950/10 rounded-xl p-5 mb-6 space-y-4">
            <h3 className="font-bold text-teal-800 dark:text-teal-400 text-sm flex items-center space-x-2">
              <UserPlus className="h-4 w-4" />
              <span>New Patient Pediatric Profiling</span>
            </h3>

            {registerSuccessId && (
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 p-3 rounded-lg text-xs flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>Patient registered successfully with Unique ID <strong>{registerSuccessId}</strong>! Opening file...</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* First Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={newFirst}
                  onChange={(e) => setNewFirst(e.target.value)}
                  placeholder="e.g. Aarav"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>

              {/* Surname */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Surname *</label>
                <input
                  type="text"
                  required
                  value={newSurname}
                  onChange={(e) => setNewSurname(e.target.value)}
                  placeholder="e.g. Patel"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>

              {/* Father's/Mother's Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Father's/Mother's Name *</label>
                <input
                  type="text"
                  required
                  value={newParent}
                  onChange={(e) => setNewParent(e.target.value)}
                  placeholder="e.g. Rajesh Bhai"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>

              {/* Native Place */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Native Place / Town *</label>
                <input
                  type="text"
                  required
                  value={newPlace}
                  onChange={(e) => setNewPlace(e.target.value)}
                  placeholder="e.g. Indore"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Birth Date * (Precise Pediatrics age calculator)</label>
                <input
                  type="date"
                  required
                  max={new Date().toISOString().split('T')[0]}
                  value={newBirth}
                  onChange={(e) => setNewBirth(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:border-teal-500 focus:outline-none"
                />
                {computedAgeDisplay && (
                  <p className="text-xs text-teal-600 dark:text-teal-400 mt-1 font-medium">Computed Age: {computedAgeDisplay}</p>
                )}
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Gender *</label>
                <select
                  value={newGender}
                  onChange={(e) => setNewGender(e.target.value as Patient['gender'])}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:border-teal-500 focus:outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Weight */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Birth Weight (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  placeholder="e.g. 3.2"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Duplicate Profile Alerts Feed */}
            {potentialDuplicates.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl p-4 space-y-2">
                <p className="text-xs font-bold text-amber-800 dark:text-amber-400 flex items-center space-x-1.5">
                  <AlertCircle className="h-4 w-4" />
                  <span>Duplicate Alert! Potential Profile Match Found:</span>
                </p>
                <p className="text-[11px] text-slate-500">
                  Please verify if this child has already been registered to avoid duplicate records in the EMR.
                </p>
                <div className="space-y-1.5 mt-2">
                  {potentialDuplicates.map(dup => (
                    <div key={dup.id} className="flex items-center justify-between bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-amber-100 dark:border-amber-950 text-xs">
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{dup.firstName} {dup.surname}</span>
                        <span className="text-slate-500 font-mono ml-2">({dup.id})</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">Parent: {dup.parentName} • Place: {dup.nativePlace} • Phone: {dup.phone}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowRegisterForm(false);
                          onSelectPatient(dup.id);
                        }}
                        className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-2.5 py-1 rounded font-semibold hover:bg-amber-200 transition-colors"
                      >
                        Open File
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRegisterForm(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg text-xs shadow-sm transition-colors flex items-center space-x-1.5"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span>Registering...</span>
                  </>
                ) : (
                  <span>Submit Profile</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Active Smart Search Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
          {/* Main Keyword Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Name or Unique ID..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:border-teal-500 focus:outline-none"
            />
          </div>

          {/* Phone Filter */}
          <input
            type="text"
            value={searchPhone}
            onChange={(e) => setSearchPhone(e.target.value)}
            placeholder="Search Phone Number..."
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:border-teal-500 focus:outline-none"
          />

          {/* Parent filter */}
          <input
            type="text"
            value={searchParentName}
            onChange={(e) => setSearchParentName(e.target.value)}
            placeholder="Search Father/Mother Name..."
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:border-teal-500 focus:outline-none"
          />

          {/* Native Place filter */}
          <div className="flex space-x-2">
            <input
              type="text"
              value={searchPlace}
              onChange={(e) => setSearchPlace(e.target.value)}
              placeholder="Search Native Place..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:border-teal-500 focus:outline-none"
            />
            {(searchTerm || searchPhone || searchParentName || searchPlace) && (
              <button
                onClick={clearFilters}
                className="px-3 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 text-xs font-semibold"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lower Panel: Directory Results Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center space-x-2">
            <span>Query Results</span>
            <span className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full text-xs font-normal">
              {filteredPatients.length} found
            </span>
          </h3>
          <p className="text-[11px] text-slate-400">Desktop-optimized viewport</p>
        </div>

        {filteredPatients.length === 0 ? (
          <div className="p-10 text-center text-slate-400 dark:text-slate-500">
            <Search className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
            <p className="text-sm font-semibold">No patients match your search criteria.</p>
            <p className="text-xs mt-1">Try broadening your filters or click "Register New Kid" to register.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/40 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-3">Patient ID</th>
                  <th className="px-6 py-3">Full Name</th>
                  <th className="px-6 py-3">Father's / Mother's Name</th>
                  <th className="px-6 py-3">Age (Precise)</th>
                  <th className="px-6 py-3">Gender</th>
                  <th className="px-6 py-3">Weight (Birth)</th>
                  <th className="px-6 py-3">Phone</th>
                  <th className="px-6 py-3">Native Place</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 text-sm">
                {filteredPatients.map(p => {
                  const age = calculateAgeDetail(p.birthDate).display;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-3.5 font-mono text-xs font-bold text-teal-600 dark:text-teal-400">
                        {p.id}
                      </td>
                      <td className="px-6 py-3.5 font-medium text-slate-900 dark:text-slate-50">
                        {p.firstName} {p.surname}
                      </td>
                      <td className="px-6 py-3.5">
                        {p.parentName}
                      </td>
                      <td className="px-6 py-3.5">
                        {age}
                      </td>
                      <td className="px-6 py-3.5 text-xs">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${
                          p.gender === 'Male' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' :
                          p.gender === 'Female' ? 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300' :
                          'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                        }`}>
                          {p.gender}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-medium text-slate-900 dark:text-slate-50">
                        {p.weight ? `${p.weight} kg` : <span className="text-slate-400 dark:text-slate-600">—</span>}
                      </td>
                      <td className="px-6 py-3.5 font-mono text-xs">
                        {p.phone}
                      </td>
                      <td className="px-6 py-3.5">
                        {p.nativePlace}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={() => onSelectPatient(p.id)}
                          className="text-xs bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 px-3 py-1.5 rounded-lg font-bold hover:bg-teal-100 dark:hover:bg-teal-900 transition-all shadow-sm"
                        >
                          View EMR / Chart
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
