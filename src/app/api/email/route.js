// src/app/api/email/route.js
import { NextResponse } from 'next/server'
import { 
  sendEmail, 
  generateSubmissionConfirmationEmail,
  generateAdminNotificationEmail,
  generateStatusUpdateEmail,
  sendTestEmail
} from '@/lib/email-service'

// POST - Send various types of emails
export async function POST(request) {
  try {
    const { type, data } = await request.json()

    if (!type) {
      return NextResponse.json(
        { error: 'Email type is required' },
        { status: 400 }
      )
    }

    let emailSent = false
    let emailData = null

    switch (type) {
      case 'submission_confirmation':
        if (!data || !data.email || !data.submissionId) {
          return NextResponse.json(
            { error: 'Missing required data for submission confirmation' },
            { status: 400 }
          )
        }
        
        emailData = generateSubmissionConfirmationEmail(data)
        emailSent = await sendEmail(emailData)
        break

      case 'admin_notification':
        if (!data || !data.email || !data.submissionId) {
          return NextResponse.json(
            { error: 'Missing required data for admin notification' },
            { status: 400 }
          )
        }
        
        emailData = generateAdminNotificationEmail(data)
        emailSent = await sendEmail(emailData)
        break

      case 'status_update':
        if (!data || !data.email || !data.status) {
          return NextResponse.json(
            { error: 'Missing required data for status update' },
            { status: 400 }
          )
        }
        
        emailData = generateStatusUpdateEmail(data)
        emailSent = await sendEmail(emailData)
        break

      case 'test':
        if (!data || !data.email) {
          return NextResponse.json(
            { error: 'Email address required for test' },
            { status: 400 }
          )
        }
        
        emailSent = await sendTestEmail(data.email)
        break

      case 'bulk':
        if (!data || !data.emails || !Array.isArray(data.emails)) {
          return NextResponse.json(
            { error: 'Email array required for bulk send' },
            { status: 400 }
          )
        }

        const bulkResults = []
        for (const emailInfo of data.emails) {
          try {
            const bulkEmailData = {
              to: emailInfo.email,
              subject: data.subject || 'Conference Announcement',
              html: data.html || data.message,
              text: data.text || data.message
            }
            
            const sent = await sendEmail(bulkEmailData)
            bulkResults.push({
              email: emailInfo.email,
              sent,
              error: sent ? null : 'Failed to send'
            })
          } catch (error) {
            bulkResults.push({
              email: emailInfo.email,
              sent: false,
              error: error.message
            })
          }
        }

        const successCount = bulkResults.filter(r => r.sent).length
        return NextResponse.json({
          success: true,
          message: `Bulk email completed: ${successCount}/${bulkResults.length} sent`,
          results: bulkResults,
          summary: {
            total: bulkResults.length,
            sent: successCount,
            failed: bulkResults.length - successCount
          }
        })

      default:
        return NextResponse.json(
          { error: 'Invalid email type' },
          { status: 400 }
        )
    }

    if (emailSent) {
      return NextResponse.json({
        success: true,
        message: `${type.replace('_', ' ')} email sent successfully`,
        type,
        recipient: emailData?.to || 'multiple'
      })
    } else {
      return NextResponse.json(
        { 
          error: `Failed to send ${type.replace('_', ' ')} email`,
          type 
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Email API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// GET - Email system status and configuration
export async function GET(request) {
  try {
    const url = new URL(request.url)
    const action = url.searchParams.get('action')

    if (action === 'status') {
      // Check email configuration
      const config = {
        service: process.env.EMAIL_SERVICE || 'Not configured',
        host: process.env.EMAIL_HOST || 'Not configured',
        user: process.env.EMAIL_USER ? 'Configured' : 'Not configured',
        password: process.env.EMAIL_PASS ? 'Configured' : 'Not configured',
        fromName: process.env.EMAIL_FROM_NAME || 'Not configured',
        adminEmail: process.env.ADMIN_EMAIL || 'Not configured'
      }

      return NextResponse.json({
        success: true,
        message: 'Email system status',
        configuration: config,
        ready: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS)
      })
    }

    if (action === 'test') {
      const testEmail = url.searchParams.get('email')
      
      if (!testEmail) {
        return NextResponse.json(
          { error: 'Test email address required' },
          { status: 400 }
        )
      }

      const testSent = await sendTestEmail(testEmail)
      
      return NextResponse.json({
        success: testSent,
        message: testSent ? 'Test email sent successfully' : 'Test email failed',
        testEmail
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Email API is running',
      endpoints: {
        POST: 'Send emails (submission_confirmation, admin_notification, status_update, test, bulk)',
        'GET?action=status': 'Check email configuration',
        'GET?action=test&email=xxx': 'Send test email'
      }
    })

  } catch (error) {
    console.error('Email GET error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}