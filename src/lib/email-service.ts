// src/lib/email-service.js - VERCEL PRODUCTION READY
const nodemailer = require('nodemailer');

console.log('📧 Email Service Loading...');

// 🔧 VERCEL-OPTIMIZED EMAIL CONFIGURATION
const createEmailTransporter = () => {
  try {
    console.log('🔧 Creating nodemailer transporter...');
    
    // ✅ PROPER NODEMAILER SYNTAX FOR VERCEL
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    console.log('✅ Transporter created successfully');
    return transporter;
  } catch (error) {
    console.error('❌ Transporter creation failed:', error);
    throw new Error(`Email configuration failed: ${error.message}`);
  }
};

// 📧 SEND EMAIL FUNCTION - VERCEL COMPATIBLE
const sendEmail = async (emailData) => {
  try {
    console.log('📧 Starting email send to:', emailData.to);
    
    // Validate email configuration
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('❌ Email credentials missing');
      throw new Error('Email credentials not configured');
    }

    // Create transporter
    const transporter = createEmailTransporter();
    
    // Test connection
    await transporter.verify();
    console.log('✅ Email transporter verified');
    
    // Mail options
    const mailOptions = {
      from: `APBMT 2025 <${process.env.EMAIL_USER}>`,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text
    };

    console.log('📤 Sending email with subject:', emailData.subject);
    
    // Send email
    const result = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully:', result.messageId);
    return {
      success: true,
      messageId: result.messageId,
      to: emailData.to,
      subject: emailData.subject
    };
    
  } catch (error) {
    console.error('❌ Email sending failed:', {
      error: error.message,
      to: emailData.to,
      subject: emailData.subject
    });
    
    return {
      success: false,
      error: error.message,
      to: emailData.to,
      subject: emailData.subject
    };
  }
};

