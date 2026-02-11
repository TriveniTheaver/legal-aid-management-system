const mongoose = require('mongoose');
const DocumentTemplate = require('../Model/DocumentTemplate');
const Staff = require('../Model/Staff');

// EVERYDAY TEMPLATES FOR SRI LANKAN CITIZENS
// Useful documents for daily life, students, families
const everydayTemplates = [

  // 1. POLICE COMPLAINT / INFORMATION
  {
    templateId: 'SL-DAILY-POLICE-001',
    name: 'Police Complaint / Information',
    description: 'File a complaint at police station for lost items, theft, harassment, etc.',
    category: 'General Legal',
    subcategory: 'Police Matters',
    documentType: 'Application',
    intendedFor: 'client',
    fields: [
      {
        fieldName: 'stationName',
        fieldType: 'text',
        label: 'Police Station Name',
        placeholder: 'e.g., Colombo Police Station',
        required: true,
        order: 1
      },
      {
        fieldName: 'complainantName',
        fieldType: 'text',
        label: 'Your Name',
        required: true,
        order: 2
      },
      {
        fieldName: 'complainantNIC',
        fieldType: 'text',
        label: 'Your NIC',
        required: true,
        order: 3
      },
      {
        fieldName: 'complainantAddress',
        fieldType: 'textarea',
        label: 'Your Address',
        required: true,
        order: 4
      },
      {
        fieldName: 'complainantPhone',
        fieldType: 'text',
        label: 'Your Phone Number',
        required: true,
        order: 5
      },
      {
        fieldName: 'complaintType',
        fieldType: 'dropdown',
        label: 'Type of Complaint',
        options: [
          { value: 'Lost Property', label: 'Lost Property' },
          { value: 'Theft', label: 'Theft' },
          { value: 'Harassment', label: 'Harassment' },
          { value: 'Accident', label: 'Accident' },
          { value: 'Dispute', label: 'Dispute' },
          { value: 'Other', label: 'Other' }
        ],
        required: true,
        order: 6
      },
      {
        fieldName: 'incidentDate',
        fieldType: 'date',
        label: 'Date of Incident',
        required: true,
        order: 7
      },
      {
        fieldName: 'incidentPlace',
        fieldType: 'text',
        label: 'Place of Incident',
        required: true,
        order: 8
      },
      {
        fieldName: 'complaintDetails',
        fieldType: 'textarea',
        label: 'Full Details of Complaint',
        helpText: 'Describe what happened in detail',
        required: true,
        order: 9
      }
    ],
    templateContent: `INFORMATION / COMPLAINT

TO: THE OFFICER-IN-CHARGE
    {{stationName}}


COMPLAINANT INFORMATION:
Name: {{complainantName}}
NIC No: {{complainantNIC}}
Address: {{complainantAddress}}
Contact No: {{complainantPhone}}

COMPLAINT DETAILS:
Type: {{complaintType}}
Date of Incident: {{incidentDate}}
Place of Incident: {{incidentPlace}}

FULL STATEMENT:

{{complaintDetails}}


I request the police to investigate this matter and take necessary action.

I declare that the above information is true and correct to the best of my knowledge.


_____________________________
{{complainantName}}
COMPLAINANT

Date: ______________


FOR OFFICIAL USE:
Entry No: ______________
Officer: ______________
Time: ______________`,
    courtSpecific: false,
    applicableDistricts: ['All'],
    languages: ['en', 'si'],
    complexity: 'simple',
    estimatedTime: 10,
    requiredDocuments: ['NIC Copy'],
    filingFee: 0,
    courtFees: 0,
    isActive: true,
    isPopular: true,
    tags: ['police', 'complaint', 'citizen', 'safety']
  },

  // 2. SCHOOL/UNIVERSITY LEAVE APPLICATION
  {
    templateId: 'SL-DAILY-STUDENT-LEAVE-001',
    name: 'Student Leave Application',
    description: 'Request leave from school/university for students',
    category: 'General Legal',
    subcategory: 'Education',
    documentType: 'Application',
    intendedFor: 'client',
    fields: [
      {
        fieldName: 'studentName',
        fieldType: 'text',
        label: 'Student Name',
        required: true,
        order: 1
      },
      {
        fieldName: 'studentID',
        fieldType: 'text',
        label: 'Student ID/Admission Number',
        required: true,
        order: 2
      },
      {
        fieldName: 'grade',
        fieldType: 'text',
        label: 'Grade/Year',
        placeholder: 'e.g., Grade 10, Year 2',
        required: true,
        order: 3
      },
      {
        fieldName: 'institutionName',
        fieldType: 'text',
        label: 'School/University Name',
        required: true,
        order: 4
      },
      {
        fieldName: 'leaveStartDate',
        fieldType: 'date',
        label: 'Leave Start Date',
        required: true,
        order: 5
      },
      {
        fieldName: 'leaveEndDate',
        fieldType: 'date',
        label: 'Leave End Date',
        required: true,
        order: 6
      },
      {
        fieldName: 'leaveReason',
        fieldType: 'textarea',
        label: 'Reason for Leave',
        required: true,
        order: 7
      },
      {
        fieldName: 'parentName',
        fieldType: 'text',
        label: 'Parent/Guardian Name',
        required: true,
        order: 8
      },
      {
        fieldName: 'parentContact',
        fieldType: 'text',
        label: 'Parent Contact Number',
        required: true,
        order: 9
      }
    ],
    templateContent: `APPLICATION FOR LEAVE

To: The Principal/Dean
    {{institutionName}}


Student Name: {{studentName}}
Student ID: {{studentID}}
Grade/Year: {{grade}}

I respectfully request leave from {{leaveStartDate}} to {{leaveEndDate}}.

REASON:
{{leaveReason}}


_____________________________
{{studentName}}
STUDENT


PARENT/GUARDIAN CONSENT:

I, {{parentName}}, parent/guardian of the above student, consent to this leave application.

Contact: {{parentContact}}


_____________________________
{{parentName}}
PARENT/GUARDIAN

Date: ______________`,
    courtSpecific: false,
    applicableDistricts: ['All'],
    languages: ['en', 'si'],
    complexity: 'simple',
    estimatedTime: 5,
    requiredDocuments: ['Medical Certificate (if medical leave)'],
    filingFee: 0,
    courtFees: 0,
    isActive: true,
    isPopular: true,
    tags: ['student', 'leave', 'education', 'school']
  },

  // 3. BANK ACCOUNT CLOSURE
  {
    templateId: 'SL-DAILY-BANK-CLOSURE-001',
    name: 'Bank Account Closure Request',
    description: 'Request to close bank account',
    category: 'General Legal',
    subcategory: 'Financial',
    documentType: 'Application',
    intendedFor: 'client',
    fields: [
      {
        fieldName: 'accountHolderName',
        fieldType: 'text',
        label: 'Account Holder Name',
        required: true,
        order: 1
      },
      {
        fieldName: 'accountNumber',
        fieldType: 'text',
        label: 'Account Number',
        required: true,
        order: 2
      },
      {
        fieldName: 'nicNumber',
        fieldType: 'text',
        label: 'NIC Number',
        required: true,
        order: 3
      },
      {
        fieldName: 'branchName',
        fieldType: 'text',
        label: 'Branch Name',
        required: true,
        order: 4
      },
      {
        fieldName: 'closureReason',
        fieldType: 'dropdown',
        label: 'Reason for Closure',
        options: [
          { value: 'Relocating', label: 'Relocating' },
          { value: 'No longer needed', label: 'No longer needed' },
          { value: 'Better services elsewhere', label: 'Better services elsewhere' },
          { value: 'Other', label: 'Other' }
        ],
        required: true,
        order: 5
      },
      {
        fieldName: 'contactNumber',
        fieldType: 'text',
        label: 'Contact Number',
        required: true,
        order: 6
      }
    ],
    templateContent: `ACCOUNT CLOSURE REQUEST

To: The Manager
    {{branchName}}


Account Holder: {{accountHolderName}}
Account Number: {{accountNumber}}
NIC: {{nicNumber}}

I request closure of the above account.

Reason: {{closureReason}}

Please transfer the balance to my linked account or issue a cheque.

Contact Number: {{contactNumber}}


_____________________________
{{accountHolderName}}

Date: ______________


Signature verified by:
_____________________________
Bank Officer`,
    courtSpecific: false,
    applicableDistricts: ['All'],
    languages: ['en', 'si'],
    complexity: 'simple',
    estimatedTime: 5,
    requiredDocuments: ['NIC Copy', 'Account Passbook/Card'],
    filingFee: 0,
    courtFees: 0,
    isActive: true,
    isPopular: true,
    tags: ['bank', 'account', 'closure', 'financial']
  },

  // 4. CHARACTER CERTIFICATE REQUEST
  {
    templateId: 'SL-DAILY-CHARACTER-001',
    name: 'Character Certificate Request',
    description: 'Request character certificate from Grama Niladhari/employer',
    category: 'General Legal',
    subcategory: 'Certificates',
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
        fieldName: 'applicantAddress',
        fieldType: 'textarea',
        label: 'Your Address',
        required: true,
        order: 3
      },
      {
        fieldName: 'requestTo',
        fieldType: 'dropdown',
        label: 'Requesting From',
        options: [
          { value: 'Grama Niladhari', label: 'Grama Niladhari' },
          { value: 'Employer', label: 'Employer' },
          { value: 'School Principal', label: 'School Principal' },
          { value: 'University', label: 'University' }
        ],
        required: true,
        order: 4
      },
      {
        fieldName: 'purpose',
        fieldType: 'text',
        label: 'Purpose',
        placeholder: 'e.g., Job application, Visa, Loan',
        required: true,
        order: 5
      },
      {
        fieldName: 'duration',
        fieldType: 'text',
        label: 'Period of Residence/Employment',
        placeholder: 'e.g., 2018 to present',
        required: false,
        order: 6
      }
    ],
    templateContent: `REQUEST FOR CHARACTER CERTIFICATE

To: {{requestTo}}


Name: {{applicantName}}
NIC No: {{applicantNIC}}
Address: {{applicantAddress}}

{{duration}}

I request a Character Certificate for the purpose of: {{purpose}}

I declare that I have been a person of good character and conduct.


_____________________________
{{applicantName}}

Date: ______________


TO BE COMPLETED BY ISSUING AUTHORITY:

This is to certify that {{applicantName}} (NIC: {{applicantNIC}}) is personally known to me and is a person of good character and conduct.


_____________________________
{{requestTo}}
Official Stamp:
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
    tags: ['character', 'certificate', 'grama-niladhari', 'citizen']
  },

  // 5. EMPLOYER SALARY/INCOME CERTIFICATE REQUEST
  {
    templateId: 'SL-DAILY-INCOME-001',
    name: 'Income/Salary Certificate Request',
    description: 'Request income certificate from employer for loans, visas, etc.',
    category: 'General Legal',
    subcategory: 'Employment',
    documentType: 'Application',
    intendedFor: 'client',
    fields: [
      {
        fieldName: 'employeeName',
        fieldType: 'text',
        label: 'Your Name',
        required: true,
        order: 1
      },
      {
        fieldName: 'employeeNIC',
        fieldType: 'text',
        label: 'Your NIC',
        required: true,
        order: 2
      },
      {
        fieldName: 'designation',
        fieldType: 'text',
        label: 'Your Designation/Position',
        required: true,
        order: 3
      },
      {
        fieldName: 'employeeID',
        fieldType: 'text',
        label: 'Employee ID',
        required: false,
        order: 4
      },
      {
        fieldName: 'companyName',
        fieldType: 'text',
        label: 'Company Name',
        required: true,
        order: 5
      },
      {
        fieldName: 'purpose',
        fieldType: 'text',
        label: 'Purpose',
        placeholder: 'e.g., Bank loan, Visa application',
        required: true,
        order: 6
      }
    ],
    templateContent: `REQUEST FOR INCOME CERTIFICATE

