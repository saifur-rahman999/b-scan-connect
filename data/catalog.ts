export type CatalogKind = "service" | "job" | "training" | "education";

export type CatalogItem = {
  slug: string;
  kind: CatalogKind;
  title: string;
  organization: string;
  district: string;
  division: string;
  deliveryMode: "In person" | "Online" | "Hybrid";
  summary: string;
  description: string;
  deadline?: string;
  category: string;
  accessibility: string[];
  eligibility: string[];
  contact: string;
  featured?: boolean;
  salary?: string;
};

export const catalogItems: CatalogItem[] = [
  {
    slug: "community-physiotherapy-programme",
    kind: "service",
    title: "Community Physiotherapy Programme",
    organization: "Shobuj Pathways Foundation",
    district: "Dhaka",
    division: "Dhaka",
    deliveryMode: "In person",
    category: "Health and rehabilitation",
    summary: "Individual physiotherapy assessments, mobility planning and follow-up sessions.",
    description: "A structured physiotherapy service for adults who want support with mobility, pain management or independent living goals. The service begins with an assessment and a shared support plan.",
    accessibility: ["Step-free entrance", "Accessible washroom", "Bangla consultation", "Support person welcome"],
    eligibility: ["Adults aged 18 or above", "Resident of Dhaka district", "Appointment required"],
    contact: "Referral or self-request through B-SCAN Connect",
    featured: true,
  },
  {
    slug: "junior-customer-support-associate",
    kind: "job",
    title: "Junior Customer Support Associate",
    organization: "BrightDesk Bangladesh",
    district: "Dhaka",
    division: "Dhaka",
    deliveryMode: "Hybrid",
    category: "Customer service",
    summary: "Support customers by chat and email in a flexible, inclusive team.",
    description: "Join a customer support team handling written enquiries, updating service records and escalating complex requests. The role includes a structured onboarding plan and regular coaching.",
    deadline: "30 September 2026",
    salary: "BDT 28,000–34,000 monthly",
    accessibility: ["Hybrid schedule", "Screen-reader compatible tools", "Flexible break planning", "Reasonable adjustments"],
    eligibility: ["HSC or equivalent", "Clear written Bangla and English", "Basic digital skills"],
    contact: "Apply through B-SCAN Connect",
    featured: true,
  },
  {
    slug: "accessible-digital-skills-bootcamp",
    kind: "training",
    title: "Accessible Digital Skills Bootcamp",
    organization: "Uddipan Learning Collective",
    district: "Nationwide",
    division: "Nationwide",
    deliveryMode: "Online",
    category: "Digital skills",
    summary: "Eight weeks of practical workplace technology, communication and portfolio support.",
    description: "A guided online programme covering workplace software, accessible collaboration tools, digital communication and portfolio preparation. Sessions are recorded and supported by weekly office hours.",
    deadline: "18 October 2026",
    accessibility: ["Live captions", "Keyboard-accessible materials", "Session recordings", "Low-bandwidth resources"],
    eligibility: ["Age 18 or above", "Access to a phone or computer", "Available for two sessions each week"],
    contact: "Submit an expression of interest",
    featured: true,
  },
  {
    slug: "independent-living-advice",
    kind: "service",
    title: "Independent Living Advice",
    organization: "Open Door Resource Centre",
    district: "Chattogram",
    division: "Chattogram",
    deliveryMode: "Hybrid",
    category: "Independent living",
    summary: "Practical guidance on assistive products, home routines and community participation.",
    description: "One-to-one guidance focused on personal priorities for daily living, assistive products and community participation. Meetings are available online or at the resource centre.",
    accessibility: ["Step-free entrance", "Video appointments", "Bangla and English", "Caregiver consultation"],
    eligibility: ["Open to people with disabilities and family members", "Advance booking required"],
    contact: "Request an introductory appointment",
  },
  {
    slug: "accounts-assistant",
    kind: "job",
    title: "Accounts Assistant",
    organization: "Northstar Social Enterprise",
    district: "Rajshahi",
    division: "Rajshahi",
    deliveryMode: "In person",
    category: "Finance and administration",
    summary: "Maintain invoices, expense records and monthly reporting for a growing enterprise.",
    description: "Support the finance team with invoices, reconciliations, document filing and monthly summaries. The office provides a quiet workspace and an accessible workstation.",
    deadline: "12 October 2026",
    salary: "BDT 25,000–30,000 monthly",
    accessibility: ["Step-free office", "Adjustable workstation", "Flexible interview format", "Written task instructions"],
    eligibility: ["Bachelor's degree or equivalent experience", "Spreadsheet confidence", "Attention to detail"],
    contact: "Apply through B-SCAN Connect",
  },
  {
    slug: "mobile-phone-repair-course",
    kind: "training",
    title: "Mobile Phone Repair Course",
    organization: "Jibon Skills Network",
    district: "Khulna",
    division: "Khulna",
    deliveryMode: "In person",
    category: "Technical and vocational",
    summary: "Hands-on foundation course in diagnostics, maintenance and customer service.",
    description: "A twelve-week practical course covering device diagnostics, component replacement, safe tool handling and customer communication. Tools are provided during class.",
    deadline: "25 September 2026",
    accessibility: ["Ground-floor classroom", "Adapted workbench available", "Small class size", "Bangla instruction"],
    eligibility: ["Age 18–35", "Basic literacy", "Able to attend four days per week"],
    contact: "Request enrolment support",
  },
  {
    slug: "higher-education-admissions-guidance",
    kind: "education",
    title: "Higher Education Admissions Guidance",
    organization: "Shikkha Bridge",
    district: "Nationwide",
    division: "Nationwide",
    deliveryMode: "Online",
    category: "Education guidance",
    summary: "Application planning, documentation review and accessibility conversations with institutions.",
    description: "A four-session guidance service for students planning university or college applications. Advisers help organize deadlines, documents and questions about campus accessibility.",
    deadline: "Rolling intake",
    accessibility: ["Screen-reader friendly documents", "Live captions", "Flexible session length", "Family member welcome"],
    eligibility: ["Current or prospective higher-education applicant", "Available for an initial planning session"],
    contact: "Book an admissions planning call",
  },
  {
    slug: "inclusive-office-internship",
    kind: "job",
    title: "Inclusive Office Internship",
    organization: "Projonmo Services",
    district: "Sylhet",
    division: "Sylhet",
    deliveryMode: "Hybrid",
    category: "Administration",
    summary: "Six-month paid internship with rotations across operations and communications.",
    description: "A supported internship for early-career candidates who want practical experience in office operations, records management and stakeholder communication.",
    deadline: "5 November 2026",
    salary: "BDT 18,000 monthly stipend",
    accessibility: ["Hybrid schedule", "Workplace mentor", "Accessible interview", "Adjustment planning before start"],
    eligibility: ["Age 18 or above", "Basic office software skills", "Available for six months"],
    contact: "Apply through B-SCAN Connect",
  },
  {
    slug: "career-readiness-clinic",
    kind: "service",
    title: "Career Readiness Clinic",
    organization: "Nobojatra Career Centre",
    district: "Barishal",
    division: "Barishal",
    deliveryMode: "Hybrid",
    category: "Employment support",
    summary: "CV review, interview practice and workplace adjustment planning.",
    description: "Short, practical appointments for jobseekers who want help strengthening a CV, preparing for interviews or discussing reasonable adjustments with an employer.",
    accessibility: ["Video or in-person appointment", "Materials in accessible formats", "Bangla consultation", "Support person welcome"],
    eligibility: ["Open to jobseekers aged 18 or above", "Appointment required"],
    contact: "Request a career support appointment",
  },
];

export const kindLabels: Record<CatalogKind, string> = {
  service: "Support service",
  job: "Job",
  training: "Training",
  education: "Education",
};

export function getCatalogItem(slug: string) {
  return catalogItems.find((item) => item.slug === slug);
}