// 📧 STATUS UPDATE EMAIL TEMPLATE
const generateStatusUpdateEmail = (data) => {
  const statusIcon = data.status === 'approved' ? '🎉' : '❌';
  const statusColor = data.status === 'approved' ? '#10B981' : '#EF4444';
  const statusText = data.status.toUpperCase();
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Abstract Review ${statusText}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0; 
          padding: 0; 
          background-color: #f7f7f7; 
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: white; 
          padding: 30px; 
          border-radius: 10px; 
          box-shadow: 0 4px 6px rgba(0,0,0,0.1); 
        }
        .header { 
          text-align: center; 
          padding: 20px 0; 
          border-bottom: 3px solid ${statusColor}; 
          margin-bottom: 30px; 
        }
        .status-badge { 
          display: inline-block; 
          padding: 15px 25px; 
          border-radius: 25px; 
          color: white; 
          font-weight: bold; 
          font-size: 18px; 
          background-color: ${statusColor}; 
        }
        .content { 
          padding: 20px 0; 
        }
        .info-box { 
          background: #f9f9f9; 
          padding: 20px; 
          border-radius: 8px; 
          margin: 20px 0; 
          border-left: 4px solid ${statusColor}; 
        }
        .info-row { 
          display: flex; 
          justify-content: space-between; 
          padding: 8px 0; 
          border-bottom: 1px solid #eee; 
        }
        .label { 
          font-weight: bold; 
          color: #666; 
        }
        .value { 
          color: #333; 
        }
        .comments { 
          background: #fff3cd; 
          padding: 15px; 
          border-radius: 5px; 
          margin: 20px 0; 
          border-left: 4px solid #ffc107; 
        }
        .footer { 
          text-align: center; 
          margin-top: 30px; 
          padding-top: 20px; 
          border-top: 1px solid #eee; 
          color: #666; 
          font-size: 14px; 
        }
        .next-steps {
          background: ${data.status === 'approved' ? '#d1ecf1' : '#f8d7da'};
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid ${data.status === 'approved' ? '#17a2b8' : '#dc3545'};
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${statusIcon} Abstract Review Result</h1>
          <div class="status-badge">${statusText}</div>
        </div>
        
        <div class="content">
          <h2>Dear Dr. ${data.name || 'Presenter'},</h2>
          
          <p>We are writing to inform you about the review status of your abstract submission for <strong>APBMT 2025 Conference</strong>.</p>
          
          <div class="info-box">
            <div class="info-row">
              <span class="label">Abstract Title:</span>
              <span class="value">"${data.title}"</span>
            </div>
            
            <div class="info-row">
              <span class="label">Abstract ID:</span>
              <span class="value">${data.submissionId || data.abstractId}</span>
            </div>
            
            <div class="info-row">
              <span class="label">Category:</span>
              <span class="value">${data.category || 'General'}</span>
            </div>
            
            <div class="info-row">
              <span class="label">Institution:</span>
              <span class="value">${data.institution || 'N/A'}</span>
            </div>
            
            <div class="info-row">
              <span class="label">Review Date:</span>
              <span class="value">${new Date().toLocaleDateString('en-IN')}</span>
            </div>
            
            <div class="info-row">
              <span class="label">Status:</span>
              <span class="value" style="color: ${statusColor}; font-weight: bold;">${statusText}</span>
            </div>
          </div>
          
          ${data.comments ? `
            <div class="comments">
              <h3>💬 Reviewer Comments:</h3>
              <p>${data.comments}</p>
            </div>
          ` : ''}
          
          ${data.status === 'approved' ? `
            <div class="next-steps">
              <h3>🎉 Congratulations! Your Abstract has been APPROVED</h3>
              <p><strong>Next Steps:</strong></p>
              <ul>
                <li>Conference registration is mandatory for participation</li>
                <li>Prepare your presentation according to conference guidelines</li>
                <li>You will receive further details about presentation schedule soon</li>
                <li>Presentation duration: 6 minutes + 2 minutes discussion</li>
                <li>Limit slides to 10-12 for your presentation</li>
              </ul>
            </div>
          ` : `
            <div class="next-steps">
              <h3>❌ Abstract Review Result: NOT ACCEPTED</h3>
              <p>Thank you for your submission. While your abstract was not selected for this conference, we encourage you to:</p>
              <ul>
                <li>Review the feedback provided above</li>
                <li>Consider resubmission for future conferences</li>
                <li>Continue your valuable research work</li>
                <li>Attend the conference as a participant for networking</li>
              </ul>
            </div>
          `}
        </div>
        
        <div class="footer">
          <p><strong>APBMT 2025 - Asia-Pacific Blood and Marrow Transplantation Group</strong></p>
          <p>Annual Meeting on Pediatric Blood and Marrow Transplantation</p>
          <p>📧 For queries, reply to this email or contact organizing committee</p>
          <p style="color: #999; font-size: 12px;">This is an automated email. Please do not reply directly to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Abstract Review Result - ${statusText}
    
    Dear Dr. ${data.name || 'Presenter'},
    
    Your abstract "${data.title}" (ID: ${data.submissionId || data.abstractId}) has been ${statusText}.
    Category: ${data.category || 'General'}
    Institution: ${data.institution || 'N/A'}
    Review Date: ${new Date().toLocaleDateString('en-IN')}
    
    ${data.comments ? `Comments: ${data.comments}` : ''}
    
    Thank you for your submission to APBMT 2025.
    
    Best regards,
    Organizing Committee
    APBMT 2025
  `;

  return {
    to: data.email,
    subject: `${statusIcon} Abstract Review ${statusText}: ${data.submissionId || data.abstractId} | APBMT 2025`,
    html,
    text
  };
};

// 🧪 TEST EMAIL FUNCTION
const sendTestEmail = async (toEmail) => {
  console.log('📧 Sending test email to:', toEmail);
  
  const testEmailData = {
    to: toEmail,
    subject: '✅ APBMT Email System Test - Success!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <div style="background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 5px;">
          <h2>🎉 Email System Test</h2>
          <p>APBMT Conference Management</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <div style="background: #d4edda; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #28a745;">
            ✅ <strong>Email System Working Perfectly!</strong>
          </div>
          
          <p>This is a test email from the APBMT Abstract Submission System.</p>
          
          <p><strong>Test Details:</strong></p>
          <ul>
            <li><strong>Recipient:</strong> ${toEmail}</li>
            <li><strong>Sent:</strong> ${new Date().toLocaleString()}</li>
            <li><strong>System:</strong> Gmail SMTP</li>
            <li><strong>Status:</strong> Email delivery successful</li>
          </ul>
          
          <p>If you received this email, the email notification system is configured correctly and ready for production use.</p>
        </div>
      </div>
    `,
    text: `
APBMT Email System Test - Success!

This is a test email from the APBMT Abstract Submission System.

Test Details:
- Recipient: ${toEmail}
- Sent: ${new Date().toLocaleString()}
- System: Gmail SMTP
- Status: Email delivery successful

If you received this email, the system is working correctly.
    `
  };
  
  const result = await sendEmail(testEmailData);
  return result.success;
};