To: The Manager - Human Resources
    {{companyName}}


Employee Name: {{employeeName}}
NIC: {{employeeNIC}}
Designation: {{designation}}
Employee ID: {{employeeID}}

I request an Income/Salary Certificate for: {{purpose}}

Thank you.


_____________________________
{{employeeName}}

Date: ______________


TO BE COMPLETED BY EMPLOYER:

This is to certify that {{employeeName}} (NIC: {{employeeNIC}}) is employed with {{companyName}} as {{designation}}.

Monthly Salary: Rs. ______________
Annual Income: Rs. ______________
Employment Period: From ______________ to Present

This certificate is issued for {{purpose}}.


_____________________________
HR Manager
Company Stamp:
Date: ______________`,
    courtSpecific: false,
    applicableDistricts: ['All'],
    languages: ['en', 'si'],
    complexity: 'simple',
    estimatedTime: 5,
    requiredDocuments: ['NIC Copy', 'Employee ID'],
    filingFee: 0,
    courtFees: 0,
    isActive: true,
    isPopular: true,
    tags: ['income', 'salary', 'employment', 'certificate']
  },

  // 6. NAME CORRECTION AFFIDAVIT
  {
    templateId: 'SL-DAILY-NAME-CORRECTION-001',
    name: 'Name Correction Affidavit',
    description: 'Declare correct name spelling for official documents',
    category: 'General Legal',
    subcategory: 'Personal Documents',
    documentType: 'Affidavit',
    intendedFor: 'client',
    fields: [
      {
        fieldName: 'deponentName',
        fieldType: 'text',
        label: 'Your Correct Name',
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
        fieldName: 'incorrectName',
        fieldType: 'text',
        label: 'Incorrect Name (as appears)',
        required: true,
        order: 4
      },
      {
        fieldName: 'correctName',
        fieldType: 'text',
        label: 'Correct Name',
        required: true,
        order: 5
      },
      {
        fieldName: 'document',
        fieldType: 'text',
        label: 'Document with Error',
        placeholder: 'e.g., Birth Certificate, Educational Certificate',
        required: true,
        order: 6
      }
    ],
    templateContent: `AFFIDAVIT FOR NAME CORRECTION


