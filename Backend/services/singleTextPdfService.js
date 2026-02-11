const PDFDocument = require('pdfkit');

// Professional Sri Lankan Legal Document PDF Generator
class ProfessionalLegalPDFGenerator {
  constructor() {
    this.pageWidth = 595;  // A4 width in points
    this.pageHeight = 842; // A4 height in points
    this.leftMargin = 60;   
    this.rightMargin = 60;  
    this.topMargin = 60;    
    this.bottomMargin = 60; 
    this.contentWidth = this.pageWidth - this.leftMargin - this.rightMargin;
    
    // Colors
    this.primaryColor = '#8B0000'; // Dark red
    this.textColor = '#000000';
    this.borderColor = '#000000';
  }

  // Generate professional legal document PDF
  generateSingleTextLegalDocument(content, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        console.log('📄 Generating professional Sri Lankan legal document PDF...');
        
        const doc = new PDFDocument({
          size: 'A4',
          margins: {
            top: this.topMargin,
            bottom: this.bottomMargin,
            left: this.leftMargin,
            right: this.rightMargin
          }
        });

        const buffers = [];
        doc.on('data', buffer => buffers.push(buffer));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          console.log('✅ Professional legal PDF generated. Size:', pdfData.length, 'bytes');
          resolve(pdfData);
        });

        // Add border to all pages
        doc.on('pageAdded', () => {
          this.addDocumentContainer(doc);
        });

        // Set document metadata
        doc.info.Title = options.title || 'Legal Document';
        doc.info.Author = 'Sri Lankan Legal Document System';
        doc.info.Creator = 'Legal Document Generator';
        doc.info.Keywords = 'legal, document, sri lanka, official';

        // Add document container background
        this.addDocumentContainer(doc);
        
        // Add official document seal
        this.addDocumentSeal(doc);
        
        // Add professional header
        this.addDocumentHeader(doc, options);

        // Parse and format content with professional styling
        this.addFormattedContent(doc, content, options);

        // Add professional signature blocks
        this.addSignatureBlocks(doc, options);

        // End the document
        doc.end();
      } catch (error) {
        console.error('❌ Professional PDF generation error:', error);
        reject(error);
      }
    });
  }

  // Add document container with professional styling
  addDocumentContainer(doc) {
    // Draw main document border
    doc.rect(20, 20, this.pageWidth - 40, this.pageHeight - 40)
       .stroke(this.borderColor, 1);
    
    // Add subtle background
    doc.rect(21, 21, this.pageWidth - 42, this.pageHeight - 42)
       .fillColor('#f8f8f8')
       .fill();
  }

  // Add official document seal
  addDocumentSeal(doc) {
    const sealX = this.pageWidth - 80;
    const sealY = 100;
    const sealRadius = 25;
    
    // Draw circular seal border
    doc.circle(sealX, sealY, sealRadius)
       .stroke(this.primaryColor, 2);
    
    // Add seal text with better spacing
    doc.fontSize(6)
       .font('Times-Bold')
       .fillColor(this.primaryColor)
       .text('OFFICIAL', sealX - 18, sealY - 8, { align: 'center', width: 36 });
    
    doc.fontSize(6)
       .font('Times-Bold')
       .fillColor(this.primaryColor)
       .text('DOCUMENT', sealX - 18, sealY + 2, { align: 'center', width: 36 });
  }

  // Add professional document header
  addDocumentHeader(doc, options) {
    const startY = 80;
    doc.y = startY;
    
    // Country header - centered
    doc.fontSize(18)
       .font('Times-Bold')
       .fillColor(this.primaryColor)
       .text('Democratic Socialist Republic of Sri Lanka', this.leftMargin, doc.y, {
         width: this.contentWidth,
         align: 'center'
       });
    
    doc.moveDown(0.5);
    
    // Main document title - centered
    const title = options.title || 'LEGAL DOCUMENT';
    doc.fontSize(16)
       .font('Times-Bold')
       .fillColor(this.textColor)
       .text(title.toUpperCase(), this.leftMargin, doc.y, {
         width: this.contentWidth,
         align: 'center'
       });
    
    // Draw double underline for title - positioned below the text
    const titleY = doc.y + 5;
    doc.moveTo(this.leftMargin + 50, titleY)
       .lineTo(this.pageWidth - this.rightMargin - 50, titleY)
       .stroke(this.borderColor, 1);
    
    doc.moveTo(this.leftMargin + 50, titleY + 2)
       .lineTo(this.pageWidth - this.rightMargin - 50, titleY + 2)
       .stroke(this.borderColor, 1);
    
    doc.moveDown(1);

    // Add recipient information based on document type - left aligned
    const documentType = this.getDocumentType(options);
    if (documentType === 'driving_license') {
      doc.fontSize(12)
         .font('Times-Roman')
         .fillColor(this.textColor)
         .text('TO: THE COMMISSIONER', this.leftMargin, doc.y);
      doc.text('DEPARTMENT OF MOTOR TRAFFIC', this.leftMargin, doc.y);
      doc.moveDown(1);
    }

    // Add document reference - centered
    const docRef = `Document Reference: SL/${this.getDocumentCode(options)}/${new Date().getFullYear()}/${Math.floor(Math.random() * 10000)}`;
    doc.fontSize(12)
       .font('Times-Roman')
       .fillColor('#555555')
       .text(docRef, this.leftMargin, doc.y, {
         width: this.contentWidth,
         align: 'center'
       });
    
    doc.moveDown(1.5);
  }

  // Get document code based on category
  getDocumentCode(options) {
    const category = (options.category || '').toLowerCase();
    if (category.includes('driving')) return 'DL';
    if (category.includes('contract')) return 'CT';
    if (category.includes('agreement')) return 'AG';
    if (category.includes('application')) return 'AP';
    return 'LD';
  }

  // Add formatted content with proper legal styling
  addFormattedContent(doc, content, options) {
    // Add document date
    this.addDocumentDate(doc, options);
    
    // Parse content and replace form fields with underlined fields
    const processedContent = this.processFormFields(content, options);
    
    // For driving license documents, skip declaration sections and remove duplicate headers
    const documentType = this.getDocumentType(options);
    const skipDeclarations = documentType === 'driving_license';
    
    // Remove duplicate "TO: THE COMMISSIONER" text from content for driving license
    let cleanedContent = processedContent;
    if (documentType === 'driving_license') {
      // Remove duplicate commissioner text
      cleanedContent = cleanedContent.replace(/TO:\s*THE\s*COMMISSIONER/gi, '');
      cleanedContent = cleanedContent.replace(/DEPARTMENT\s*OF\s*MOTOR\s*TRAFFIC/gi, '');
      // Clean up extra newlines
      cleanedContent = cleanedContent.replace(/\n\s*\n\s*\n/g, '\n\n');
    }
    
    // Split content into sections
    const sections = this.parseContentSections(cleanedContent);
    
    sections.forEach((section, index) => {
      if (section.type === 'title') {
        this.addSectionTitle(doc, section.text);
      } else if (section.type === 'declaration' && !skipDeclarations) {
        this.addDeclaration(doc, section.text);
      } else if (section.type === 'signature') {
        this.addSignatureSection(doc, section.text);
      } else {
        this.addRegularText(doc, section.text);
      }
    });
  }

  // Add document date
  addDocumentDate(doc, options) {
    const today = new Date();
    const day = today.getDate();
    const month = today.toLocaleDateString('en-US', { month: 'long' });
    const year = today.getFullYear();
    
    doc.fontSize(12)
       .font('Times-Roman')
       .fillColor(this.textColor)
       .text(`This ${this.addOrdinalSuffix(day)} day of ${month}, ${year}.`, { 
         align: 'right',
         width: this.contentWidth 
       });
    
    doc.moveDown(1);
  }

  // Add ordinal suffix to numbers
  addOrdinalSuffix(num) {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return num + "st";
    if (j === 2 && k !== 12) return num + "nd";
    if (j === 3 && k !== 13) return num + "rd";
    return num + "th";
  }

  // Process form fields and replace with underlined fields
  processFormFields(content, options) {
    let processedContent = content;
    const formData = options.formData || {};
    
    // Get all form data fields and create replacements
    const fieldReplacements = {};
    
    // Add all form data fields
    Object.keys(formData).forEach(key => {
      const value = formData[key];
      if (value && value !== '') {
        fieldReplacements[`{{${key}}}`] = value;
        fieldReplacements[`{{${key.toLowerCase()}}}`] = value;
        fieldReplacements[`{{${key.toUpperCase()}}}`] = value;
      }
    });
    
    // Common field replacements with fallbacks
    const commonReplacements = {
      '{{fullName}}': formData.fullName || '___________________________',
      '{{applicantName}}': formData.applicantName || formData.fullName || '___________________________',
      '{{nicNumber}}': formData.nicNumber || '___________________________',
      '{{address}}': formData.address || '___________________________',
      '{{phoneNumber}}': formData.phoneNumber || '___________________________',
      '{{email}}': formData.email || '___________________________',
      '{{licenseNumber}}': formData.licenseNumber || '___________________________',
      '{{category}}': formData.category || '___________________________',
      '{{reason}}': formData.reason || '___________________________',
      '{{date}}': new Date().toLocaleDateString('en-GB'),
      '{{today}}': new Date().toLocaleDateString('en-GB')
    };
    
    // Merge all replacements
    const allReplacements = { ...fieldReplacements, ...commonReplacements };
    
    // Apply replacements
    Object.keys(allReplacements).forEach(field => {
      processedContent = processedContent.replace(new RegExp(field, 'gi'), allReplacements[field]);
    });
    
    return processedContent;
  }

  // Parse content into structured sections
  parseContentSections(content) {
    const sections = [];
    const lines = content.split('\n');
    let currentSection = { type: 'text', text: '' };

    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      if (this.isSectionTitle(trimmedLine)) {
        if (currentSection.text) {
          sections.push({ ...currentSection });
        }
        sections.push({ type: 'title', text: trimmedLine });
        currentSection = { type: 'text', text: '' };
      } else if (this.isDeclaration(trimmedLine)) {
        if (currentSection.text) {
          sections.push({ ...currentSection });
        }
        sections.push({ type: 'declaration', text: trimmedLine });
        currentSection = { type: 'text', text: '' };
      } else if (this.isSignatureLine(trimmedLine)) {
        if (currentSection.text) {
          sections.push({ ...currentSection });
        }
        sections.push({ type: 'signature', text: trimmedLine });
        currentSection = { type: 'text', text: '' };
      } else {
        currentSection.text += (currentSection.text ? '\n' : '') + line;
      }
    });

    if (currentSection.text) {
      sections.push(currentSection);
    }

    return sections;
  }

  // Check if line is a section title
  isSectionTitle(line) {
    return /^[A-Z][A-Z\s]+:$/.test(line) || 
           /^[A-Z][A-Z\s]+$/.test(line) ||
           line.includes('DETAILS:') ||
           line.includes('DECLARATION:');
  }

  // Check if line is a declaration header (not content)
  isDeclaration(line) {
    return line.toLowerCase().trim() === 'declaration:' || 
           line.toLowerCase().trim() === 'declaration';
  }

  // Check if line is a signature line
  isSignatureLine(line) {
    return line.toLowerCase().includes('signature') || 
           line.toLowerCase().includes('date:');
  }

  // Add section title
  addSectionTitle(doc, title) {
    doc.moveDown(1);
    doc.x = this.leftMargin;
    doc.fontSize(12)
       .font('Times-Bold')
       .fillColor(this.textColor)
       .text(title);
    doc.moveDown(0.3);
  }

  // Add declaration section
  addDeclaration(doc, declaration) {
    doc.moveDown(1);
    doc.x = this.leftMargin;
    doc.fontSize(12)
             .font('Times-Bold')
       .fillColor(this.textColor)
       .text('DECLARATION:');
    doc.moveDown(0.3);
    doc.x = this.leftMargin;
    doc.fontSize(11)
       .font('Times-Roman')
       .fillColor(this.textColor)
       .text(declaration, { 
         width: this.contentWidth,
         align: 'left'
       });
    doc.moveDown(0.5);
  }

  // Add signature section
  addSignatureSection(doc, signatureText) {
    doc.moveDown(1);
    doc.x = this.leftMargin;
        doc.fontSize(10)
           .font('Times-Roman')
       .fillColor(this.textColor)
       .text(signatureText);
    
    // Add signature line
    const lineY = doc.y + 5;
    doc.moveTo(this.leftMargin, lineY)
       .lineTo(this.leftMargin + 200, lineY)
       .stroke(this.borderColor, 1);
    doc.moveDown(1);
  }

  // Add regular text content with form field support
  addRegularText(doc, text) {
    if (!text.trim()) return;
    
    // Format text with proper spacing
    const formattedText = this.formatTextContent(text);
    
    // Reset document position to left margin
    doc.x = this.leftMargin;
    
    // Check if text contains underlined fields (placeholder underscores)
    if (formattedText.includes('___________________________')) {
      this.addTextWithUnderlinedFields(doc, formattedText);
    } else {
      doc.fontSize(12)
         .font('Times-Roman')
         .fillColor(this.textColor)
         .text(formattedText, {
             width: this.contentWidth,
             align: 'left',
           lineGap: 2
         });
    }
    doc.moveDown(0.5);
  }

  // Add text with underlined form fields
  addTextWithUnderlinedFields(doc, text) {
    const parts = text.split('___________________________');
    let currentX = this.leftMargin;
    
    for (let i = 0; i < parts.length; i++) {
      if (parts[i]) {
        // Add regular text
        doc.fontSize(12)
           .font('Times-Roman')
           .fillColor(this.textColor)
           .text(parts[i], currentX, doc.y, { 
             continued: i < parts.length - 1,
             width: this.contentWidth - (currentX - this.leftMargin)
           });
        currentX = doc.x;
      }
      
      if (i < parts.length - 1) {
        // Add underlined field
        const fieldWidth = 150;
        const fieldY = doc.y + 12;
        
        // Draw underline
        doc.moveTo(currentX, fieldY)
           .lineTo(currentX + fieldWidth, fieldY)
           .stroke(this.borderColor, 1);
        
        // Move cursor past the field
        currentX += fieldWidth + 5;
        doc.x = currentX;
      }
    }
  }

  // Format text content for better readability
  formatTextContent(text) {
    return text
      .replace(/\n\s*\n/g, '\n\n') // Normalize paragraph spacing
      .replace(/^\s+|\s+$/gm, ''); // Trim each line
  }

  // Add professional signature blocks based on document type
  addSignatureBlocks(doc, options = {}) {
    // Check if we need a new page for signatures - ultra reduced threshold for tenancy agreements
    const documentType = this.getDocumentType(options);
    const threshold = documentType === 'contract' ? this.pageHeight - 100 : this.pageHeight - 150;
    
    if (doc.y > threshold) {
      doc.addPage();
    }

    doc.moveDown(0.3);

    // Determine document type and add appropriate signature blocks
    
    if (documentType === 'driving_license') {
      this.addDrivingLicenseSignatureBlock(doc, options);
    } else if (documentType === 'contract' || documentType === 'agreement') {
      this.addContractSignatureBlocks(doc, options);
    } else if (documentType === 'application') {
      this.addApplicationSignatureBlock(doc, options);
    } else {
      this.addGenericSignatureBlock(doc, options);
    }
  }

  // Determine document type from options
  getDocumentType(options) {
    const title = (options.title || '').toLowerCase();
    const category = (options.category || '').toLowerCase();
    
    console.log('🔍 Document Type Detection:');
    console.log('  Title:', options.title);
    console.log('  Category:', options.category);
    console.log('  Title (lowercase):', title);
    console.log('  Category (lowercase):', category);
    
    if (title.includes('driving license') || title.includes('duplicate driving') || 
        title.includes('driving licence') || title.includes('duplicate driving') ||
        title.includes('license') || title.includes('licence')) {
      console.log('  ✅ Detected as: driving_license');
      return 'driving_license';
    } else if (title.includes('contract') || title.includes('agreement') || 
               title.includes('tenancy') || title.includes('lease') ||
               category.includes('contract') || category.includes('agreement') ||
               category.includes('tenancy') || category.includes('lease')) {
      console.log('  ✅ Detected as: contract');
      return 'contract';
    } else if (title.includes('application') || title.includes('petition') ||
               category.includes('application') || category.includes('petition')) {
      console.log('  ✅ Detected as: application');
      return 'application';
    } else {
      console.log('  ✅ Detected as: generic');
      return 'generic';
    }
  }

  // Add driving license specific signature block
  addDrivingLicenseSignatureBlock(doc, options = {}) {
    console.log('🚗 Adding driving license signature block');
    
    // Single declaration section - no duplicates
    doc.x = this.leftMargin;
    doc.fontSize(12)
       .font('Times-Bold')
       .fillColor(this.textColor)
       .text('DECLARATION:');
    
    doc.moveDown(0.3);
    
    doc.x = this.leftMargin;
    doc.fontSize(10)
       .font('Times-Roman')
       .fillColor(this.textColor)
       .text('I declare that the above information is true and correct. I will surrender the original license if found.', {
         width: this.contentWidth,
         align: 'left'
       });
    
    doc.moveDown(1);
    
    // Signature section with inline placement
    const clientName = options.clientName || 'Applicant Name';
    
    // Calculate text width to position box correctly
    const signatureLabel = clientName + ': ';
    const signatureLabelWidth = doc.widthOfString(signatureLabel, { fontSize: 10 });
    
    // Add signature label
    doc.x = this.leftMargin;
    doc.fontSize(10)
       .font('Times-Roman')
       .fillColor(this.textColor)
       .text(signatureLabel);
    
    // Create signature text box positioned inline after the label
    const signatureBoxY = doc.y - 8; // Align with text baseline
    const signatureBoxWidth = 200;
    const signatureBoxHeight = 20;
    const signatureBoxX = this.leftMargin + signatureLabelWidth;
    
    // Draw signature box border
    doc.rect(signatureBoxX, signatureBoxY, signatureBoxWidth, signatureBoxHeight)
       .stroke(this.borderColor, 1);
    
    // Add placeholder text inside the box
    doc.fontSize(8)
       .font('Times-Italic')
       .fillColor('#999999')
       .text('Signature', signatureBoxX + 5, signatureBoxY + 6);
    
    doc.moveDown(1.5);
    
    // Date section with inline placement
    const dateLabel = 'Date: ';
    const dateLabelWidth = doc.widthOfString(dateLabel, { fontSize: 10 });
    
    // Add date label
    doc.x = this.leftMargin;
    doc.fontSize(10)
       .font('Times-Roman')
       .fillColor(this.textColor)
       .text(dateLabel);
    
    // Create date box positioned inline after "Date:"
    const dateBoxY = doc.y - 8; // Align with text baseline
    const dateBoxWidth = 120;
    const dateBoxHeight = 20;
    const dateBoxX = this.leftMargin + dateLabelWidth;
    
    // Draw date box border
    doc.rect(dateBoxX, dateBoxY, dateBoxWidth, dateBoxHeight)
       .stroke(this.borderColor, 1);
    
    // Add placeholder text inside the date box
    doc.fontSize(8)
       .font('Times-Italic')
       .fillColor('#999999')
       .text('Date', dateBoxX + 5, dateBoxY + 6);
  }

  // Add contract signature blocks (vendor/purchaser) - ultra simplified
  addContractSignatureBlocks(doc, options = {}) {
    // Add "IN WITNESS WHEREOF" clause
    doc.fontSize(10)
       .font('Times-Roman')
       .fillColor(this.textColor)
       .text('IN WITNESS WHEREOF the parties have set their hands the day and year first above written.', {
         align: 'left',
         width: this.contentWidth
       });
    
    doc.moveDown(0.5);

    // Create ultra compact signature blocks side by side
    const signatureBlockWidth = (this.contentWidth - 10) / 2;
    
    // Left signature block (Vendor/Landlord)
    this.addUltraCompactSignatureBlock(doc, 'LANDLORD', signatureBlockWidth, this.leftMargin, options);
    
    // Right signature block (Tenant)
    this.addUltraCompactSignatureBlock(doc, 'TENANT', signatureBlockWidth, this.leftMargin + signatureBlockWidth + 10, options);
    
    // Add minimal witness section
    doc.moveDown(0.5);
    this.addMinimalWitnessSection(doc, options);
  }

  // Add application signature block
  addApplicationSignatureBlock(doc, options = {}) {
    // Declaration section
    doc.x = this.leftMargin;
    doc.fontSize(12)
       .font('Times-Bold')
       .fillColor(this.textColor)
       .text('DECLARATION:');
    
    doc.moveDown(0.5);
    
    doc.x = this.leftMargin;
    doc.fontSize(11)
       .font('Times-Roman')
       .fillColor(this.textColor)
       .text('I declare that the above information is true and correct to the best of my knowledge.', {
         width: this.contentWidth,
         align: 'left'
       });
    
    doc.moveDown(1);
    
    // Single signature block for applicant with inline styling
    const clientName = options.clientName || 'Applicant Name';
    
    // Calculate text width for inline positioning
    const signatureLabel = clientName + ': ';
    const signatureLabelWidth = doc.widthOfString(signatureLabel, { fontSize: 11 });
    
    // Add signature label
    doc.x = this.leftMargin;
    doc.fontSize(11)
       .font('Times-Roman')
       .fillColor(this.textColor)
       .text(signatureLabel);
    
    // Create signature text box positioned inline
    const signatureBoxY = doc.y - 8;
    const signatureBoxWidth = 200;
    const signatureBoxHeight = 20;
    const signatureBoxX = this.leftMargin + signatureLabelWidth;
    
    // Draw signature box border
    doc.rect(signatureBoxX, signatureBoxY, signatureBoxWidth, signatureBoxHeight)
       .stroke(this.borderColor, 1);
    
    // Add placeholder text inside the box
    doc.fontSize(8)
       .font('Times-Italic')
       .fillColor('#999999')
       .text('Signature', signatureBoxX + 5, signatureBoxY + 6);
    
    doc.moveDown(1.5);
    
    // Date section with inline placement
    const dateLabel = 'Date: ';
    const dateLabelWidth = doc.widthOfString(dateLabel, { fontSize: 11 });
    
    // Add date label
    doc.x = this.leftMargin;
    doc.fontSize(11)
       .font('Times-Roman')
       .fillColor(this.textColor)
       .text(dateLabel);
    
    // Create date box positioned inline
    const dateBoxY = doc.y - 8;
    const dateBoxWidth = 120;
    const dateBoxHeight = 20;
    const dateBoxX = this.leftMargin + dateLabelWidth;
    
    // Draw date box border
    doc.rect(dateBoxX, dateBoxY, dateBoxWidth, dateBoxHeight)
       .stroke(this.borderColor, 1);
    
    // Add placeholder text inside the date box
    doc.fontSize(8)
       .font('Times-Italic')
       .fillColor('#999999')
       .text('Date', dateBoxX + 5, dateBoxY + 6);
  }

  // Add generic signature block
  addGenericSignatureBlock(doc, options = {}) {
    // Single signature block with inline styling
    const clientName = options.clientName || 'Signature';
    
    // Calculate text width for inline positioning
    const signatureLabel = clientName + ': ';
    const signatureLabelWidth = doc.widthOfString(signatureLabel, { fontSize: 11 });
    
    // Add signature label
    doc.x = this.leftMargin;
    doc.fontSize(11)
       .font('Times-Roman')
       .fillColor(this.textColor)
       .text(signatureLabel);
    
    // Create signature text box positioned inline
    const signatureBoxY = doc.y - 8;
    const signatureBoxWidth = 200;
    const signatureBoxHeight = 20;
    const signatureBoxX = this.leftMargin + signatureLabelWidth;
    
    // Draw signature box border
    doc.rect(signatureBoxX, signatureBoxY, signatureBoxWidth, signatureBoxHeight)
       .stroke(this.borderColor, 1);
    
    // Add placeholder text inside the box
    doc.fontSize(8)
       .font('Times-Italic')
       .fillColor('#999999')
       .text('Signature', signatureBoxX + 5, signatureBoxY + 6);
    
    doc.moveDown(1.5);
    
    // Date section with inline placement
    const dateLabel = 'Date: ';
    const dateLabelWidth = doc.widthOfString(dateLabel, { fontSize: 11 });
    
    // Add date label
    doc.x = this.leftMargin;
    doc.fontSize(11)
       .font('Times-Roman')
       .fillColor(this.textColor)
       .text(dateLabel);
    
    // Create date box positioned inline
    const dateBoxY = doc.y - 8;
    const dateBoxWidth = 120;
    const dateBoxHeight = 20;
    const dateBoxX = this.leftMargin + dateLabelWidth;
    
    // Draw date box border
    doc.rect(dateBoxX, dateBoxY, dateBoxWidth, dateBoxHeight)
       .stroke(this.borderColor, 1);
    
    // Add placeholder text inside the date box
    doc.fontSize(8)
       .font('Times-Italic')
       .fillColor('#999999')
       .text('Date', dateBoxX + 5, dateBoxY + 6);
  }

  // Add ultra compact signature block for contracts
  addUltraCompactSignatureBlock(doc, title, width, xOffset, options = {}) {
    const blockY = doc.y;
    
    // Title
    doc.fontSize(9)
       .font('Times-Bold')
       .fillColor(this.textColor)
       .text(`${title}:`, xOffset, blockY);
    
    doc.moveDown(0.2);
    
    // Signature line with inline box
    const signatureLabel = 'Signature: ';
    const signatureLabelWidth = doc.widthOfString(signatureLabel, { fontSize: 8 });
    
    doc.fontSize(8)
       .font('Times-Roman')
       .fillColor(this.textColor)
       .text(signatureLabel, xOffset, doc.y);
    
    // Create compact signature box
    const signatureBoxY = doc.y - 5;
    const signatureBoxWidth = width - 50;
    const signatureBoxHeight = 12;
    const signatureBoxX = xOffset + signatureLabelWidth;
    
    doc.rect(signatureBoxX, signatureBoxY, signatureBoxWidth, signatureBoxHeight)
       .stroke(this.borderColor, 1);
    
    doc.fontSize(6)
       .font('Times-Italic')
       .fillColor('#999999')
       .text('Signature', signatureBoxX + 2, signatureBoxY + 3);
    
    doc.moveDown(0.5);
    
    // Date line with inline box
    const dateLabel = 'Date: ';
    const dateLabelWidth = doc.widthOfString(dateLabel, { fontSize: 8 });
    
    doc.fontSize(8)
       .font('Times-Roman')
       .fillColor(this.textColor)
       .text(dateLabel, xOffset, doc.y);
    
    // Create compact date box
    const dateBoxY = doc.y - 5;
    const dateBoxWidth = 60;
    const dateBoxHeight = 12;
    const dateBoxX = xOffset + dateLabelWidth;
    
    doc.rect(dateBoxX, dateBoxY, dateBoxWidth, dateBoxHeight)
       .stroke(this.borderColor, 1);
    
    doc.fontSize(6)
       .font('Times-Italic')
       .fillColor('#999999')
       .text('Date', dateBoxX + 2, dateBoxY + 3);
  }

  // Add compact signature block for contracts
  addCompactSignatureBlock(doc, title, width, xOffset, options = {}) {
    const blockY = doc.y;
    
    // Title
    doc.fontSize(10)
       .font('Times-Bold')
       .fillColor(this.textColor)
       .text(`${title}:`, xOffset, blockY);
    
    doc.moveDown(0.3);
    
    // Signature line with inline box
    const signatureLabel = 'Signature: ';
    const signatureLabelWidth = doc.widthOfString(signatureLabel, { fontSize: 9 });
    
    doc.fontSize(9)
       .font('Times-Roman')
       .fillColor(this.textColor)
       .text(signatureLabel, xOffset, doc.y);
    
    // Create compact signature box
    const signatureBoxY = doc.y - 6;
    const signatureBoxWidth = width - 60;
    const signatureBoxHeight = 15;
    const signatureBoxX = xOffset + signatureLabelWidth;
    
    doc.rect(signatureBoxX, signatureBoxY, signatureBoxWidth, signatureBoxHeight)
       .stroke(this.borderColor, 1);
    
    doc.fontSize(7)
       .font('Times-Italic')
       .fillColor('#999999')
       .text('Signature', signatureBoxX + 3, signatureBoxY + 4);
    
    doc.moveDown(0.8);
    
    // Date line with inline box
    const dateLabel = 'Date: ';
    const dateLabelWidth = doc.widthOfString(dateLabel, { fontSize: 9 });
    
    doc.fontSize(9)
       .font('Times-Roman')
       .fillColor(this.textColor)
       .text(dateLabel, xOffset, doc.y);
    
    // Create compact date box
    const dateBoxY = doc.y - 6;
    const dateBoxWidth = 80;
    const dateBoxHeight = 15;
    const dateBoxX = xOffset + dateLabelWidth;
    
    doc.rect(dateBoxX, dateBoxY, dateBoxWidth, dateBoxHeight)
       .stroke(this.borderColor, 1);
    
    doc.fontSize(7)
       .font('Times-Italic')
       .fillColor('#999999')
       .text('Date', dateBoxX + 3, dateBoxY + 4);
  }

  // Add professional signature block
  addProfessionalSignatureBlock(doc, title, width, xOffset, options = {}) {
    const blockY = doc.y;
    
    // Signature block title
    doc.fontSize(11)
       .font('Times-Bold')
       .fillColor(this.textColor)
       .text(`SIGNED by the said ${title}`, xOffset, blockY);
    
    doc.moveDown(0.3);
    
    // "In the presence of:" text
    doc.fontSize(10)
       .font('Times-Roman')
       .text('In the presence of:', xOffset, doc.y);
    
    doc.moveDown(1.5);
    
    // Signature line with dots
    const signatureLineY = doc.y;
    doc.fontSize(10)
       .font('Times-Roman')
       .text('...............................................', xOffset, signatureLineY);
    
    doc.moveDown(0.3);
    
    // Name line - use actual client name if available
    const clientName = options.clientName || 'Name Here';
    doc.fontSize(10)
       .font('Times-Italic')
       .text(clientName, xOffset, doc.y);
    
    doc.moveDown(1);
    
    // Stamp placeholder box
    this.addStampPlaceholder(doc, xOffset, doc.y, width - 10);
    
    doc.moveDown(3);
  }

  // Add stamp placeholder box
  addStampPlaceholder(doc, x, y, width) {
    const boxHeight = 50;
    
    // Draw dashed border box using manual line drawing
    this.drawDashedRect(doc, x, y, width, boxHeight);
    
    // Add placeholder text
    doc.fontSize(9)
       .font('Times-Italic')
       .fillColor('#666666')
       .text('Signature & Stamp', {
         x: x + 5,
         y: y + boxHeight / 2 - 5,
         width: width - 10,
         align: 'center'
       });
    
    // Reset color
    doc.fillColor(this.textColor);
  }

  // Draw dashed rectangle manually
  drawDashedRect(doc, x, y, width, height) {
    const dashLength = 3;
    const gapLength = 3;
    
    // Top line
    this.drawDashedLine(doc, x, y, x + width, y, dashLength, gapLength);
    // Right line
    this.drawDashedLine(doc, x + width, y, x + width, y + height, dashLength, gapLength);
    // Bottom line
    this.drawDashedLine(doc, x + width, y + height, x, y + height, dashLength, gapLength);
    // Left line
    this.drawDashedLine(doc, x, y + height, x, y, dashLength, gapLength);
  }

  // Draw dashed line manually
  drawDashedLine(doc, x1, y1, x2, y2, dashLength, gapLength) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const dashCount = Math.floor(distance / (dashLength + gapLength));
    
    for (let i = 0; i < dashCount; i++) {
      const startRatio = i * (dashLength + gapLength) / distance;
      const endRatio = (i * (dashLength + gapLength) + dashLength) / distance;
      
      const startX = x1 + dx * startRatio;
      const startY = y1 + dy * startRatio;
      const endX = x1 + dx * endRatio;
      const endY = y1 + dy * endRatio;
      
      doc.moveTo(startX, startY)
         .lineTo(endX, endY)
         .stroke(this.borderColor, 1);
    }
  }

  // Add minimal witness section for contracts
  addMinimalWitnessSection(doc, options = {}) {
    doc.fontSize(9)
       .font('Times-Bold')
       .fillColor(this.textColor)
       .text('WITNESSES:', { align: 'left' });
    
    doc.moveDown(0.2);

    // Minimal witness 1
    doc.fontSize(8)
       .font('Times-Roman')
       .fillColor(this.textColor)
       .text('1. .....................................');
    
    doc.moveDown(0.1);
    
    // Minimal witness 2
    doc.fontSize(8)
       .font('Times-Roman')
       .fillColor(this.textColor)
       .text('2. .....................................');
  }

  // Add simple witness section for contracts
  addSimpleWitnessSection(doc, options = {}) {
    doc.fontSize(10)
       .font('Times-Bold')
       .fillColor(this.textColor)
       .text('WITNESSES:', { align: 'left' });
    
    doc.moveDown(0.3);

    // Simple witness 1
    doc.fontSize(9)
       .font('Times-Roman')
       .fillColor(this.textColor)
       .text('1. ...............................................');
    
    doc.moveDown(0.2);
    
    // Simple witness 2
    doc.fontSize(9)
       .font('Times-Roman')
       .fillColor(this.textColor)
       .text('2. ...............................................');
  }

  // Add professional witness section
  addProfessionalWitnessSection(doc, options = {}) {
    doc.fontSize(12)
       .font('Times-Bold')
       .fillColor(this.textColor)
       .text('WITNESSES:', { align: 'left' });
    
    doc.moveDown(0.5);

    // Witness 1
    this.addWitnessBlock(doc, 1, options);
    doc.moveDown(1);
    
    // Witness 2
    this.addWitnessBlock(doc, 2, options);
  }

  // Add individual witness block
  addWitnessBlock(doc, witnessNumber, options = {}) {
    const witnessY = doc.y;
    
    // Witness number and signature line
    doc.fontSize(10)
       .font('Times-Roman')
       .text(`${witnessNumber}. ...............................................`, this.leftMargin, witnessY);
    
    doc.moveDown(0.3);
    
    // Name field
    const nameFieldY = doc.y;
    doc.text(`    Name: ___________________________`, this.leftMargin, nameFieldY);
    
    // Draw underline for name
    doc.moveTo(this.leftMargin + 60, nameFieldY + 12)
       .lineTo(this.leftMargin + 250, nameFieldY + 12)
       .stroke(this.borderColor, 1);
    
    doc.moveDown(0.5);
    
    // Address field
    const addressFieldY = doc.y;
    doc.text(`    Address: ___________________________`, this.leftMargin, addressFieldY);
    
    // Draw underline for address
    doc.moveTo(this.leftMargin + 75, addressFieldY + 12)
       .lineTo(this.leftMargin + 280, addressFieldY + 12)
       .stroke(this.borderColor, 1);
    
    doc.moveDown(0.5);
    
    // NIC field
    const nicFieldY = doc.y;
    doc.text(`    NIC: ___________________________`, this.leftMargin, nicFieldY);
    
    // Draw underline for NIC
    doc.moveTo(this.leftMargin + 60, nicFieldY + 12)
       .lineTo(this.leftMargin + 200, nicFieldY + 12)
       .stroke(this.borderColor, 1);
  }

  // Check if document is formal (requires recipient info)
  isFormalDocument(options) {
    const formalTypes = ['driving license', 'application', 'petition', 'affidavit'];
    const title = (options.title || '').toLowerCase();
    return formalTypes.some(type => title.includes(type));
  }

  // Check if document requires witnesses
  requiresWitnesses(options) {
    const witnessTypes = ['agreement', 'contract', 'deed', 'affidavit', 'will'];
    const title = (options.title || '').toLowerCase();
    return witnessTypes.some(type => title.includes(type));
  }
}

// Create instance
const professionalLegalPdfGenerator = new ProfessionalLegalPDFGenerator();

// Export function
const generateSingleTextLegalDocument = (content, options = {}) => {
  return professionalLegalPdfGenerator.generateSingleTextLegalDocument(content, options);
};

module.exports = {
  generateSingleTextLegalDocument,
  ProfessionalLegalPDFGenerator
};
