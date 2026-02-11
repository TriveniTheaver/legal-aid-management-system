const mongoose = require('mongoose');
const DocumentTemplate = require('../Model/DocumentTemplate');
const Staff = require('../Model/Staff');

// Authentic Sri Lankan Legal Document Templates
const sriLankanTemplates = [
  // COURT FILING DOCUMENTS
  {
    templateId: 'SL-PLAINT-001',
    name: 'Plaint (Original Petition)',
    description: 'Original petition filed in District Court for civil matters',
    category: 'Court Filing',
    subcategory: 'Civil Litigation',
    documentType: 'Plaint',
    fields: [
      {
        fieldName: 'courtName',
        fieldType: 'text',
        label: 'Name of the Court',
        placeholder: 'e.g., District Court of Colombo',
        required: true,
        order: 1
      },
      {
        fieldName: 'caseNumber',
        fieldType: 'text',
        label: 'Case Number',
        placeholder: 'e.g., DC/1234/2024',
        required: true,
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
        label: 'Plaintiff Address',
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
        label: 'Cause of Action',
        required: true,
        order: 9
      },
      {
        fieldName: 'reliefSought',
        fieldType: 'textarea',
        label: 'Relief Sought',
        required: true,
        order: 10
      },
      {
        fieldName: 'caseValue',
        fieldType: 'number',
        label: 'Value of the Case (LKR)',
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
    templateContent: `IN THE DISTRICT COURT OF {{courtName}}

CASE NO: {{caseNumber}}

BETWEEN

{{plaintiffName}}
NIC: {{plaintiffNIC}}
Residing at {{plaintiffAddress}}
PLAINTIFF

AND

{{defendantName}}
NIC: {{defendantNIC}}
Residing at {{defendantAddress}}
DEFENDANT

PLAINT

TO THE HONOURABLE COURT:

1. The Plaintiff above named respectfully states as follows:

2. CAUSE OF ACTION:
{{causeOfAction}}

3. RELIEF SOUGHT:
{{reliefSought}}

4. The value of the subject matter of the action is LKR {{caseValue}}.

5. The Plaintiff prays that this Honourable Court may be pleased to:
   a) Grant the reliefs prayed for above;
   b) Grant such other reliefs as this Honourable Court may deem fit;
   c) Award costs of this action.

Dated this {{filingDate}}.

_________________________
PLAINTIFF

_________________________
ATTORNEY-AT-LAW
Attorney for the Plaintiff`,
    courtSpecific: true,
    applicableDistricts: ['All'],
    languages: ['en', 'si'],
    complexity: 'intermediate',
    estimatedTime: 30,
    requiredDocuments: ['NIC Copy', 'Supporting Documents', 'Evidence'],
    filingFee: 500,
    courtFees: 1000,
    isActive: true,
    isPopular: true,
    tags: ['plaint', 'civil', 'court', 'filing', 'petition']
  },

  // AFFIDAVIT TEMPLATE
  {
    templateId: 'SL-AFFIDAVIT-001',
    name: 'Affidavit',
    description: 'Sworn statement for court proceedings',
    category: 'Court Filing',
    subcategory: 'Evidence',
    documentType: 'Affidavit',
    fields: [
      {
        fieldName: 'deponentName',
        fieldType: 'text',
        label: 'Name of Deponent',
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
        label: 'Deponent Address',
        required: true,
        order: 3
      },
      {
        fieldName: 'caseNumber',
        fieldType: 'text',
        label: 'Case Number',
        placeholder: 'e.g., DC/1234/2024',
        required: true,
        order: 4
      },
      {
        fieldName: 'courtName',
        fieldType: 'text',
        label: 'Name of Court',
        required: true,
        order: 5
      },
      {
        fieldName: 'affidavitContent',
        fieldType: 'textarea',
        label: 'Affidavit Content',
        required: true,
        order: 6
      },
      {
        fieldName: 'swornDate',
        fieldType: 'date',
        label: 'Date of Swearing',
        required: true,
        order: 7
      }
    ],
    templateContent: `IN THE {{courtName}}

CASE NO: {{caseNumber}}

AFFIDAVIT

I, {{deponentName}}, NIC No: {{deponentNIC}}, residing at {{deponentAddress}}, do hereby solemnly and sincerely declare and affirm as follows:

{{affidavitContent}}

I make this solemn declaration conscientiously believing the same to be true and by virtue of the provisions of the Oaths Ordinance.

Dated this {{swornDate}}.

_________________________
{{deponentName}}
DEPONENT

Sworn before me this {{swornDate}}.

_________________________
COMMISSIONER FOR OATHS
Attorney-at-Law`,
    courtSpecific: true,
    applicableDistricts: ['All'],
    languages: ['en', 'si'],
    complexity: 'simple',
    estimatedTime: 15,
    requiredDocuments: ['NIC Copy'],
    filingFee: 0,
    courtFees: 0,
    isActive: true,
    isPopular: true,
    tags: ['affidavit', 'evidence', 'sworn', 'statement']
  },

  // SUMMONS TEMPLATE
  {
    templateId: 'SL-SUMMONS-001',
    name: 'Summons to Defendant',
    description: 'Court summons to appear before the court',
    category: 'Court Filing',
    subcategory: 'Civil Litigation',
    documentType: 'Summons',
    fields: [
      {
        fieldName: 'courtName',
        fieldType: 'text',
        label: 'Name of the Court',
        required: true,
        order: 1
      },
      {
        fieldName: 'caseNumber',
        fieldType: 'text',
        label: 'Case Number',
        required: true,
        order: 2
      },
      {
        fieldName: 'defendantName',
        fieldType: 'text',
        label: 'Name of Defendant',
        required: true,
        order: 3
      },
      {
        fieldName: 'defendantAddress',
        fieldType: 'textarea',
        label: 'Defendant Address',
        required: true,
        order: 4
      },
      {
        fieldName: 'hearingDate',
        fieldType: 'date',
        label: 'Date of Hearing',
        required: true,
        order: 5
      },
      {
        fieldName: 'hearingTime',
        fieldType: 'text',
        label: 'Time of Hearing',
        placeholder: 'e.g., 9:00 AM',
        required: true,
        order: 6
      },
      {
        fieldName: 'plaintiffName',
        fieldType: 'text',
        label: 'Name of Plaintiff',
        required: true,
        order: 7
      },
      {
        fieldName: 'caseDescription',
        fieldType: 'textarea',
        label: 'Brief Description of Case',
        required: true,
        order: 8
      }
    ],
    templateContent: `IN THE {{courtName}}

CASE NO: {{caseNumber}}

SUMMONS

TO: {{defendantName}}
{{defendantAddress}}

WHEREAS {{plaintiffName}} has instituted an action against you in this Court, the particulars of which are set out in the plaint filed herein.

YOU ARE HEREBY SUMMONED to appear in this Court on {{hearingDate}} at {{hearingTime}} to answer the claim made against you in the said action.

CASE DESCRIPTION:
{{caseDescription}}

TAKE NOTICE that if you fail to appear at the time and place mentioned above, judgment may be given against you in your absence.

Dated this {{hearingDate}}.

_________________________
REGISTRAR
{{courtName}}`,
    courtSpecific: true,
    applicableDistricts: ['All'],
    languages: ['en', 'si'],
    complexity: 'simple',
    estimatedTime: 10,
    requiredDocuments: [],
    filingFee: 0,
    courtFees: 0,
    isActive: true,
    isPopular: true,
    tags: ['summons', 'court', 'hearing', 'notice']
  },

  // CASE DETAILS TEMPLATE (For Court Hearings)
  {
    templateId: 'SL-CASE-DETAILS-001',
    name: 'Case Details for Court Hearing',
    description: 'Comprehensive case details document for court hearings',
    category: 'Court Filing',
    subcategory: 'Hearing Documents',
    documentType: 'Statement',
    fields: [
      {
        fieldName: 'courtName',
        fieldType: 'text',
        label: 'Name of the Court',
        required: true,
        order: 1
      },
      {
        fieldName: 'caseNumber',
        fieldType: 'text',
        label: 'Case Number',
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
        required: true,
        order: 4
      },
      {
        fieldName: 'judgeName',
        fieldType: 'text',
        label: 'Name of Presiding Judge',
        required: true,
        order: 5
      },
      {
        fieldName: 'plaintiffName',
        fieldType: 'text',
        label: 'Name of Plaintiff',
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
        label: 'Name of Defendant',
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
          { value: 'Civil', label: 'Civil' },
          { value: 'Criminal', label: 'Criminal' },
          { value: 'Family', label: 'Family' },
          { value: 'Property', label: 'Property' },
          { value: 'Commercial', label: 'Commercial' }
        ],
        required: true,
        order: 10
      },
      {
        fieldName: 'caseDescription',
        fieldType: 'textarea',
        label: 'Detailed Case Description',
        required: true,
        order: 11
      },
      {
        fieldName: 'reliefSought',
        fieldType: 'textarea',
        label: 'Relief Sought',
        required: true,
        order: 12
      },
      {
        fieldName: 'caseValue',
        fieldType: 'number',
        label: 'Value of Case (LKR)',
        required: true,
        order: 13
      },
      {
        fieldName: 'incidentDate',
        fieldType: 'date',
        label: 'Date of Incident',
        required: true,
        order: 14
      },
      {
        fieldName: 'filingDate',
        fieldType: 'date',
        label: 'Date of Filing',
        required: true,
        order: 15
      },
      {
        fieldName: 'lawyerName',
        fieldType: 'text',
        label: 'Name of Attorney',
        required: true,
        order: 16
      },
      {
        fieldName: 'lawyerBarNumber',
        fieldType: 'text',
        label: 'Attorney Bar Number',
        required: true,
        order: 17
      },
      {
        fieldName: 'witnesses',
        fieldType: 'textarea',
        label: 'List of Witnesses',
        required: false,
        order: 18
      },
      {
        fieldName: 'evidence',
        fieldType: 'textarea',
        label: 'List of Evidence',
        required: false,
        order: 19
      },
      {
        fieldName: 'previousOrders',
        fieldType: 'textarea',
        label: 'Previous Court Orders',
        required: false,
        order: 20
      }
    ],
    templateContent: `IN THE {{courtName}}

CASE NO: {{caseNumber}}

CASE DETAILS FOR HEARING

Date of Hearing: {{hearingDate}}
Time of Hearing: {{hearingTime}}
Presiding Judge: {{judgeName}}

PARTIES:
Plaintiff: {{plaintiffName}} (NIC: {{plaintiffNIC}})
Defendant: {{defendantName}} (NIC: {{defendantNIC}})

CASE INFORMATION:
Case Type: {{caseType}}
Date of Incident: {{incidentDate}}
Date of Filing: {{filingDate}}
Case Value: LKR {{caseValue}}

CASE DESCRIPTION:
{{caseDescription}}

RELIEF SOUGHT:
{{reliefSought}}

LEGAL REPRESENTATION:
Attorney: {{lawyerName}}
Bar Number: {{lawyerBarNumber}}

WITNESSES:
{{witnesses}}

EVIDENCE:
{{evidence}}

PREVIOUS COURT ORDERS:
{{previousOrders}}

PREPARED BY:
_________________________
{{lawyerName}}
Attorney-at-Law
Bar Number: {{lawyerBarNumber}}

DATE: {{hearingDate}}`,
    courtSpecific: true,
    applicableDistricts: ['All'],
    languages: ['en', 'si'],
    complexity: 'complex',
    estimatedTime: 45,
    requiredDocuments: ['NIC Copies', 'Supporting Documents', 'Evidence', 'Previous Orders'],
    filingFee: 0,
    courtFees: 0,
    isActive: true,
    isPopular: true,
    tags: ['case-details', 'hearing', 'court', 'comprehensive']
  },

  // DIVORCE PETITION
  {
    templateId: 'SL-DIVORCE-001',
    name: 'Divorce Petition',
    description: 'Petition for divorce under Sri Lankan law',
    category: 'Family Law',
    subcategory: 'Divorce',
    documentType: 'Petition',
    fields: [
      {
        fieldName: 'courtName',
        fieldType: 'text',
        label: 'Name of the Court',
        required: true,
        order: 1
      },
      {
        fieldName: 'petitionerName',
        fieldType: 'text',
        label: 'Name of Petitioner',
        required: true,
        order: 2
      },
      {
        fieldName: 'petitionerNIC',
        fieldType: 'text',
        label: 'Petitioner NIC',
        required: true,
        order: 3
      },
      {
        fieldName: 'respondentName',
        fieldType: 'text',
        label: 'Name of Respondent',
        required: true,
        order: 4
      },
      {
        fieldName: 'respondentNIC',
        fieldType: 'text',
        label: 'Respondent NIC',
        required: true,
        order: 5
      },
      {
        fieldName: 'marriageDate',
        fieldType: 'date',
        label: 'Date of Marriage',
        required: true,
        order: 6
      },
      {
        fieldName: 'marriagePlace',
        fieldType: 'text',
        label: 'Place of Marriage',
        required: true,
        order: 7
      },
      {
        fieldName: 'separationDate',
        fieldType: 'date',
        label: 'Date of Separation',
        required: true,
        order: 8
      },
      {
        fieldName: 'groundsForDivorce',
        fieldType: 'dropdown',
        label: 'Grounds for Divorce',
        options: [
          { value: 'Adultery', label: 'Adultery' },
          { value: 'Desertion', label: 'Desertion' },
          { value: 'Cruelty', label: 'Cruelty' },
          { value: 'Incompatibility', label: 'Incompatibility' },
          { value: 'Other', label: 'Other' }
        ],
        required: true,
        order: 9
      },
      {
        fieldName: 'divorceDetails',
        fieldType: 'textarea',
        label: 'Details of Grounds for Divorce',
        required: true,
        order: 10
      },
      {
        fieldName: 'children',
        fieldType: 'textarea',
        label: 'Details of Children (if any)',
        required: false,
        order: 11
      },
      {
        fieldName: 'propertySettlement',
        fieldType: 'textarea',
        label: 'Property Settlement Arrangements',
        required: false,
        order: 12
      }
    ],
    templateContent: `IN THE {{courtName}}

DIVORCE PETITION

PETITIONER: {{petitionerName}} (NIC: {{petitionerNIC}})
RESPONDENT: {{respondentName}} (NIC: {{respondentNIC}})

MARRIAGE DETAILS:
Date of Marriage: {{marriageDate}}
Place of Marriage: {{marriagePlace}}
Date of Separation: {{separationDate}}

GROUNDS FOR DIVORCE:
{{groundsForDivorce}}

DETAILS:
{{divorceDetails}}

CHILDREN:
{{children}}

PROPERTY SETTLEMENT:
{{propertySettlement}}

PRAYER:
The Petitioner respectfully prays that this Honourable Court may be pleased to:

1. Grant a decree of divorce dissolving the marriage between the Petitioner and Respondent;
2. Make such orders as this Honourable Court may deem fit regarding custody and maintenance of children;
3. Make such orders as this Honourable Court may deem fit regarding division of matrimonial property;
4. Grant costs of this action.

Dated this {{filingDate}}.

_________________________
{{petitionerName}}
PETITIONER

_________________________
ATTORNEY-AT-LAW
Attorney for the Petitioner`,
    courtSpecific: true,
    applicableDistricts: ['All'],
    languages: ['en', 'si'],
    complexity: 'intermediate',
    estimatedTime: 25,
    requiredDocuments: ['Marriage Certificate', 'NIC Copies', 'Evidence of Grounds'],
    filingFee: 1000,
    courtFees: 2000,
    isActive: true,
    isPopular: true,
    tags: ['divorce', 'family', 'marriage', 'petition']
  },

  // BAIL APPLICATION
  {
    templateId: 'SL-BAIL-001',
    name: 'Bail Application',
    description: 'Application for bail in criminal cases',
    category: 'Criminal Law',
    subcategory: 'Bail',
    documentType: 'Application',
    fields: [
      {
        fieldName: 'courtName',
        fieldType: 'text',
        label: 'Name of the Court',
        required: true,
        order: 1
      },
      {
        fieldName: 'caseNumber',
        fieldType: 'text',
        label: 'Case Number',
        required: true,
        order: 2
      },
      {
        fieldName: 'accusedName',
        fieldType: 'text',
        label: 'Name of Accused',
        required: true,
        order: 3
      },
      {
        fieldName: 'accusedNIC',
        fieldType: 'text',
        label: 'Accused NIC',
        required: true,
        order: 4
      },
      {
        fieldName: 'accusedAddress',
        fieldType: 'textarea',
        label: 'Accused Address',
        required: true,
        order: 5
      },
      {
        fieldName: 'offence',
        fieldType: 'text',
        label: 'Offence Charged',
        required: true,
        order: 6
      },
      {
        fieldName: 'arrestDate',
        fieldType: 'date',
        label: 'Date of Arrest',
        required: true,
        order: 7
      },
      {
        fieldName: 'bailReasons',
        fieldType: 'textarea',
        label: 'Reasons for Bail',
        required: true,
        order: 8
      },
      {
        fieldName: 'suretyName',
        fieldType: 'text',
        label: 'Name of Surety',
        required: true,
        order: 9
      },
      {
        fieldName: 'suretyNIC',
        fieldType: 'text',
        label: 'Surety NIC',
        required: true,
        order: 10
      },
      {
        fieldName: 'suretyAddress',
        fieldType: 'textarea',
        label: 'Surety Address',
        required: true,
        order: 11
      },
      {
        fieldName: 'bailAmount',
        fieldType: 'number',
        label: 'Bail Amount (LKR)',
        required: true,
        order: 12
      }
    ],
    templateContent: `IN THE {{courtName}}

CASE NO: {{caseNumber}}

BAIL APPLICATION

TO THE HONOURABLE COURT:

The Accused above named respectfully states as follows:

1. The Accused is charged with the offence of {{offence}}.

2. The Accused was arrested on {{arrestDate}} and has been in custody since then.

3. The Accused respectfully submits the following reasons for granting bail:

{{bailReasons}}

4. The Accused undertakes to:
   a) Appear before this Court on all dates fixed for hearing;
   b) Not interfere with witnesses or evidence;
   c) Not commit any offence while on bail;
   d) Comply with all conditions imposed by this Court.

5. Surety Details:
   Name: {{suretyName}}
   NIC: {{suretyNIC}}
   Address: {{suretyAddress}}

6. The Accused is prepared to furnish bail in the sum of LKR {{bailAmount}}.

PRAYER:
The Accused respectfully prays that this Honourable Court may be pleased to grant bail to the Accused on such terms and conditions as this Honourable Court may deem fit.

Dated this {{filingDate}}.

_________________________
{{accusedName}}
ACCUSED

_________________________
ATTORNEY-AT-LAW
Attorney for the Accused`,
    courtSpecific: true,
    applicableDistricts: ['All'],
    languages: ['en', 'si'],
    complexity: 'intermediate',
    estimatedTime: 20,
    requiredDocuments: ['NIC Copies', 'Surety Documents', 'Character Certificate'],
    filingFee: 500,
    courtFees: 1000,
    isActive: true,
    isPopular: true,
    tags: ['bail', 'criminal', 'application', 'court']
  }
];

// Setup function
const setupSriLankanTemplates = async () => {
  try {
    console.log('🇱🇰 Setting up Sri Lankan Legal Document Templates...');
    
    // Get admin user for createdBy field
    const admin = await Staff.findOne({ role: 'admin' });
    if (!admin) {
      console.log('❌ No admin user found. Please create an admin user first.');
      return;
    }

    let createdCount = 0;
    let updatedCount = 0;

    for (const templateData of sriLankanTemplates) {
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
          console.log(`✅ Updated template: ${templateData.name}`);
        } else {
          // Create new template
          const template = new DocumentTemplate({
            ...templateData,
            createdBy: admin._id,
            lastModifiedBy: admin._id
          });
          await template.save();
          createdCount++;
          console.log(`✅ Created template: ${templateData.name}`);
        }
      } catch (error) {
        console.error(`❌ Error processing template ${templateData.name}:`, error.message);
      }
    }

    console.log(`🎉 Setup completed! Created: ${createdCount}, Updated: ${updatedCount}`);
    
    // Display summary
    const totalTemplates = await DocumentTemplate.countDocuments({ isActive: true });
    const categories = await DocumentTemplate.distinct('category', { isActive: true });
    
    console.log(`📊 Total active templates: ${totalTemplates}`);
    console.log(`📂 Categories: ${categories.join(', ')}`);

  } catch (error) {
    console.error('❌ Error setting up templates:', error);
  }
};

module.exports = { setupSriLankanTemplates, sriLankanTemplates };