I, {{deponentName}}, bearing NIC No: {{deponentNIC}}, residing at {{deponentAddress}}, do solemnly declare:

1. My correct name is: {{correctName}}

2. In my {{document}}, my name appears as: {{incorrectName}}

3. This occurred due to a clerical error at the time of registration.

4. Both names refer to the same person (myself).

5. I request all concerned authorities to accept {{correctName}} as my correct legal name.

This affidavit is made for the purpose of correcting my name in official records.


_____________________________
{{deponentName}}

Dated: ______________


ATTESTED:
_____________________________
Justice of the Peace/Notary Public
Date: ______________`,
    courtSpecific: false,
    applicableDistricts: ['All'],
    languages: ['en', 'si'],
    complexity: 'simple',
    estimatedTime: 8,
    requiredDocuments: ['NIC Copy', 'Document with error'],
    filingFee: 0,
    courtFees: 0,
    isActive: true,
    isPopular: true,
    tags: ['name', 'correction', 'affidavit', 'citizen']
  },

  // 7. ADDRESS PROOF AFFIDAVIT
  {
    templateId: 'SL-DAILY-ADDRESS-PROOF-001',
    name: 'Address Proof Affidavit',
    description: 'Sworn declaration of residential address for banks, govt offices',
    category: 'General Legal',
    subcategory: 'Personal Documents',
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
        fieldName: 'currentAddress',
        fieldType: 'textarea',
        label: 'Your Current Address',
        required: true,
        order: 3
      },
      {
        fieldName: 'residingSince',
        fieldType: 'text',
        label: 'Residing Since',
        placeholder: 'e.g., January 2020',
        required: true,
        order: 4
      },
      {
        fieldName: 'purpose',
        fieldType: 'text',
        label: 'Purpose',
        placeholder: 'e.g., Bank account, Mobile connection',
        required: true,
        order: 5
      }
    ],
    templateContent: `AFFIDAVIT OF RESIDENCE


