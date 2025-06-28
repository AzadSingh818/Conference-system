// src/app/api/export/route.js
import { NextResponse } from 'next/server';
import { getAllAbstracts, getStatistics, testConnection } from '@/lib/database-postgres';

// GET - Export abstracts to Excel/JSON from PostgreSQL
export async function GET(request) {
  try {
    // Test database connection
    await testConnection();

    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'json';
    const status = url.searchParams.get('status') || 'all';
    const category = url.searchParams.get('category') || 'all';
    const includeStats = url.searchParams.get('includeStats') !== 'false';

    // Load all abstracts from PostgreSQL
    const abstracts = await getAllAbstracts();
    
    // Apply filters
    let filteredAbstracts = abstracts;
    
    if (status !== 'all') {
      filteredAbstracts = filteredAbstracts.filter(a => a.status === status);
    }
    
    if (category !== 'all') {
      filteredAbstracts = filteredAbstracts.filter(a => a.presentation_type === category);
    }

    // Get statistics from PostgreSQL
    const dbStats = await getStatistics();
    
    // Calculate statistics
    const stats = {
      total: abstracts.length,
      pending: abstracts.filter(a => a.status === 'pending').length,
      approved: abstracts.filter(a => a.status === 'approved').length,
      rejected: abstracts.filter(a => a.status === 'rejected').length,
      // 'Free Paper': abstracts.filter(a => a.presentation_type === 'Free Paper').length,
      'Poster': abstracts.filter(a => a.presentation_type === 'Poster').length,
      // 'E-Poster': abstracts.filter(a => a.presentation_type === 'E-Poster').length,
      'Oral Presentation': abstracts.filter(a => a.presentation_type === 'Oral Presentation').length
    };

    if (format === 'json') {
      // Return JSON format
      return NextResponse.json({
        success: true,
        data: filteredAbstracts,
        stats,
        exportDate: new Date().toISOString(),
        filters: { status, category },
        recordCount: filteredAbstracts.length,
        database: 'PostgreSQL'
      });
    }

    // For Excel format, we'll return JSON with instructions
    // Note: XLSX operations should be done client-side in production
    const excelData = filteredAbstracts.map((abstract, index) => ({
      'S.No': index + 1,
      'Abstract ID': abstract.id,
      'Abstract Number': abstract.abstract_number || `ABST-${String(index + 1).padStart(3, '0')}`,
      'Submission Date': new Date(abstract.submission_date).toLocaleDateString('en-IN'),
      'Presenter Name': abstract.presenter_name,
      'Email': abstract.user_email || 'N/A',
      'Phone': abstract.user_phone || 'N/A',
      'Abstract Title': abstract.title,
      'Co-Authors': abstract.co_authors || 'None',
      'Institution': abstract.institution_name,
      'Presentation Type': abstract.presentation_type,
      'Status': abstract.status.toUpperCase(),
      'Registration ID': abstract.registration_id || 'N/A',
      'File Name': abstract.file_name || 'No file',
      'File Size': abstract.file_size ? `${(abstract.file_size / 1024).toFixed(1)} KB` : '0 KB',
      'Review Date': abstract.updated_at ? new Date(abstract.updated_at).toLocaleDateString('en-IN') : 'Not reviewed',
      'Reviewer Comments': abstract.reviewer_comments || 'No comments',
      'Abstract Content': abstract.abstract_content
    }));

    // Statistics for Excel
    const statsData = [
      { Metric: 'Total Submissions', Value: stats.total },
      { Metric: 'Pending Review', Value: stats.pending },
      { Metric: 'Approved', Value: stats.approved },
      { Metric: 'Rejected', Value: stats.rejected },
      { Metric: '', Value: '' },
      // { Metric: 'Free Paper Presentations', Value: stats['Free Paper'] },
      { Metric: 'Poster Presentations', Value: stats['Poster'] },
      { Metric: 'Oral Presentations', Value: stats['Oral Presentations'] },
      // { Metric: 'Award Paper Presentations', Value: stats['Award Paper'] },
      { Metric: '', Value: '' },
      { Metric: 'Export Date', Value: new Date().toLocaleString('en-IN') },
      { Metric: 'Database', Value: 'PostgreSQL' },
      { Metric: 'Filters Applied', Value: `Status: ${status}, Category: ${category}` },
      { Metric: 'Records Exported', Value: filteredAbstracts.length }
    ];

    // Category summary
    const categoryStats = [
      // { 
      //   Category: 'Free Paper Presentation',
      //   Total: stats['Free Paper'],
      //   Pending: abstracts.filter(a => a.presentation_type === 'Free Paper' && a.status === 'pending').length,
      //   Approved: abstracts.filter(a => a.presentation_type === 'Free Paper' && a.status === 'approved').length,
      //   Rejected: abstracts.filter(a => a.presentation_type === 'Free Paper' && a.status === 'rejected').length
      // },
      { 
        Category: 'Poster Presentation',
        Total: stats['Poster'],
        Pending: abstracts.filter(a => a.presentation_type === 'Poster' && a.status === 'pending').length,
        Approved: abstracts.filter(a => a.presentation_type === 'Poster' && a.status === 'approved').length,
        Rejected: abstracts.filter(a => a.presentation_type === 'Poster' && a.status === 'rejected').length
      },
      // { 
      //   Category: 'E-Poster Presentation',
      //   Total: stats['E-Poster'],
      //   Pending: abstracts.filter(a => a.presentation_type === 'E-Poster' && a.status === 'pending').length,
      //   Approved: abstracts.filter(a => a.presentation_type === 'E-Poster' && a.status === 'approved').length,
      //   Rejected: abstracts.filter(a => a.presentation_type === 'E-Poster' && a.status === 'rejected').length
      // },
      { 
        Category: 'Oral Presentation',
        Total: stats['Oral Presentation'] || 0,
        Pending: abstracts.filter(a => a.presentation_type === 'Award Paper' && a.status === 'pending').length,
        Approved: abstracts.filter(a => a.presentation_type === 'Award Paper' && a.status === 'approved').length,
        Rejected: abstracts.filter(a => a.presentation_type === 'Award Paper' && a.status === 'rejected').length
      }
    ];

    // Return Excel data as JSON (client will convert to Excel)
    const timestamp = new Date().toISOString().split('T')[0];
    const filterSuffix = status !== 'all' ? `_${status}` : '';
    const filename = `APBMT_Abstracts_${timestamp}${filterSuffix}.xlsx`;

    return NextResponse.json({
      success: true,
      format: 'excel-data',
      filename,
      data: {
        abstracts: excelData,
        statistics: includeStats ? statsData : null,
        categoryStats: categoryStats
      },
      metadata: {
        exportDate: new Date().toISOString(),
        database: 'PostgreSQL',
        totalRecords: filteredAbstracts.length,
        filters: { status, category }
      }
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Export failed',
        details: error.message,
        database: 'PostgreSQL'
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
