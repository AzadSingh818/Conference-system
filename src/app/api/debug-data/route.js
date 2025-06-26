import { NextResponse } from 'next/server';
import { getAllAbstracts, testConnection } from '../../../lib/database-postgres.js';

export async function GET() {
  try {
    console.log('🔍 Debug API: Starting check');
    
    await testConnection();
    console.log('✅ Database connected');
    
    const abstracts = await getAllAbstracts();
    console.log(`📊 Found ${abstracts.length} abstracts`);
    
    if (abstracts.length > 0) {
      console.log('📋 First abstract:', abstracts[0]);
    }
    
    return NextResponse.json({
      success: true,
      totalAbstracts: abstracts.length,
      sampleAbstract: abstracts[0] || null,
      abstractIds: abstracts.map(a => a.id),
      abstractStatuses: abstracts.map(a => ({ id: a.id, status: a.status })),
      allFields: abstracts.length > 0 ? Object.keys(abstracts[0]) : []
    });
    
  } catch (error) {
    console.error('❌ Debug error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