I, {{deponentName}}, bearing NIC No: {{deponentNIC}}, do solemnly declare:

1. I am permanently residing at:
   {{currentAddress}}

2. I have been residing at this address since {{residingSince}}.

3. This is my bona fide residential address.

4. This affidavit is made for: {{purpose}}


_____________________________
{{deponentName}}

Date: ______________


ATTESTED:
_____________________________
Justice of the Peace/Notary Public
Signature:
Date: ______________`,
    courtSpecific: false,
    applicableDistricts: ['All'],
    languages: ['en', 'si'],
    complexity: 'simple',
    estimatedTime: 5,
    requiredDocuments: ['NIC Copy', 'Utility Bill'],
    filingFee: 0,
    courtFees: 0,
    isActive: true,
    isPopular: true,
    tags: ['address', 'proof', 'residence', 'affidavit']
  },

  // 8. PASSPORT APPLICATION CONSENT (For Minors)
  {
    templateId: 'SL-DAILY-PASSPORT-CONSENT-001',
    name: 'Parental Consent for Minor Passport',
    description: 'Parental consent letter for minor child passport application',
    category: 'General Legal',
    subcategory: 'Travel',
    documentType: 'Declaration',
    intendedFor: 'client',
    fields: [
      {
        fieldName: 'parentName',
        fieldType: 'text',
        label: 'Parent Name',
        required: true,
        order: 1
      },
      {
        fieldName: 'parentNIC',
        fieldType: 'text',
        label: 'Parent NIC',
        required: true,
        order: 2
      },
      {
        fieldName: 'childName',
        fieldType: 'text',
        label: 'Child Name',
        required: true,
        order: 3
      },
      {
        fieldName: 'childDOB',
        fieldType: 'date',
        label: 'Child Date of Birth',
        required: true,
        order: 4
      },
      {
        fieldName: 'childBirthCertNo',
        fieldType: 'text',
        label: 'Child Birth Certificate Number',
        required: true,
        order: 5
      },
      {
        fieldName: 'otherParentName',
        fieldType: 'text',
        label: 'Other Parent Name',
        required: true,
        order: 6
      }
    ],
    templateContent: `PARENTAL CONSENT FOR MINOR PASSPORT APPLICATION