// 📊 BULK EMAIL FUNCTION
const sendBulkEmails = async (abstractIds, status, comments = '') => {
  try {
    console.log(`📧 Starting bulk email for ${abstractIds.length} abstracts`);
    
    const results = {
      total: abstractIds.length,
      successful: 0,
      failed: 0,
      details: []
    };

    for (let i = 0; i < abstractIds.length; i++) {
      const abstractId = abstractIds[i];
      
      try {
        // Create bulk email data
        const emailData = generateStatusUpdateEmail({
          email: `presenter${abstractId}@example.com`, // This should come from database
          name: `Presenter ${abstractId}`,
          title: `Abstract ${abstractId}`,
          abstractId: abstractId,
          submissionId: `ABST-${abstractId}`,
          status: status,
          comments: comments,
          category: 'General',
          institution: 'Institution'
        });

        const emailResult = await sendEmail(emailData);

        if (emailResult.success) {
          results.successful++;
        } else {
          results.failed++;
        }

        results.details.push(emailResult);

        // Add delay between emails
        if (i < abstractIds.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

      } catch (error) {
        console.error(`❌ Bulk email failed for abstract ${abstractId}:`, error);
        results.failed++;
        results.details.push({
          success: false,
          error: error.message,
          abstractId: abstractId
        });
      }
    }

    console.log(`📊 Bulk email completed: ${results.successful} success, ${results.failed} failed`);
    
    return {
      success: true,
      results: results
    };

  } catch (error) {
    console.error('❌ Bulk email process failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
// 📧 REGISTRATION EMAIL TEMPLATE
const generateRegistrationEmail = (user) => {
  const html = `
    <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
      <div style="background: #007bff; color: white; padding: 20px; border-radius: 8px;">
        <h2>👋 Welcome to Our Platform!</h2>
      </div>
      <div style="background: white; padding: 20px; border-radius: 8px; margin-top: 20px;">
        <p>Hi <strong>${user.full_name}</strong>,</p>
        <p>Thank you for registering.</p>
        <p>Here are your login credentials:</p>
        <ul>
          <li><strong>Email:</strong> ${user.email}</li>
          <li><strong>Password:</strong> ${user.password}</li>
        </ul>
        <p>Use these credentials to log in and start exploring!</p>
      </div>
      <p style="color: #999; font-size: 12px;">This is an automated message. Please do not reply directly to this email.</p>
    </div>
  `;

  const text = `
Welcome to Our Platform!

Hi ${user.full_name},

Thank you for registering.

Here are your login credentials:
Email: ${user.email}
Password: ${user.password}

Use these credentials to log in and start exploring.

(This is an automated message. Please do not reply.)
  `;

  return {
    to: user.email,
    subject: `🎉 Welcome, ${user.full_name}! Your Login Details`,
    html,
    text
  };
};




// Export functions
module.exports = {
  sendEmail,
  generateStatusUpdateEmail,
  sendTestEmail,
  sendBulkEmails,
  generateRegistrationEmail
};

