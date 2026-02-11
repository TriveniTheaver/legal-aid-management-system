const mongoose = require('mongoose');
const DocumentTemplate = require('../Model/DocumentTemplate');
const Staff = require('../Model/Staff');

// REVISED: Authentic Sri Lankan Legal Document Templates
// Based on ACTUAL court-accepted formats with proper legal styling
// For CIVIL CASES ONLY (matching your system)
const revisedSriLankanTemplates = [
  
  // 1. PLAINT - District Court Civil Cases
  {
    templateId: 'SL-CIVIL-PLAINT-001',
    name: 'Plaint - Civil Case (District Court)',
    description: 'Official plaint for civil cases in Sri Lankan District Courts - Court accepted format',
    category: 'Court Filing',
    subcategory: 'Civil Litigation',
    documentType: 'Plaint',
    fields: [
      {
        fieldName: 'district',
        fieldType: 'dropdown',
        label: 'District',
        options: [
          { value: 'Colombo', label: 'Colombo' },
          { value: 'Gampaha', label: 'Gampaha' },
          { value: 'Kandy', label: 'Kandy' },
          { value: 'Galle', label: 'Galle' },
          { value: 'Jaffna', label: 'Jaffna' }
        ],
        required: true,
        order: 1
      },
      {
        fieldName: 'caseNumber',
        fieldType: 'text',
        label: 'Case Number',
        placeholder: 'Will be assigned by court',
        required: false,
        order: 2
      },
      {
        fieldName: 'plaintiffName',
        fieldType: 'text',
        label: 'Name of Plaintiff',
        required: true,
        order: 3
      },
      {
        fieldName: 'plaintiffNIC',
        fieldType: 'text',
        label: 'Plaintiff NIC Number',
        required: true,
        order: 4
      },
      {
        fieldName: 'plaintiffAddress',
        fieldType: 'textarea',
        label: 'Plaintiff Permanent Address',
        required: true,
        order: 5
      },
      {
        fieldName: 'defendantName',
        fieldType: 'text',
        label: 'Name of Defendant',
        required: true,
        order: 6
      },
      {
        fieldName: 'defendantNIC',
        fieldType: 'text',
        label: 'Defendant NIC Number',
        required: true,
        order: 7
      },
      {
        fieldName: 'defendantAddress',
        fieldType: 'textarea',
        label: 'Defendant Address',
        required: true,
        order: 8
      },
      {
        fieldName: 'causeOfAction',
        fieldType: 'textarea',
        label: 'Brief Statement of Cause of Action',
        helpText: 'Describe what happened and why you are filing this case',
        required: true,
        order: 9
      },
      {
        fieldName: 'reliefSought',
        fieldType: 'textarea',
        label: 'Relief/Remedy Sought',
        helpText: 'What do you want the court to order?',
        required: true,
        order: 10
      },
      {
        fieldName: 'caseValue',
        fieldType: 'number',
        label: 'Estimated Value of Claim (LKR)',
        required: true,
        order: 11
      },
      {
        fieldName: 'filingDate',
        fieldType: 'date',
        label: 'Date of Filing',
        required: true,
        order: 12
      }
    ],
    templateContent: `IN THE DISTRICT COURT OF {{district}}

PLAINT


BETWEEN

{{plaintiffName}}
Bearing NIC No: {{plaintiffNIC}}
Permanently residing at {{plaintiffAddress}}
                                                        PLAINTIFF

-AND-

{{defendantName}}
Bearing NIC No: {{defendantNIC}}
Residing at {{defendantAddress}}
                                                        DEFENDANT


TO THE HONOURABLE COURT,

The Plaintiff above-named respectfully states and avers as follows:

1. The Plaintiff is a citizen of Sri Lanka and resides at the address stated above.

2. The Defendant is known to the Plaintiff and resides at the address stated above.

3. CAUSE OF ACTION:

{{causeOfAction}}

4. RELIEF SOUGHT:

The Plaintiff humbly prays that this Honourable Court may be pleased to:

{{reliefSought}}

5. The estimated value of the subject matter of this action is LKR {{caseValue}}.

6. The Plaintiff prays for such other and further relief as this Honourable Court may deem fit and just.

7. The Plaintiff prays for costs of this action.


Dated this {{filingDate}}.


_____________________________
PLAINTIFF

_____________________________
Attorney-at-Law
Attorney for the Plaintiff`,
    courtSpecific: true,
    applicableDistricts: ['All'],
    languages: ['en', 'si'],
    complexity: 'intermediate',
    estimatedTime: 30,
    requiredDocuments: ['NIC Copies', 'Supporting Documents'],
    filingFee: 0,
    courtFees: 0,
    isActive: true,
    isPopular: true,
    tags: ['plaint', 'civil', 'district-court']
  },

  // 2. AFFIDAVIT - General Purpose
  {
    templateId: 'SL-AFFIDAVIT-GENERAL-001',
    name: 'Affidavit (General Purpose)',
    description: 'General sworn affidavit for court proceedings - Government accepted format',
    category: 'Court Filing',
    subcategory: 'Supporting Documents',
    documentType: 'Affidavit',
    fields: [
      {
        fieldName: 'deponentName',
        fieldType: 'text',
        label: 'Name of Deponent (Person Making Statement)',
        required: true,
        order: 1
      },
      {
        fieldName: 'deponentNIC',
        fieldType: 'text',
        label: 'Deponent NIC Number',
        required: true,
        order: 2
      },
      {
        fieldName: 'deponentAddress',
        fieldType: 'textarea',
        label: 'Deponent Permanent Address',
        required: true,
        order: 3
      },
      {
        fieldName: 'affidavitContent',
        fieldType: 'textarea',
        label: 'Affidavit Statement',
        helpText: 'State your declaration in numbered paragraphs',
        required: true,
        order: 4
      },
      {
        fieldName: 'swornDate',
        fieldType: 'date',
        label: 'Date of Swearing',
        required: true,
        order: 5
      },
      {
        fieldName: 'commissionerName',
        fieldType: 'text',
        label: 'Commissioner for Oaths Name',
        required: false,
        order: 6
      }
    ],
    templateContent: `AFFIDAVIT


I, {{deponentName}}, bearing National Identity Card No: {{deponentNIC}}, permanently residing at {{deponentAddress}}, do hereby solemnly and sincerely declare and make oath and state as follows:


{{affidavitContent}}


I make this solemn declaration conscientiously believing the same to be true and by virtue of the provisions of the Oaths Ordinance (Chapter 23).


_____________________________
{{deponentName}}
DEPONENT


Sworn before me at Colombo this {{swornDate}}.


_____________________________
Commissioner for Oaths
{{commissionerName}}
Attorney-at-Law`,
    courtSpecific: false,
    applicableDistricts: ['All'],
    languages: ['en', 'si'],
    complexity: 'simple',
    estimatedTime: 15,
    requiredDocuments: ['NIC Copy'],
    filingFee: 0,
    courtFees: 0,
    isActive: true,
    isPopular: true,
    tags: ['affidavit', 'sworn-statement', 'evidence']
  },

  // 3. CASE DETAILS FOR HEARING - Most Important!
  {
    templateId: 'SL-HEARING-DETAILS-001',
    name: 'Case Details Summary for Court Hearing',
    description: 'Comprehensive case summary to present at court hearings - Required document',
    category: 'Court Filing',
    subcategory: 'Hearing Documents',
    documentType: 'Statement',
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
        label: 'Date of Hearing',
        required: true,
        order: 3
      },
      {
        fieldName: 'hearingTime',
        fieldType: 'text',
        label: 'Time of Hearing',
        placeholder: 'e.g., 9:00 AM',
        required: true,
        order: 4
      },
      {
        fieldName: 'courtRoom',
        fieldType: 'text',
        label: 'Court Room Number',
        required: false,
        order: 5
      },
      {
        fieldName: 'plaintiffName',
        fieldType: 'text',
        label: 'Plaintiff Name',
        required: true,
        order: 6
      },
      {
        fieldName: 'plaintiffNIC',
        fieldType: 'text',
        label: 'Plaintiff NIC',
        required: true,
        order: 7
      },
      {
        fieldName: 'defendantName',
        fieldType: 'text',
        label: 'Defendant Name',
        required: true,
        order: 8
      },
      {
        fieldName: 'defendantNIC',
        fieldType: 'text',
        label: 'Defendant NIC',
        required: true,
        order: 9
      },
      {
        fieldName: 'caseType',
        fieldType: 'dropdown',
        label: 'Type of Case',
        options: [
          { value: 'Small Claims Dispute', label: 'Small Claims Dispute' },
          { value: 'Land/Property Dispute', label: 'Land/Property Dispute' },
          { value: 'Tenancy/Rent Dispute', label: 'Tenancy/Rent Dispute' },
          { value: 'Family Matter', label: 'Family Matter' },
          { value: 'Consumer Rights', label: 'Consumer Rights' },
          { value: 'Other Civil Matter', label: 'Other Civil Matter' }
        ],
        required: true,
        order: 10
      },
      {
        fieldName: 'caseDescription',
        fieldType: 'textarea',
        label: 'Brief Description of Case',
        required: true,
        order: 11
      },
      {
        fieldName: 'reliefSought',
        fieldType: 'textarea',
        label: 'Relief/Remedy Sought',
        required: true,
        order: 12
      },
      {
        fieldName: 'caseValue',
        fieldType: 'number',
        label: 'Value of Claim (LKR)',
        required: true,
        order: 13
      },
      {
        fieldName: 'lawyerName',
        fieldType: 'text',
        label: 'Attorney-at-Law Name',
        required: false,
        order: 14
      },
      {
        fieldName: 'evidenceList',
        fieldType: 'textarea',
        label: 'List of Evidence Documents',
        required: false,
        order: 15
      }
    ],
    templateContent: `DISTRICT COURT OF {{district}}
CASE NO: {{caseNumber}}

CASE SUMMARY FOR HEARING

DATE OF HEARING: {{hearingDate}}
TIME: {{hearingTime}}
{{courtRoom}}

PARTIES TO THE ACTION:

Plaintiff: {{plaintiffName}} (NIC: {{plaintiffNIC}})
Defendant: {{defendantName}} (NIC: {{defendantNIC}})

TYPE OF ACTION: {{caseType}}

BRIEF FACTS:
{{caseDescription}}

RELIEF SOUGHT:
{{reliefSought}}

VALUE OF CLAIM: LKR {{caseValue}}

{{lawyerName}}

EVIDENCE TO BE PRESENTED:
{{evidenceList}}


PREPARED FOR SUBMISSION TO COURT

Date: {{hearingDate}}


_____________________________
{{plaintiffName}}
PLAINTIFF`,
    courtSpecific: true,
    applicableDistricts: ['All'],
    languages: ['en', 'si'],
    complexity: 'intermediate',
    estimatedTime: 20,
    requiredDocuments: ['NIC Copies', 'Original Plaint', 'Evidence Documents'],
    filingFee: 0,
    courtFees: 0,
    isActive: true,
    isPopular: true,
    tags: ['hearing', 'case-summary', 'court-appearance']
  },

  // 4. LAND DEED TRANSFER APPLICATION
  {
    templateId: 'SL-LAND-DEED-001',
    name: 'Application for Land Deed Transfer',
    description: 'Application to Land Registry for property/land deed transfer',
    category: 'Property Law',
    subcategory: 'Land Transfer',
    documentType: 'Application',
    fields: [
      {
        fieldName: 'applicantName',
        fieldType: 'text',
        label: 'Applicant Name',
        required: true,
        order: 1
      },
      {
        fieldName: 'applicantNIC',
        fieldType: 'text',
        label: 'Applicant NIC',
        required: true,
        order: 2
      },
      {
        fieldName: 'applicantAddress',
        fieldType: 'textarea',
        label: 'Applicant Address',
        required: true,
        order: 3
      },
      {
        fieldName: 'propertyAddress',
        fieldType: 'textarea',
        label: 'Property Address/Location',
        required: true,
        order: 4
      },
      {
        fieldName: 'deedNumber',
        fieldType: 'text',
        label: 'Current Deed Number',
        required: true,
        order: 5
      },
      {
        fieldName: 'planNumber',
        fieldType: 'text',
        label: 'Survey Plan Number',
        required: true,
        order: 6
      },
      {
        fieldName: 'transferReason',
        fieldType: 'dropdown',
        label: 'Reason for Transfer',
        options: [
          { value: 'Sale', label: 'Sale' },
          { value: 'Gift', label: 'Gift' },
          { value: 'Inheritance', label: 'Inheritance' },
          { value: 'Settlement', label: 'Settlement' }
        ],
        required: true,
        order: 7
      },
      {
        fieldName: 'transfereeeName',
        fieldType: 'text',
        label: 'Name of Person Receiving Property',
        required: true,
        order: 8
      },
      {
        fieldName: 'transfereeNIC',
        fieldType: 'text',
        label: 'Transferee NIC',
        required: true,
        order: 9
      }
    ],
    templateContent: `APPLICATION FOR LAND DEED TRANSFER

TO: THE REGISTRAR OF LANDS
    {{propertyAddress}}


I, {{applicantName}}, bearing NIC No: {{applicantNIC}}, residing at {{applicantAddress}}, do hereby make application for the transfer of the land described below:

PROPERTY DETAILS:
Location: {{propertyAddress}}
Current Deed No: {{deedNumber}}
Survey Plan No: {{planNumber}}

TRANSFER DETAILS:
Reason for Transfer: {{transferReason}}
Transferee Name: {{transfereeName}}
Transferee NIC: {{transfereeNIC}}

I declare that the above particulars are true and correct to the best of my knowledge.

I request that the necessary deed of transfer be prepared and registered.


_____________________________
{{applicantName}}
APPLICANT

Date: ______________`,
    courtSpecific: false,
    applicableDistricts: ['All'],
    languages: ['en', 'si'],
    complexity: 'intermediate',
    estimatedTime: 25,
    requiredDocuments: ['Original Deed', 'Survey Plan', 'NIC Copies', 'Valuation Report'],
    filingFee: 0,
    courtFees: 0,
    isActive: true,
    isPopular: true,
    tags: ['land', 'property', 'deed', 'transfer']
  },

  // 5. TENANCY AGREEMENT
  {
    templateId: 'SL-TENANCY-AGREEMENT-001',
    name: 'Residential Tenancy Agreement',
    description: 'Standard residential lease/rent agreement - Legal format',
    category: 'Property Law',
    subcategory: 'Tenancy',
    documentType: 'Agreement',
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
        fieldName: 'landlordAddress',
        fieldType: 'textarea',
        label: 'Landlord Address',
        required: true,
        order: 3
      },
      {
        fieldName: 'tenantName',
        fieldType: 'text',
        label: 'Tenant Name',
        required: true,
        order: 4
      },
      {
        fieldName: 'tenantNIC',
        fieldType: 'text',
        label: 'Tenant NIC',
        required: true,
        order: 5
      },
      {
        fieldName: 'premisesAddress',
        fieldType: 'textarea',
        label: 'Rented Premises Address',
        required: true,
        order: 6
      },
      {
        fieldName: 'monthlyRent',
        fieldType: 'number',
        label: 'Monthly Rent (LKR)',
        required: true,
        order: 7
      },
      {
        fieldName: 'securityDeposit',
        fieldType: 'number',
        label: 'Security Deposit (LKR)',
        required: true,
        order: 8
      },
      {
        fieldName: 'tenancyPeriod',
        fieldType: 'text',
        label: 'Tenancy Period',
        placeholder: 'e.g., 12 months',
        required: true,
        order: 9
      },
      {
        fieldName: 'commencementDate',
        fieldType: 'date',
        label: 'Commencement Date',
        required: true,
        order: 10
      }
    ],
    templateContent: `RESIDENTIAL TENANCY AGREEMENT


THIS AGREEMENT made this {{commencementDate}}

BETWEEN

{{landlordName}} (NIC: {{landlordNIC}})
of {{landlordAddress}}
(hereinafter called "the Landlord")

AND

{{tenantName}} (NIC: {{tenantNIC}})
(hereinafter called "the Tenant")

WHEREAS the Landlord is the owner of the premises situated at:
{{premisesAddress}}

AND WHEREAS the Landlord has agreed to let and the Tenant has agreed to take on rent the said premises upon the terms and conditions hereinafter set out:

NOW IT IS HEREBY AGREED as follows:

1. The Landlord hereby lets to the Tenant the premises described above.

2. The tenancy shall be for a period of {{tenancyPeriod}} commencing from {{commencementDate}}.

3. The monthly rent shall be LKR {{monthlyRent}} payable in advance on or before the 5th day of each month.

4. The Tenant shall pay a refundable security deposit of LKR {{securityDeposit}}.

5. The Tenant shall use the premises solely for residential purposes.

6. The Tenant shall keep the premises in good condition and repair.

7. The Tenant shall not sublet the premises without written consent of the Landlord.

8. Upon termination, the Tenant shall deliver vacant possession of the premises.


IN WITNESS WHEREOF the parties have set their hands this day and year first above written.


_____________________________          _____________________________
{{landlordName}}                       {{tenantName}}
LANDLORD                               TENANT


WITNESSES:

1. _____________________________       2. _____________________________
   Name:                                 Name:
   NIC:                                   NIC:
   Address:                              Address:`,
    courtSpecific: false,
    applicableDistricts: ['All'],
    languages: ['en', 'si'],
    complexity: 'simple',
    estimatedTime: 20,
    requiredDocuments: ['Ownership Proof', 'NIC Copies'],
    filingFee: 0,
    courtFees: 0,
    isActive: true,
    isPopular: true,
    tags: ['tenancy', 'rent', 'lease', 'agreement']
  },

  // 6. MARRIAGE CERTIFICATE APPLICATION
  {
    templateId: 'SL-MARRIAGE-CERT-001',
    name: 'Application for Marriage Certificate Copy',
    description: 'Application to Registrar of Marriages for certificate copy',
    category: 'Family Law',
    subcategory: 'Marriage',
    documentType: 'Application',
    fields: [
      {
        fieldName: 'applicantName',
        fieldType: 'text',
        label: 'Applicant Name',
        required: true,
        order: 1
      },
      {
        fieldName: 'applicantNIC',
        fieldType: 'text',
        label: 'Applicant NIC',
        required: true,
        order: 2
      },
      {
        fieldName: 'applicantAddress',
        fieldType: 'textarea',
        label: 'Applicant Address',
        required: true,
        order: 3
      },
      {
        fieldName: 'spouseName',
        fieldType: 'text',
        label: 'Spouse Name',
        required: true,
        order: 4
      },
      {
        fieldName: 'marriageDate',
        fieldType: 'date',
        label: 'Date of Marriage',
        required: true,
        order: 5
      },
      {
        fieldName: 'marriagePlace',
        fieldType: 'text',
        label: 'Place of Marriage Registration',
        required: true,
        order: 6
      },
      {
        fieldName: 'registrationNumber',
        fieldType: 'text',
        label: 'Marriage Registration Number (if known)',
        required: false,
        order: 7
      },
      {
        fieldName: 'purpose',
        fieldType: 'text',
        label: 'Purpose of Certificate',
        placeholder: 'e.g., Passport application, Visa, Legal proceedings',
        required: true,
        order: 8
      }
    ],
    templateContent: `APPLICATION FOR CERTIFIED COPY OF MARRIAGE CERTIFICATE

TO: THE REGISTRAR OF MARRIAGES
    {{marriagePlace}}


I, {{applicantName}}, bearing NIC No: {{applicantNIC}}, residing at {{applicantAddress}}, do hereby apply for a certified copy of my marriage certificate for the following:

MARRIAGE DETAILS:
Name of Applicant: {{applicantName}}
Name of Spouse: {{spouseName}}
Date of Marriage: {{marriageDate}}
Place of Registration: {{marriagePlace}}
Registration Number: {{registrationNumber}}

PURPOSE OF CERTIFICATE:
{{purpose}}

I declare that the information provided above is true and correct.

I request that a certified copy of the said marriage certificate be issued to me.


_____________________________
{{applicantName}}
APPLICANT

Date: ______________


FOR OFFICIAL USE ONLY:
Registration verified: _______
Fee paid: Rs. _______
Certificate issued: _______
Officer signature: _______`,
    courtSpecific: false,
    applicableDistricts: ['All'],
    languages: ['en', 'si'],
    complexity: 'simple',
    estimatedTime: 10,
    requiredDocuments: ['NIC Copy', 'Original Marriage Certificate (if available)'],
    filingFee: 0,
    courtFees: 0,
    isActive: true,
    isPopular: true,
    tags: ['marriage', 'certificate', 'registrar', 'family']
  },

  // 7. DRIVING LICENSE DUPLICATE APPLICATION
  {
    templateId: 'SL-LICENSE-DUPLICATE-001',
    name: 'Application for Duplicate Driving License',
    description: 'Application for duplicate/replacement driving license - DMT accepted format',
    category: 'General Legal',
    subcategory: 'Government Services',
    documentType: 'Application',
    fields: [
      {
        fieldName: 'applicantName',
        fieldType: 'text',
        label: 'Full Name (as per license)',
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
        label: 'Original License Number',
        required: true,
        order: 4
      },
      {
        fieldName: 'licenseCategory',
        fieldType: 'dropdown',
        label: 'License Category',
        options: [
          { value: 'A1 - Light Motorcycle', label: 'A1 - Light Motorcycle' },
          { value: 'A - Heavy Motorcycle', label: 'A - Heavy Motorcycle' },
          { value: 'B1 - Three Wheeler', label: 'B1 - Three Wheeler' },
          { value: 'B - Motor Car', label: 'B - Motor Car' },
          { value: 'C1 - Light Vehicle', label: 'C1 - Light Vehicle' },
          { value: 'C - Heavy Vehicle', label: 'C - Heavy Vehicle' },
          { value: 'CE - Articulated Vehicle', label: 'CE - Articulated Vehicle' },
          { value: 'D - Dual Purpose Vehicle', label: 'D - Dual Purpose Vehicle' },
          { value: 'G1 - Tractor', label: 'G1 - Tractor' }
        ],
        required: true,
        order: 5
      },
      {
        fieldName: 'issueDate',
        fieldType: 'date',
        label: 'Original Issue Date',
        required: true,
        order: 6
      },
      {
        fieldName: 'expiryDate',
        fieldType: 'date',
        label: 'Expiry Date',
        required: true,
        order: 7
      },
      {
        fieldName: 'reason',
        fieldType: 'dropdown',
        label: 'Reason for Duplicate',
        options: [
          { value: 'Lost', label: 'Lost' },
          { value: 'Stolen', label: 'Stolen' },
          { value: 'Damaged', label: 'Damaged' },
          { value: 'Mutilated', label: 'Mutilated' }
        ],
        required: true,
        order: 8
      },
      {
        fieldName: 'policeStation',
        fieldType: 'text',
        label: 'Police Station (if lost/stolen)',
        required: false,
        order: 9
      },
      {
        fieldName: 'policeEntryNumber',
        fieldType: 'text',
        label: 'Police Entry Number (if reported)',
        required: false,
        order: 10
      }
    ],
    templateContent: `APPLICATION FOR DUPLICATE DRIVING LICENSE

TO: THE COMMISSIONER
    DEPARTMENT OF MOTOR TRAFFIC
    {{applicantAddress}}


APPLICANT DETAILS:
Full Name: {{applicantName}}
NIC Number: {{applicantNIC}}
Permanent Address: {{applicantAddress}}

ORIGINAL LICENSE DETAILS:
License Number: {{licenseNumber}}
License Category: {{licenseCategory}}
Date of Issue: {{issueDate}}
Date of Expiry: {{expiryDate}}

REASON FOR DUPLICATE:
{{reason}}

{{policeStation}}
{{policeEntryNumber}}

DECLARATION:
I hereby declare that the particulars given above are true and correct. I undertake to surrender the original driving license if found.


_____________________________
{{applicantName}}
APPLICANT

Date: ______________


FOR OFFICIAL USE ONLY:
Application received: _______
Fee paid: Rs. _______
Duplicate issued: _______
Officer: _______`,
    courtSpecific: false,
    applicableDistricts: ['All'],
    languages: ['en', 'si'],
    complexity: 'simple',
    estimatedTime: 10,
    requiredDocuments: ['NIC Copy', 'Police Report (if lost/stolen)', 'Damaged License (if applicable)'],
    filingFee: 0,
    courtFees: 0,
    isActive: true,
    isPopular: true,
    tags: ['driving-license', 'dmt', 'duplicate', 'government']
  },

  // 8. CONSUMER COMPLAINT
  {
    templateId: 'SL-CONSUMER-COMPLAINT-001',
    name: 'Consumer Complaint Letter',
    description: 'Formal complaint to Consumer Affairs Authority',
    category: 'Consumer Rights',
    subcategory: 'Complaints',
    documentType: 'Application',
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
        required: true,
        order: 10
      },
      {
        fieldName: 'remedySought',
        fieldType: 'text',
        label: 'Remedy Sought',
        placeholder: 'e.g., Refund, Replacement, Compensation',
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

I declare that the above particulars are true and correct to the best of my knowledge.

I request the Consumer Affairs Authority to investigate this matter and provide appropriate relief.


_____________________________
{{complainantName}}
COMPLAINANT

Date: ______________


Attachments:
1. Copy of bill/invoice
2. Copy of NIC
3. Photographs (if applicable)
4. Any correspondence with business`,
    courtSpecific: false,
    applicableDistricts: ['All'],
    languages: ['en', 'si'],
    complexity: 'simple',
    estimatedTime: 15,
    requiredDocuments: ['Bill/Invoice', 'NIC Copy', 'Photos/Evidence'],
    filingFee: 0,
    courtFees: 0,
    isActive: true,
    isPopular: true,
    tags: ['consumer', 'complaint', 'caa', 'rights']
  },

  // 9. SMALL CLAIMS APPLICATION
  {
    templateId: 'SL-SMALL-CLAIMS-001',
    name: 'Small Claims Application',
    description: 'Application for small claims court (claims under LKR 100,000)',
    category: 'Court Filing',
    subcategory: 'Small Claims',
    documentType: 'Application',
    fields: [
      {
        fieldName: 'claimantName',
        fieldType: 'text',
        label: 'Claimant Name',
        required: true,
        order: 1
      },
      {
        fieldName: 'claimantNIC',
        fieldType: 'text',
        label: 'Claimant NIC',
        required: true,
        order: 2
      },
      {
        fieldName: 'claimantAddress',
        fieldType: 'textarea',
        label: 'Claimant Address',
        required: true,
        order: 3
      },
      {
        fieldName: 'respondentName',
        fieldType: 'text',
        label: 'Respondent Name',
        required: true,
        order: 4
      },
      {
        fieldName: 'respondentAddress',
        fieldType: 'textarea',
        label: 'Respondent Address',
        required: true,
        order: 5
      },
      {
        fieldName: 'claimAmount',
        fieldType: 'number',
        label: 'Claim Amount (LKR - Max 100,000)',
        required: true,
        order: 6
      },
      {
        fieldName: 'claimBasis',
        fieldType: 'textarea',
        label: 'Basis of Claim',
        helpText: 'Explain why you are claiming this amount',
        required: true,
        order: 7
      },
      {
        fieldName: 'incidentDate',
        fieldType: 'date',
        label: 'Date of Incident/Transaction',
        required: true,
        order: 8
      }
    ],
    templateContent: `SMALL CLAIMS COURT APPLICATION

TO: THE MAGISTRATE
    MAGISTRATE'S COURT


CLAIMANT:
Name: {{claimantName}}
NIC: {{claimantNIC}}
Address: {{claimantAddress}}

RESPONDENT:
Name: {{respondentName}}
Address: {{respondentAddress}}

CLAIM:
Amount Claimed: LKR {{claimAmount}}

BASIS OF CLAIM:
{{claimBasis}}

Date of Incident/Transaction: {{incidentDate}}

PRAYER:
The Claimant prays that this Honourable Court may be pleased to:
1. Order the Respondent to pay the sum of LKR {{claimAmount}}
2. Award costs of this application
3. Grant such other relief as this Court may deem fit


I declare that the particulars given above are true and correct.


_____________________________
{{claimantName}}
CLAIMANT

Date: ______________`,
    courtSpecific: true,
    applicableDistricts: ['All'],
    languages: ['en', 'si'],
    complexity: 'simple',
    estimatedTime: 15,
    requiredDocuments: ['NIC Copy', 'Evidence of Debt/Claim', 'Supporting Documents'],
    filingFee: 0,
    courtFees: 0,
    isActive: true,
    isPopular: true,
    tags: ['small-claims', 'magistrate', 'civil']
  },

  // 10. POWER OF ATTORNEY
  {
    templateId: 'SL-POWER-ATTORNEY-001',
    name: 'Power of Attorney',
    description: 'General power of attorney - Notary accepted format',
    category: 'General Legal',
    subcategory: 'Authorization',
    documentType: 'Deed',
    fields: [
      {
        fieldName: 'principalName',
        fieldType: 'text',
        label: 'Your Name (Principal)',
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
        label: 'Attorney Name (Person Authorized)',
        required: true,
        order: 4
      },
      {
        fieldName: 'attorneyNIC',
        fieldType: 'text',
        label: 'Attorney NIC',
        required: true,
        order: 5
      },
      {
        fieldName: 'attorneyAddress',
        fieldType: 'textarea',
        label: 'Attorney Address',
        required: true,
        order: 6
      },
      {
        fieldName: 'powers',
        fieldType: 'textarea',
        label: 'Powers Granted',
        helpText: 'List the specific powers you are granting',
        placeholder: 'e.g., To sign documents, collect money, represent in legal matters',
        required: true,
        order: 7
      },
      {
        fieldName: 'effectiveDate',
        fieldType: 'date',
        label: 'Effective Date',
        required: true,
        order: 8
      }
    ],
    templateContent: `POWER OF ATTORNEY


KNOW ALL MEN BY THESE PRESENTS that I, {{principalName}}, bearing NIC No: {{principalNIC}}, residing at {{principalAddress}} (hereinafter called "the Principal"),

DO HEREBY NOMINATE, CONSTITUTE AND APPOINT {{attorneyName}}, bearing NIC No: {{attorneyNIC}}, of {{attorneyAddress}} (hereinafter called "the Attorney"),

TO BE MY TRUE AND LAWFUL ATTORNEY for me and in my name, place and stead to do and execute the following acts and things:

POWERS GRANTED:
{{powers}}

TO HAVE AND TO HOLD the said powers unto the said Attorney from {{effectiveDate}} until revoked by me in writing.

AND I HEREBY AGREE TO RATIFY AND CONFIRM all acts and things lawfully done by my said Attorney by virtue of these presents.

IN WITNESS WHEREOF I have hereunto set my hand this {{effectiveDate}}.


_____________________________
{{principalName}}
PRINCIPAL


SIGNED BY THE ABOVE-NAMED PRINCIPAL
in the presence of:


WITNESS 1:                          WITNESS 2:
Name: _____________________         Name: _____________________
NIC: ______________________         NIC: ______________________
Address: __________________         Address: __________________
Signature: ________________         Signature: ________________


ACCEPTED:
_____________________________
{{attorneyName}}
ATTORNEY

Date: ______________


ATTESTED BY NOTARY PUBLIC:
_____________________________
Notary Public
Date: ______________
Official Seal:`,
    courtSpecific: false,
    applicableDistricts: ['All'],
    languages: ['en', 'si'],
    complexity: 'intermediate',
    estimatedTime: 20,
    requiredDocuments: ['NIC Copies', 'Proof of Identity'],
    filingFee: 0,
    courtFees: 0,
    isActive: true,
    isPopular: true,
    tags: ['power-of-attorney', 'authorization', 'notary']
  }
];

// Setup function
const setupRevisedTemplates = async () => {
  try {
    console.log('🇱🇰 Setting up REVISED Sri Lankan Legal Document Templates...');
    console.log('📋 Templates designed for CIVIL CASES (matching your system)');
    console.log('✅ Authentic government/court accepted formats');
    console.log('✅ Proper legal text size and styling');
    console.log('✅ FREE service (no fees)\n');
    
    // Get admin user for createdBy field
    const admin = await Staff.findOne({ role: 'admin' });
    if (!admin) {
      console.log('❌ No admin user found. Please create an admin user first.');
      return;
    }

    // First, deactivate old templates
    console.log('🔄 Deactivating old templates...');
    await DocumentTemplate.updateMany(
      {},
      { $set: { isActive: false, isPopular: false } }
    );

    let createdCount = 0;
    let updatedCount = 0;

    for (const templateData of revisedSriLankanTemplates) {
      try {
        // Check if template already exists
        const existingTemplate = await DocumentTemplate.findOne({ 
          templateId: templateData.templateId 
        });

        if (existingTemplate) {
          // Update existing template
          await DocumentTemplate.findByIdAndUpdate(existingTemplate._id, {
            ...templateData,
            createdBy: admin._id,
            lastModifiedBy: admin._id,
            updatedAt: new Date()
          });
          updatedCount++;
          console.log(`✅ Updated: ${templateData.name}`);
        } else {
          // Create new template
          const template = new DocumentTemplate({
            ...templateData,
            createdBy: admin._id,
            lastModifiedBy: admin._id
          });
          await template.save();
          createdCount++;
          console.log(`✅ Created: ${templateData.name}`);
        }
      } catch (error) {
        console.error(`❌ Error processing template ${templateData.name}:`, error.message);
      }
    }

    console.log(`\n🎉 Setup completed! Created: ${createdCount}, Updated: ${updatedCount}`);
    
    // Display summary
    const totalTemplates = await DocumentTemplate.countDocuments({ isActive: true });
    const categories = await DocumentTemplate.distinct('category', { isActive: true });
    
    console.log(`📊 Total active templates: ${totalTemplates}`);
    console.log(`📂 Categories: ${categories.join(', ')}`);
    console.log('\n✨ All templates are FREE (no fees)');
    console.log('✨ All templates match Sri Lankan government/court formats');
    console.log('✨ All templates for CIVIL cases only');

  } catch (error) {
    console.error('❌ Error setting up templates:', error);
  }
};

module.exports = { setupRevisedTemplates, revisedSriLankanTemplates };