I, {{parentName}}, bearing NIC No: {{parentNIC}}, parent of {{childName}} (Date of Birth: {{childDOB}}, Birth Certificate No: {{childBirthCertNo}}), do hereby:

1. Consent to the issuance of a passport to my minor child.

2. Confirm that {{otherParentName}} (other parent) is aware and consents to this application.

3. Take full responsibility for the passport application.


_____________________________
{{parentName}}
PARENT

Date: ______________


WITNESSES:
1. ___________________
2. ___________________`,
    courtSpecific: false,
    applicableDistricts: ['All'],
    languages: ['en', 'si'],
    complexity: 'simple',
    estimatedTime: 5,
    requiredDocuments: ['Parent NIC', 'Child Birth Certificate'],
    filingFee: 0,
    courtFees: 0,
    isActive: true,
    isPopular: true,
    tags: ['passport', 'consent', 'minor', 'travel']
  },

  // 9. SCHOOL ADMISSION APPLICATION
  {
    templateId: 'SL-DAILY-SCHOOL-ADMISSION-001',
    name: 'School Admission Application',
    description: 'Apply for school admission for your child',
    category: 'General Legal',
    subcategory: 'Education',
    documentType: 'Application',
    intendedFor: 'client',
    fields: [
      {
        fieldName: 'childName',
        fieldType: 'text',
        label: 'Child Full Name',
        required: true,
        order: 1
      },
      {
        fieldName: 'childDOB',
        fieldType: 'date',
        label: 'Date of Birth',
        required: true,
        order: 2
      },
      {
        fieldName: 'gradeApplying',
        fieldType: 'dropdown',
        label: 'Grade Applying For',
        options: [
          { value: 'Grade 1', label: 'Grade 1' },
          { value: 'Grade 6', label: 'Grade 6' },
          { value: 'Grade 7', label: 'Grade 7' },
          { value: 'Grade 8', label: 'Grade 8' },
          { value: 'Grade 9', label: 'Grade 9' },
          { value: 'Grade 10', label: 'Grade 10' },
          { value: 'Grade 11', label: 'Grade 11' }
        ],
        required: true,
        order: 3
      },
      {
        fieldName: 'schoolName',
        fieldType: 'text',
        label: 'School Name',
        required: true,
        order: 4
      },
      {
        fieldName: 'parentName',
        fieldType: 'text',
        label: 'Parent/Guardian Name',
        required: true,
        order: 5
      },
      {
        fieldName: 'parentNIC',
        fieldType: 'text',
        label: 'Parent NIC',
        required: true,
        order: 6
      },
      {
        fieldName: 'parentAddress',
        fieldType: 'textarea',
        label: 'Permanent Address',
        required: true,
        order: 7
      },
      {
        fieldName: 'parentPhone',
        fieldType: 'text',
        label: 'Contact Number',
        required: true,
        order: 8
      },
      {
        fieldName: 'previousSchool',
        fieldType: 'text',
        label: 'Previous School (if any)',
        required: false,
        order: 9
      }
    ],
    templateContent: `SCHOOL ADMISSION APPLICATION

To: The Principal
    {{schoolName}}


STUDENT DETAILS:
Full Name: {{childName}}
Date of Birth: {{childDOB}}
Grade Applying: {{gradeApplying}}
Previous School: {{previousSchool}}

PARENT/GUARDIAN DETAILS:
Name: {{parentName}}
NIC: {{parentNIC}}
Address: {{parentAddress}}
Contact: {{parentPhone}}

