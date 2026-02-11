const mongoose = require('mongoose');
const DocumentTemplate = require('../Model/DocumentTemplate');
const Staff = require('../Model/Staff');

// FINAL REVISED: Properly categorized templates
// CLIENT templates = For citizens to use themselves
// LAWYER templates = For lawyers to prepare
// BOTH = Can be used by either

const finalTemplates = [

  // ============================================
  // CLIENT TEMPLATES (Citizens can fill these themselves)
  // ============================================

  // 1. CONSUMER COMPLAINT (Client)
  {
    templateId: 'SL-CLIENT-CONSUMER-001',
    name: 'Consumer Complaint Letter',
    description: 'File complaint with Consumer Affairs Authority for defective products/services',
    category: 'Consumer Rights',
    subcategory: 'Complaints',
    documentType: 'Application',
    intendedFor: 'client',
    fields: [
      {
        fieldName: 'complainantName',
        fieldType: 'text',
        label: 'Your Name',
        required: true,
        order: 1
      },
      {
        fieldName: 'complainantNIC',
        fieldType: 'text',
        label: 'Your NIC',
        required: true,
        order: 2
      },
      {
        fieldName: 'complainantAddress',
        fieldType: 'textarea',
        label: 'Your Address',
        required: true,
        order: 3
      },
      {
        fieldName: 'complainantPhone',
        fieldType: 'text',
        label: 'Your Phone Number',
        required: true,
        order: 4
      },
      {
        fieldName: 'businessName',
        fieldType: 'text',
        label: 'Business/Shop Name',
        required: true,
        order: 5
      },
      {
        fieldName: 'businessAddress',
        fieldType: 'textarea',
        label: 'Business Address',
        required: true,
        order: 6
      },
      {
        fieldName: 'productService',
        fieldType: 'text',
        label: 'Product/Service Purchased',
        required: true,
        order: 7
      },
      {
        fieldName: 'purchaseDate',
        fieldType: 'date',
        label: 'Date of Purchase',
        required: true,
        order: 8
      },
      {
        fieldName: 'amountPaid',
        fieldType: 'number',
        label: 'Amount Paid (LKR)',
        required: true,
        order: 9
      },
      {
        fieldName: 'complaintDetails',
        fieldType: 'textarea',
        label: 'Details of Complaint',
        helpText: 'Explain what went wrong',
        required: true,
        order: 10
      },
      {
        fieldName: 'remedySought',
        fieldType: 'text',
        label: 'What You Want',
        placeholder: 'e.g., Full Refund, Replacement, Compensation',
        required: true,
        order: 11
      }
    ],
    templateContent: `CONSUMER COMPLAINT

TO: THE DIRECTOR GENERAL
    CONSUMER AFFAIRS AUTHORITY
    No. 123, Vauxhall Street,
    Colombo 02


COMPLAINANT DETAILS:
Name: {{complainantName}}
NIC: {{complainantNIC}}
Address: {{complainantAddress}}
Phone: {{complainantPhone}}

BUSINESS/TRADER DETAILS:
Business Name: {{businessName}}
Address: {{businessAddress}}

TRANSACTION DETAILS:
Product/Service: {{productService}}
Date of Purchase: {{purchaseDate}}
Amount Paid: LKR {{amountPaid}}

COMPLAINT:
{{complaintDetails}}

REMEDY SOUGHT:
{{remedySought}}

I declare that the above information is true and correct.

I request the Consumer Affairs Authority to investigate and provide relief.


_____________________________
{{complainantName}}
COMPLAINANT

Date: ______________`,
    courtSpecific: false,
    applicableDistricts: ['All'],
    languages: ['en', 'si'],
    complexity: 'simple',
    estimatedTime: 10,
    requiredDocuments: ['Bill/Invoice', 'NIC Copy'],
    filingFee: 0,
    courtFees: 0,
    isActive: true,
    isPopular: true,
    tags: ['consumer', 'complaint', 'citizen']
  },

  // 2. DRIVING LICENSE DUPLICATE (Client)
  {
    templateId: 'SL-CLIENT-LICENSE-001',
    name: 'Driving License Duplicate Application',
    description: 'Apply for duplicate driving license at DMT',
    category: 'General Legal',
    subcategory: 'Government Services',
    documentType: 'Application',
    intendedFor: 'client',
    fields: [
      {
        fieldName: 'applicantName',
        fieldType: 'text',
        label: 'Full Name',
        required: true,
        order: 1
      },
      {
        fieldName: 'applicantNIC',
        fieldType: 'text',
        label: 'NIC Number',
        required: true,
        order: 2
      },
      {
        fieldName: 'applicantAddress',
        fieldType: 'textarea',
        label: 'Permanent Address',
        required: true,
        order: 3
      },
      {
        fieldName: 'licenseNumber',
        fieldType: 'text',
        label: 'License Number',
        required: true,
        order: 4
      },
      {
        fieldName: 'licenseCategory',
        fieldType: 'dropdown',
        label: 'License Category',
        options: [
          { value: 'B - Motor Car', label: 'B - Motor Car' },
          { value: 'A1 - Light Motorcycle', label: 'A1 - Light Motorcycle' },
          { value: 'A - Heavy Motorcycle', label: 'A - Heavy Motorcycle' },
          { value: 'B1 - Three Wheeler', label: 'B1 - Three Wheeler' },
          { value: 'C1 - Light Vehicle', label: 'C1 - Light Vehicle' }
        ],
        required: true,
        order: 5
      },
      {
        fieldName: 'reason',
        fieldType: 'dropdown',
        label: 'Reason',
        options: [
          { value: 'Lost', label: 'Lost' },
          { value: 'Stolen', label: 'Stolen' },
          { value: 'Damaged', label: 'Damaged' }
        ],
        required: true,
        order: 6
      }
    ],
    templateContent: `APPLICATION FOR DUPLICATE DRIVING LICENSE

TO: THE COMMISSIONER
    DEPARTMENT OF MOTOR TRAFFIC


Full Name: {{applicantName}}
NIC Number: {{applicantNIC}}
Address: {{applicantAddress}}

LICENSE DETAILS:
License Number: {{licenseNumber}}
Category: {{licenseCategory}}
Reason for Duplicate: {{reason}}

DECLARATION:
I declare that the above information is true. I will surrender the original license if found.


_____________________________
{{applicantName}}

Date: ______________`,
    courtSpecific: false,
    applicableDistricts: ['All'],
    languages: ['en', 'si'],
    complexity: 'simple',
    estimatedTime: 8,
    requiredDocuments: ['NIC Copy', 'Police Report (if lost/stolen)'],
    filingFee: 0,
    courtFees: 0,
    isActive: true,
    isPopular: true,
    tags: ['driving-license', 'dmt', 'citizen']
  },

  // 3. MARRIAGE CERTIFICATE (Client)
  {
    templateId: 'SL-CLIENT-MARRIAGE-001',
    name: 'Marriage Certificate Application',
    description: 'Request certified copy of marriage certificate from Registrar',
    category: 'Family Law',
    subcategory: 'Marriage',
    documentType: 'Application',
    intendedFor: 'client',
    fields: [
      {
        fieldName: 'applicantName',
        fieldType: 'text',
        label: 'Your Name',
        required: true,
        order: 1
      },
      {
        fieldName: 'applicantNIC',
        fieldType: 'text',
        label: 'Your NIC',
        required: true,
        order: 2
      },
      {
        fieldName: 'spouseName',
        fieldType: 'text',
        label: 'Spouse Name',
        required: true,
        order: 3
      },
      {
        fieldName: 'marriageDate',
        fieldType: 'date',
        label: 'Marriage Date',
        required: true,
        order: 4
      },
      {
        fieldName: 'marriagePlace',
        fieldType: 'text',
        label: 'Place of Marriage',
        required: true,
        order: 5
      },
      {
        fieldName: 'purpose',
        fieldType: 'text',
        label: 'Purpose',
        placeholder: 'e.g., Passport, Visa, Legal proceedings',
        required: true,
        order: 6
      }
    ],
    templateContent: `APPLICATION FOR MARRIAGE CERTIFICATE

TO: THE REGISTRAR OF MARRIAGES
    {{marriagePlace}}


Name: {{applicantName}}
NIC: {{applicantNIC}}
Spouse: {{spouseName}}
Marriage Date: {{marriageDate}}
Marriage Place: {{marriagePlace}}

Purpose: {{purpose}}

I request a certified copy of my marriage certificate.


_____________________________
{{applicantName}}

Date: ______________`,
    courtSpecific: false,
    applicableDistricts: ['All'],
    languages: ['en', 'si'],
    complexity: 'simple',
    estimatedTime: 5,
    requiredDocuments: ['NIC Copy'],
    filingFee: 0,
    courtFees: 0,
    isActive: true,
    isPopular: true,
    tags: ['marriage', 'certificate', 'citizen']
  },

  // 4. TENANCY AGREEMENT (Client)
  {
    templateId: 'SL-CLIENT-TENANCY-001',
    name: 'Tenancy Agreement',
    description: 'Rental agreement for residential property',
    category: 'Property Law',
    subcategory: 'Tenancy',
    documentType: 'Agreement',
    intendedFor: 'client',
    fields: [
      {
        fieldName: 'landlordName',
        fieldType: 'text',
        label: 'Landlord Name',
        required: true,
        order: 1
      },
      {
        fieldName: 'landlordNIC',
        fieldType: 'text',
        label: 'Landlord NIC',
        required: true,
        order: 2
      },
      {
        fieldName: 'tenantName',
        fieldType: 'text',
        label: 'Tenant Name',
        required: true,
        order: 3
      },
      {
        fieldName: 'tenantNIC',
        fieldType: 'text',
        label: 'Tenant NIC',
        required: true,
        order: 4
      },
      {
        fieldName: 'propertyAddress',
        fieldType: 'textarea',
        label: 'Property Address',
        required: true,
        order: 5
      },
      {
        fieldName: 'monthlyRent',
        fieldType: 'number',
        label: 'Monthly Rent (LKR)',
        required: true,
        order: 6
      },
      {
        fieldName: 'deposit',
        fieldType: 'number',
        label: 'Security Deposit (LKR)',
        required: true,
        order: 7
      },
      {
        fieldName: 'startDate',
        fieldType: 'date',
        label: 'Start Date',
        required: true,
        order: 8
      }
    ],
    templateContent: `TENANCY AGREEMENT

LANDLORD: {{landlordName}} (NIC: {{landlordNIC}})
TENANT: {{tenantName}} (NIC: {{tenantNIC}})

PROPERTY: {{propertyAddress}}

TERMS:
Monthly Rent: LKR {{monthlyRent}}
Security Deposit: LKR {{deposit}}
Start Date: {{startDate}}

The Tenant agrees to:
1. Pay rent on or before 5th of each month
2. Maintain the property in good condition
3. Not sublet without permission
4. Give 1 month notice before vacating

The Landlord agrees to:
1. Provide peaceful occupation
2. Maintain basic facilities
3. Return deposit after inspection


_____________________________     _____________________________
{{landlordName}}                   {{tenantName}}
LANDLORD                           TENANT

Date: ______________`,
    courtSpecific: false,
    applicableDistricts: ['All'],
    languages: ['en', 'si'],
    complexity: 'simple',
    estimatedTime: 10,
    requiredDocuments: ['NIC Copies'],
    filingFee: 0,
    courtFees: 0,
    isActive: true,
    isPopular: true,
    tags: ['rent', 'tenancy', 'citizen']
  },

  // 5. GENERAL AFFIDAVIT (Client - No court details needed!)
  {
    templateId: 'SL-CLIENT-AFFIDAVIT-001',
    name: 'General Affidavit',
    description: 'Make a sworn statement for any purpose (banks, government offices, etc.)',
    category: 'General Legal',
    subcategory: 'Sworn Statements',
    documentType: 'Affidavit',
    intendedFor: 'client',
    fields: [
      {
        fieldName: 'deponentName',
        fieldType: 'text',
        label: 'Your Name',
        required: true,
        order: 1
      },
      {
        fieldName: 'deponentNIC',
        fieldType: 'text',
        label: 'Your NIC',
        required: true,
        order: 2
      },
      {
        fieldName: 'deponentAddress',
        fieldType: 'textarea',
        label: 'Your Address',
        required: true,
        order: 3
      },
      {
        fieldName: 'affidavitPurpose',
        fieldType: 'text',
        label: 'Purpose of Affidavit',
        placeholder: 'e.g., Bank loan, Name correction, Address proof',
        required: true,
        order: 4
      },
      {
        fieldName: 'statementContent',
        fieldType: 'textarea',
        label: 'Your Statement',
        helpText: 'Write what you need to declare (in your own words)',
        required: true,
        order: 5
      },
      {
        fieldName: 'swornDate',
        fieldType: 'date',
        label: 'Date',
        required: true,
        order: 6
      }
    ],
    templateContent: `AFFIDAVIT


I, {{deponentName}}, bearing NIC No: {{deponentNIC}}, residing at {{deponentAddress}}, do solemnly and sincerely declare as follows:

PURPOSE: {{affidavitPurpose}}

STATEMENT:

{{statementContent}}


I make this declaration conscientiously believing it to be true and correct.


_____________________________
{{deponentName}}

Dated: {{swornDate}}


TO BE ATTESTED BY JUSTICE OF THE PEACE OR NOTARY PUBLIC:

Sworn before me this {{swornDate}}

_____________________________
Justice of the Peace / Notary Public
Name:
Registration No:`,
    courtSpecific: false,
    applicableDistricts: ['All'],
    languages: ['en', 'si'],
    complexity: 'simple',
    estimatedTime: 8,
    requiredDocuments: ['NIC Copy'],
    filingFee: 0,
    courtFees: 0,
    isActive: true,
    isPopular: true,
    tags: ['affidavit', 'sworn', 'citizen', 'general']
  },

  // 6. POWER OF ATTORNEY (Client)
  {
    templateId: 'SL-CLIENT-POA-001',
    name: 'Power of Attorney',
    description: 'Authorize someone to act on your behalf',
    category: 'General Legal',
    subcategory: 'Authorization',
    documentType: 'Deed',
    intendedFor: 'client',
    fields: [
      {
        fieldName: 'principalName',
        fieldType: 'text',
        label: 'Your Name',
        required: true,
        order: 1
      },
      {
        fieldName: 'principalNIC',
        fieldType: 'text',
        label: 'Your NIC',
        required: true,
        order: 2
      },
      {
        fieldName: 'principalAddress',
        fieldType: 'textarea',
        label: 'Your Address',
        required: true,
        order: 3
      },
      {
        fieldName: 'attorneyName',
        fieldType: 'text',
        label: 'Person You Are Authorizing',
        required: true,
        order: 4
      },
      {
        fieldName: 'attorneyNIC',
        fieldType: 'text',
        label: 'Their NIC',
        required: true,
        order: 5
      },
      {
        fieldName: 'powers',
        fieldType: 'textarea',
        label: 'What Can They Do?',
        placeholder: 'e.g., Sign documents, collect payments, handle property matters',
        required: true,
        order: 6
      }
    ],
    templateContent: `POWER OF ATTORNEY


I, {{principalName}} (NIC: {{principalNIC}})
of {{principalAddress}}

AUTHORIZE {{attorneyName}} (NIC: {{attorneyNIC}})

TO ACT ON MY BEHALF FOR:

{{powers}}

This Power of Attorney is valid until revoked by me in writing.


_____________________________
{{principalName}}

Date: ______________

WITNESSES:
1. ________________  2. ________________


ATTESTED BY NOTARY:
_____________________________
Date: ______________`,
    courtSpecific: false,
    applicableDistricts: ['All'],
    languages: ['en', 'si'],
    complexity: 'simple',
    estimatedTime: 10,
    requiredDocuments: ['NIC Copies'],
    filingFee: 0,
    courtFees: 0,
    isActive: true,
    isPopular: true,
    tags: ['power-of-attorney', 'authorization', 'citizen']
  },

  // ============================================
  // LAWYER TEMPLATES (For lawyers to prepare)
  // ============================================

  // 7. PLAINT - District Court (Lawyer)
  {
    templateId: 'SL-LAWYER-PLAINT-001',
    name: 'Plaint - District Court Civil Case',
    description: 'Official court plaint for civil litigation - Lawyer prepared',
    category: 'Court Filing',
    subcategory: 'Civil Litigation',
    documentType: 'Plaint',
    intendedFor: 'lawyer',
    fields: [
      {
        fieldName: 'district',
        fieldType: 'dropdown',
        label: 'District',
        options: [
          { value: 'Colombo', label: 'Colombo' },
          { value: 'Gampaha', label: 'Gampaha' },
          { value: 'Kandy', label: 'Kandy' },
          { value: 'Galle', label: 'Galle' }
        ],
        required: true,
        order: 1
      },
      {
        fieldName: 'plaintiffName',
        fieldType: 'text',
        label: 'Plaintiff Name',
        required: true,
        order: 2
      },
      {
        fieldName: 'plaintiffNIC',
        fieldType: 'text',
        label: 'Plaintiff NIC',
        required: true,
        order: 3
      },
      {
        fieldName: 'plaintiffAddress',
        fieldType: 'textarea',
        label: 'Plaintiff Address',
        required: true,
        order: 4
      },
      {
        fieldName: 'defendantName',
        fieldType: 'text',
        label: 'Defendant Name',
        required: true,
        order: 5
      },
      {
        fieldName: 'defendantNIC',
        fieldType: 'text',
        label: 'Defendant NIC',
        required: true,
        order: 6
      },
      {
        fieldName: 'defendantAddress',
        fieldType: 'textarea',
        label: 'Defendant Address',
        required: true,
        order: 7
      },
      {
        fieldName: 'causeOfAction',
        fieldType: 'textarea',
        label: 'Cause of Action',
        required: true,
        order: 8
      },
      {
        fieldName: 'reliefSought',
        fieldType: 'textarea',
        label: 'Relief Sought',
        required: true,
        order: 9
      },
      {
        fieldName: 'caseValue',
        fieldType: 'number',
        label: 'Claim Value (LKR)',
        required: true,
        order: 10
      }
    ],
    templateContent: `IN THE DISTRICT COURT OF {{district}}

PLAINT

BETWEEN

{{plaintiffName}}
NIC No: {{plaintiffNIC}}
of {{plaintiffAddress}}
                                    PLAINTIFF

-AND-

{{defendantName}}
NIC No: {{defendantNIC}}
of {{defendantAddress}}
                                    DEFENDANT


TO THE HONOURABLE COURT,

The Plaintiff respectfully states:

1. The Plaintiff is a citizen of Sri Lanka residing at the address above.

2. CAUSE OF ACTION:
{{causeOfAction}}

3. RELIEF SOUGHT:
{{reliefSought}}

4. The value of the claim is LKR {{caseValue}}.

5. The Plaintiff prays for costs.


_____________________________
Attorney-at-Law
Attorney for the Plaintiff

Date: ______________`,
    courtSpecific: true,
    applicableDistricts: ['All'],
    languages: ['en', 'si'],
    complexity: 'intermediate',
    estimatedTime: 25,
    requiredDocuments: ['NIC Copies', 'Evidence'],
    filingFee: 0,
    courtFees: 0,
    isActive: true,
    isPopular: true,
    tags: ['plaint', 'court', 'lawyer', 'civil']
  },

  // ============================================
  // BOTH (Client AND Lawyer can use)
  // ============================================

  // 8. CASE DETAILS FOR HEARING (Both - Most Important!)
  {
    templateId: 'SL-BOTH-HEARING-001',
    name: 'Case Details for Court Hearing',
    description: 'Complete case summary to take to court hearing - REQUIRED DOCUMENT',
    category: 'Court Filing',
    subcategory: 'Hearing Documents',
    documentType: 'Statement',
    intendedFor: 'both',
    fields: [
      {
        fieldName: 'caseNumber',
        fieldType: 'text',
        label: 'Case Number',
        required: true,
        order: 1
      },
      {
        fieldName: 'district',
        fieldType: 'text',
        label: 'District',
        required: true,
        order: 2
      },
      {
        fieldName: 'hearingDate',
        fieldType: 'date',
        label: 'Hearing Date',
        required: true,
        order: 3
      },
      {
        fieldName: 'hearingTime',
        fieldType: 'text',
        label: 'Hearing Time',
        required: true,
        order: 4
      },
      {
        fieldName: 'plaintiffName',
        fieldType: 'text',
        label: 'Plaintiff Name',
        required: true,
        order: 5
      },
      {
        fieldName: 'defendantName',
        fieldType: 'text',
        label: 'Defendant Name',
        required: true,
        order: 6
      },
      {
        fieldName: 'caseType',
        fieldType: 'dropdown',
        label: 'Case Type',
        options: [
          { value: 'Small Claims Dispute', label: 'Small Claims Dispute' },
          { value: 'Land/Property Dispute', label: 'Land/Property Dispute' },
          { value: 'Tenancy/Rent Dispute', label: 'Tenancy/Rent Dispute' },
          { value: 'Family Matter', label: 'Family Matter' },
          { value: 'Consumer Rights', label: 'Consumer Rights' }
        ],
        required: true,
        order: 7
      },
      {
        fieldName: 'caseDescription',
        fieldType: 'textarea',
        label: 'Case Description',
        required: true,
        order: 8
      },
      {
        fieldName: 'reliefSought',
        fieldType: 'textarea',
        label: 'Relief Sought',
        required: true,
        order: 9
      },
      {
        fieldName: 'caseValue',
        fieldType: 'number',
        label: 'Claim Value (LKR)',
        required: true,
        order: 10
      }
    ],
    templateContent: `DISTRICT COURT OF {{district}}
CASE NO: {{caseNumber}}

CASE SUMMARY FOR HEARING

Hearing Date: {{hearingDate}}
Hearing Time: {{hearingTime}}

PARTIES:
Plaintiff: {{plaintiffName}}
Defendant: {{defendantName}}

CASE TYPE: {{caseType}}

FACTS:
{{caseDescription}}

RELIEF SOUGHT:
{{reliefSought}}

CLAIM VALUE: LKR {{caseValue}}


Prepared for Court Hearing


_____________________________
{{plaintiffName}}
PLAINTIFF

Date: {{hearingDate}}`,
    courtSpecific: true,
    applicableDistricts: ['All'],
    languages: ['en', 'si'],
    complexity: 'simple',
    estimatedTime: 15,
    requiredDocuments: ['Case file', 'Evidence'],
    filingFee: 0,
    courtFees: 0,
    isActive: true,
    isPopular: true,
    tags: ['hearing', 'court', 'both']
  },

  // 9. SMALL CLAIMS (Both)
  {
    templateId: 'SL-BOTH-SMALLCLAIMS-001',
    name: 'Small Claims Application',
    description: 'For claims under LKR 100,000 - Citizens can file themselves',
    category: 'Court Filing',
    subcategory: 'Small Claims',
    documentType: 'Application',
    intendedFor: 'both',
    fields: [
      {
        fieldName: 'claimantName',
        fieldType: 'text',
        label: 'Your Name',
        required: true,
        order: 1
      },
      {
        fieldName: 'claimantNIC',
        fieldType: 'text',
        label: 'Your NIC',
        required: true,
        order: 2
      },
      {
        fieldName: 'claimantAddress',
        fieldType: 'textarea',
        label: 'Your Address',
        required: true,
        order: 3
      },
      {
        fieldName: 'respondentName',
        fieldType: 'text',
        label: 'Other Party Name',
        required: true,
        order: 4
      },
      {
        fieldName: 'respondentAddress',
        fieldType: 'textarea',
        label: 'Other Party Address',
        required: true,
        order: 5
      },
      {
        fieldName: 'claimAmount',
        fieldType: 'number',
        label: 'Amount Claimed (LKR)',
        required: true,
        order: 6
      },
      {
        fieldName: 'claimReason',
        fieldType: 'textarea',
        label: 'Why Are You Claiming?',
        required: true,
        order: 7
      }
    ],
    templateContent: `SMALL CLAIMS APPLICATION

TO: THE MAGISTRATE'S COURT

CLAIMANT: {{claimantName}} (NIC: {{claimantNIC}})
Address: {{claimantAddress}}

RESPONDENT: {{respondentName}}
Address: {{respondentAddress}}

CLAIM: LKR {{claimAmount}}

REASON:
{{claimReason}}

I request the court to order the respondent to pay this amount.


_____________________________
{{claimantName}}

Date: ______________`,
    courtSpecific: true,
    applicableDistricts: ['All'],
    languages: ['en', 'si'],
    complexity: 'simple',
    estimatedTime: 10,
    requiredDocuments: ['NIC Copy', 'Evidence'],
    filingFee: 0,
    courtFees: 0,
    isActive: true,
    isPopular: true,
    tags: ['small-claims', 'both']
  },

  // 10. LAND DEED APPLICATION (Both)
  {
    templateId: 'SL-BOTH-LANDDEED-001',
    name: 'Land Deed Transfer Application',
    description: 'Apply for land/property deed transfer at Land Registry',
    category: 'Property Law',
    subcategory: 'Land Transfer',
    documentType: 'Application',
    intendedFor: 'both',
    fields: [
      {
        fieldName: 'applicantName',
        fieldType: 'text',
        label: 'Your Name',
        required: true,
        order: 1
      },
      {
        fieldName: 'applicantNIC',
        fieldType: 'text',
        label: 'Your NIC',
        required: true,
        order: 2
      },
      {
        fieldName: 'propertyAddress',
        fieldType: 'textarea',
        label: 'Property Address',
        required: true,
        order: 3
      },
      {
        fieldName: 'deedNumber',
        fieldType: 'text',
        label: 'Deed Number',
        required: true,
        order: 4
      },
      {
        fieldName: 'transferTo',
        fieldType: 'text',
        label: 'Transfer To (Name)',
        required: true,
        order: 5
      },
      {
        fieldName: 'transferReason',
        fieldType: 'dropdown',
        label: 'Reason',
        options: [
          { value: 'Sale', label: 'Sale' },
          { value: 'Gift', label: 'Gift' },
          { value: 'Inheritance', label: 'Inheritance' }
        ],
        required: true,
        order: 6
      }
    ],
    templateContent: `LAND DEED TRANSFER APPLICATION

TO: THE REGISTRAR OF LANDS


APPLICANT: {{applicantName}} (NIC: {{applicantNIC}})

PROPERTY: {{propertyAddress}}
Deed No: {{deedNumber}}

TRANSFER TO: {{transferTo}}
REASON: {{transferReason}}

I request registration of deed transfer.


_____________________________
{{applicantName}}

Date: ______________`,
    courtSpecific: false,
    applicableDistricts: ['All'],
    languages: ['en', 'si'],
    complexity: 'simple',
    estimatedTime: 12,
    requiredDocuments: ['Original Deed', 'NIC Copies'],
    filingFee: 0,
    courtFees: 0,
    isActive: true,
    isPopular: true,
    tags: ['land', 'deed', 'both']
  }
];

