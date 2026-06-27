export interface VaccineScheduleItem {
  name: string;
  ageDueMonths: number;
  description: string;
}

export const PED_VACCINE_SCHEDULE: VaccineScheduleItem[] = [
  { name: "BCG", ageDueMonths: 0, description: "Tuberculosis vaccine given at birth" },
  { name: "Hepatitis B - Dose 1", ageDueMonths: 0, description: "Hepatitis B vaccine given at birth" },
  { name: "OPV - Zero Dose", ageDueMonths: 0, description: "Oral Polio Vaccine given at birth" },
  { name: "Hepatitis B - Dose 2", ageDueMonths: 1, description: "Given at 1 month" },
  { name: "DTaP-IPV-Hib-HepB (Hexavalent) - 1", ageDueMonths: 1.5, description: "Given at 6 weeks" },
  { name: "Pneumococcal Conjugate (PCV) - 1", ageDueMonths: 1.5, description: "Given at 6 weeks" },
  { name: "Rotavirus Vaccine (RV) - 1", ageDueMonths: 1.5, description: "Given at 6 weeks" },
  { name: "DTaP-IPV-Hib-HepB (Hexavalent) - 2", ageDueMonths: 2.5, description: "Given at 10 weeks" },
  { name: "Pneumococcal Conjugate (PCV) - 2", ageDueMonths: 2.5, description: "Given at 10 weeks" },
  { name: "Rotavirus Vaccine (RV) - 2", ageDueMonths: 2.5, description: "Given at 10 weeks" },
  { name: "DTaP-IPV-Hib-HepB (Hexavalent) - 3", ageDueMonths: 3.5, description: "Given at 14 weeks" },
  { name: "Pneumococcal Conjugate (PCV) - 3", ageDueMonths: 3.5, description: "Given at 14 weeks" },
  { name: "Rotavirus Vaccine (RV) - 3", ageDueMonths: 3.5, description: "Given at 14 weeks" },
  { name: "Measles & Rubella (MR) - 1 / MMR - 1", ageDueMonths: 9, description: "Given at 9 months" },
  { name: "Typhoid Conjugate Vaccine (TCV)", ageDueMonths: 9, description: "Given between 9 to 12 months" },
  { name: "Hepatitis A - Dose 1", ageDueMonths: 12, description: "Given at 12 months" },
  { name: "MMR - 2", ageDueMonths: 15, description: "Given at 15 months" },
  { name: "Varicella (Chickenpox) - 1", ageDueMonths: 15, description: "Given at 15 months" },
  { name: "Pneumococcal Conjugate (PCV) - Booster", ageDueMonths: 15, description: "Given between 12-15 months" },
  { name: "DTaP-IPV-Hib - Booster 1", ageDueMonths: 18, description: "Given at 18 months" },
  { name: "Hepatitis A - Dose 2", ageDueMonths: 18, description: "Given 6 months after Dose 1" },
  { name: "Varicella (Chickenpox) - 2", ageDueMonths: 24, description: "Given at 2 years" },
  { name: "MMR - Booster", ageDueMonths: 60, description: "Given between 4-6 years (5 Years)" },
  { name: "DTaP-IPV - Booster 2", ageDueMonths: 60, description: "Given between 4-6 years (5 Years)" }
];

export interface MilestoneItem {
  name: string;
  ageCategory: string;
  description: string;
}

export const PED_MILESTONES: MilestoneItem[] = [
  { name: "Social Smile", ageCategory: "2 Months", description: "Smiles at people or when spoken to" },
  { name: "Coos / Vocalizes", ageCategory: "2 Months", description: "Makes gurgling sounds" },
  { name: "Holds Head Steady", ageCategory: "4 Months", description: "Supports head unsupported when held" },
  { name: "Brings Hands to Mouth", ageCategory: "4 Months", description: "Explores hands and holds toys" },
  { name: "Rolls Over", ageCategory: "6 Months", description: "Rolls from front to back, or back to front" },
  { name: "Responds to Own Name", ageCategory: "6 Months", description: "Turns head when name is called" },
  { name: "Sits Without Support", ageCategory: "9 Months", description: "Sits independently without tipping over" },
  { name: "Clings to Familiar Adults", ageCategory: "9 Months", description: "Shows stranger wariness" },
  { name: "Stands Holding On", ageCategory: "9 Months", description: "Pulls up to stand using furniture" },
  { name: "Walks with Support", ageCategory: "12 Months", description: "Cruises or takes a few steps holding hands" },
  { name: "Says Simple Words (Mama/Dada)", ageCategory: "12 Months", description: "Specific vocalizations for parents" },
  { name: "Walks Independently", ageCategory: "15 Months", description: "Walks well without support" },
  { name: "Uses Spoon", ageCategory: "18 Months", description: "Tries to feed self with spoon" },
  { name: "Points to Show Interest", ageCategory: "18 Months", description: "Points to direct someone's attention" },
  { name: "Kicks a Ball", ageCategory: "24 Months", description: "Kicks ball forward without falling" },
  { name: "2-3 Word Sentences", ageCategory: "24 Months", description: "Combines words to speak (e.g. 'want milk')" }
];

export const STANDARD_SYMPTOMS = [
  "Fever",
  "Cough",
  "Vomiting",
  "Colic",
  "Rash",
  "Loose Stools",
  "Constipation",
  "Poor Feeding / Appetite Loss",
  "Running Nose",
  "Ear Pain",
  "Wheezing",
  "Abdominal Pain",
  "Excessive Crying"
];

export const DEFAULT_TEMPLATES = {
  smsWebhook: "https://api.example.com/clinic-sms-gateway",
  appointmentTemplate: "Dear parent, this is a reminder that {PATIENT_NAME} has an appointment scheduled with Dr. Pediatric on {DATE} at {TIME}. Please arrive 10 mins early.",
  vaccineDueTemplate: "Dear parent, {PATIENT_NAME} is due for their {VACCINE_NAME} vaccination. Please book a visit at your earliest convenience to protect your child.",
  diwaliTemplate: "Wishing you and your family a very Happy and Healthy Diwali! May this festival of lights bring smiles, wellness, and prosperity. - Dr. Pediatric Clinic",
  eidTemplate: "Eid Mubarak! May this joyous day bring peace, good health, and blessings to your child and family. - Dr. Pediatric Clinic",
  newYearTemplate: "Happy New Year! We wish your little ones a year full of laughter, growth, and robust health. - Dr. Pediatric Clinic"
};