I request admission for my child to your esteemed institution.


_____________________________
{{parentName}}
PARENT/GUARDIAN

Date: ______________`,
    courtSpecific: false,
    applicableDistricts: ['All'],
    languages: ['en', 'si'],
    complexity: 'simple',
    estimatedTime: 8,
    requiredDocuments: ['Child Birth Certificate', 'Parent NIC', 'Previous School Leaving Certificate'],
    filingFee: 0,
    courtFees: 0,
    isActive: true,
    isPopular: true,
    tags: ['school', 'admission', 'education', 'student']
  },

  // 10. EMPLOYER NO OBJECTION CERTIFICATE (NOC)
  {
    templateId: 'SL-DAILY-NOC-001',
    name: 'No Objection Certificate Request',
    description: 'Request NOC from employer for visa, education, business, etc.',
    category: 'General Legal',
    subcategory: 'Employment',
    documentType: 'Application',
    intendedFor: 'client',
    fields: [
      {
        fieldName: 'employeeName',
        fieldType: 'text',
        label: 'Your Name',
        required: true,
        order: 1
      },
      {
        fieldName: 'employeeNIC',
        fieldType: 'text',
        label: 'Your NIC',
        required: true,
        order: 2
      },
      {
        fieldName: 'designation',
        fieldType: 'text',
        label: 'Your Designation',
        required: true,
        order: 3
      },
      {
        fieldName: 'companyName',
        fieldType: 'text',
        label: 'Company Name',
        required: true,
        order: 4
      },
      {
        fieldName: 'nocPurpose',
        fieldType: 'dropdown',
        label: 'Purpose of NOC',
        options: [
          { value: 'Visa Application', label: 'Visa Application' },
          { value: 'Higher Education', label: 'Higher Education' },
          { value: 'Part-time Business', label: 'Part-time Business' },
          { value: 'Foreign Employment', label: 'Foreign Employment' },
          { value: 'Other', label: 'Other' }
        ],
        required: true,
        order: 5
      }
    ],
    templateContent: `REQUEST FOR NO OBJECTION CERTIFICATE

To: The Manager
    {{companyName}}


Employee Name: {{employeeName}}
NIC: {{employeeNIC}}
Designation: {{designation}}

I request a No Objection Certificate for: {{nocPurpose}}

I confirm that this will not affect my employment duties.


_____________________________
{{employeeName}}

Date: ______________


NO OBJECTION CERTIFICATE

This is to certify that we have no objection to {{employeeName}} (NIC: {{employeeNIC}}), {{designation}}, proceeding with {{nocPurpose}}.


_____________________________
Manager
Company Stamp:
Date: ______________`,
    courtSpecific: false,
    applicableDistricts: ['All'],
    languages: ['en', 'si'],
    complexity: 'simple',
    estimatedTime: 5,
    requiredDocuments: ['NIC Copy', 'Employee ID'],
    filingFee: 0,
    courtFees: 0,
    isActive: true,
    isPopular: true,
    tags: ['noc', 'employment', 'objection', 'certificate']
  },

  // 11. BIRTH CERTIFICATE COPY REQUEST
  {
    templateId: 'SL-DAILY-BIRTH-CERT-001',
    name: 'Birth Certificate Copy Request',
    description: 'Request certified copy of birth certificate from Registrar',
    category: 'General Legal',
    subcategory: 'Personal Documents',
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
        fieldName: 'childName',
        fieldType: 'text',
        label: 'Name on Birth Certificate',
        required: true,
        order: 3
      },
      {
        fieldName: 'dateOfBirth',
        fieldType: 'date',
        label: 'Date of Birth',
        required: true,
        order: 4
      },
      {
        fieldName: 'placeOfBirth',
        fieldType: 'text',
        label: 'Place of Birth',
        required: true,
        order: 5
      },
      {
        fieldName: 'registrationNumber',
        fieldType: 'text',
        label: 'Registration Number (if known)',
        required: false,
        order: 6
      },
      {
        fieldName: 'purpose',
        fieldType: 'text',
        label: 'Purpose',
        placeholder: 'e.g., Passport, School, Visa',
        required: true,
        order: 7
      }
    ],
    templateContent: `REQUEST FOR BIRTH CERTIFICATE COPY

To: The Registrar of Births
    {{placeOfBirth}}


Applicant Name: {{applicantName}}
NIC: {{applicantNIC}}
Relationship: Parent/Self