// Setup function
const setupFinalTemplates = async () => {
  try {
    console.log('🇱🇰 FINAL TEMPLATE SETUP');
    console.log('==================================================');
    console.log('✅ CLIENT templates: For citizens to use themselves');
    console.log('✅ LAWYER templates: For lawyers to prepare');
    console.log('✅ BOTH templates: Can be used by either');
    console.log('✅ All FREE (no fees)');
    console.log('✅ Proper legal PDF formatting');
    console.log('✅ Government/court accepted formats\n');
    
    const admin = await Staff.findOne({ role: 'admin' });
    if (!admin) {
      console.log('❌ No admin found');
      return;
    }

    // Deactivate old templates
    await DocumentTemplate.updateMany({}, { $set: { isActive: false } });

    let created = 0;
    for (const template of finalTemplates) {
      try {
        const exists = await DocumentTemplate.findOne({ templateId: template.templateId });
        if (exists) {
          await DocumentTemplate.findByIdAndUpdate(exists._id, {
            ...template,
            createdBy: admin._id,
            lastModifiedBy: admin._id
          });
        } else {
          await new DocumentTemplate({
            ...template,
            createdBy: admin._id
          }).save();
          created++;
        }
        
        const icon = template.intendedFor === 'client' ? '👤' : 
                     template.intendedFor === 'lawyer' ? '⚖️' : '👥';
        console.log(`${icon} ${template.name} (${template.intendedFor})`);
      } catch (error) {
        console.error(`❌ ${template.name}:`, error.message);
      }
    }

    const clientCount = await DocumentTemplate.countDocuments({ intendedFor: 'client', isActive: true });
    const lawyerCount = await DocumentTemplate.countDocuments({ intendedFor: 'lawyer', isActive: true });
    const bothCount = await DocumentTemplate.countDocuments({ intendedFor: 'both', isActive: true });

    console.log('\n📊 SUMMARY:');
    console.log('   CLIENT templates: ' + clientCount);
    console.log('   LAWYER templates: ' + lawyerCount);
    console.log('   BOTH templates: ' + bothCount);
    console.log('   TOTAL: ' + (clientCount + lawyerCount + bothCount));

  } catch (error) {
    console.error('❌ Setup error:', error);
  }
};

module.exports = { setupFinalTemplates, finalTemplates };