BIRTH DETAILS:
Name: {{childName}}
Date of Birth: {{dateOfBirth}}
Place of Birth: {{placeOfBirth}}
Registration No: {{registrationNumber}}

Purpose: {{purpose}}

I request a certified copy of the birth certificate.


_____________________________
{{applicantName}}

Date: ______________


FOR OFFICIAL USE:
Fee paid: Rs. _______
Certificate issued: _______
Officer: _______`,
    courtSpecific: false,
    applicableDistricts: ['All'],
    languages: ['en', 'si'],
    complexity: 'simple',
    estimatedTime: 5,
    requiredDocuments: ['Applicant NIC'],
    filingFee: 0,
    courtFees: 0,
    isActive: true,
    isPopular: true,
    tags: ['birth', 'certificate', 'registrar', 'citizen']
  },

  // 12. JOB APPLICATION LETTER
  {
    templateId: 'SL-DAILY-JOB-APPLICATION-001',
    name: 'Job Application Letter',
    description: 'Professional job application letter',
    category: 'General Legal',
    subcategory: 'Employment',
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
        fieldName: 'applicantAddress',
        fieldType: 'textarea',
        label: 'Your Address',
        required: true,
        order: 2
      },
      {
        fieldName: 'applicantPhone',
        fieldType: 'text',
        label: 'Your Phone',
        required: true,
        order: 3
      },
      {
        fieldName: 'applicantEmail',
        fieldType: 'email',
        label: 'Your Email',
        required: true,
        order: 4
      },
      {
        fieldName: 'companyName',
        fieldType: 'text',
        label: 'Company Name',
        required: true,
        order: 5
      },
      {
        fieldName: 'position',
        fieldType: 'text',
        label: 'Position Applying For',
        required: true,
        order: 6
      },
      {
        fieldName: 'qualifications',
        fieldType: 'textarea',
        label: 'Your Qualifications',
        placeholder: 'e.g., Degree, Experience, Skills',
        required: true,
        order: 7
      }
    ],
    templateContent: `{{applicantName}}
{{applicantAddress}}
Phone: {{applicantPhone}}
Email: {{applicantEmail}}

Date: ______________

To: The Manager - Human Resources
    {{companyName}}


Dear Sir/Madam,

RE: APPLICATION FOR THE POSITION OF {{position}}

I wish to apply for the above position advertised by your organization.

QUALIFICATIONS:
{{qualifications}}

I am confident that my qualifications and experience make me suitable for this position.

I have enclosed my CV and supporting documents for your consideration.

I am available for an interview at your convenience.

Thank you for your consideration.

Yours faithfully,


_____________________________
{{applicantName}}

Enclosures:
1. Curriculum Vitae
2. Copies of Certificates
3. NIC Copy`,
    courtSpecific: false,
    applicableDistricts: ['All'],
    languages: ['en', 'si'],
    complexity: 'simple',
    estimatedTime: 10,
    requiredDocuments: ['CV', 'Certificates', 'NIC'],
    filingFee: 0,
    courtFees: 0,
    isActive: true,
    isPopular: true,
    tags: ['job', 'application', 'employment', 'career']
  }
];

// Setup function
const addEverydayTemplates = async () => {
  try {
    console.log('📋 ADDING EVERYDAY USEFUL TEMPLATES FOR SRI LANKAN CITIZENS');
    console.log('=' + '='.repeat(60));
    
    const admin = await Staff.findOne({ role: 'admin' });
    if (!admin) {
      console.log('❌ No admin found');
      return;
    }

    let added = 0;
    for (const template of everydayTemplates) {
      try {
        const exists = await DocumentTemplate.findOne({ templateId: template.templateId });
        if (!exists) {
          await new DocumentTemplate({
            ...template,
            createdBy: admin._id
          }).save();
          added++;
          console.log(`✅ Added: ${template.name}`);
        } else {
          await DocumentTemplate.findByIdAndUpdate(exists._id, {
            ...template,
            lastModifiedBy: admin._id
          });
          console.log(`♻️ Updated: ${template.name}`);
        }
      } catch (error) {
        console.error(`❌ ${template.name}:`, error.message);
      }
    }

    const total = await DocumentTemplate.countDocuments({ isActive: true });
    console.log(`\n✅ Added ${added} new everyday templates`);
    console.log(`📊 Total active templates: ${total}`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
};

module.exports = { addEverydayTemplates, everydayTemplates };
