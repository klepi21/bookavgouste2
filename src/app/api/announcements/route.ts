import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI as string;

export async function GET(req: NextRequest) {
  try {
    if (!uri) {
      console.error('MONGODB_URI is not defined');
      return NextResponse.json({ error: 'Database configuration error' }, { status: 500 });
    }

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();
    const announcements = db.collection('announcements');
    
    // Get the most recent active announcement
    const result = await announcements.findOne(
      { active: true },
      { sort: { createdAt: -1 } }
    );
    
    await client.close();
    return NextResponse.json(result || null);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json({ 
      error: 'Σφάλμα φόρτωσης ανακοίνωσης.', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, type = 'info' } = body;
    
    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: 'Το μήνυμα είναι υποχρεωτικό.' }, { status: 400 });
    }
    
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();
    const announcements = db.collection('announcements');
    
    // Deactivate all existing announcements
    await announcements.updateMany({}, { $set: { active: false } });
    
    // Create new announcement
    const result = await announcements.insertOne({
      message: message.trim(),
      type: type, // 'info', 'warning', 'success', 'error'
      active: true,
      createdAt: new Date()
    });
    
    await client.close();
    return NextResponse.json({ success: true, announcementId: result.insertedId });
  } catch {
    return NextResponse.json({ error: 'Σφάλμα κατά την αποθήκευση της ανακοίνωσης.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();
    const announcements = db.collection('announcements');
    
    // Deactivate all announcements
    const result = await announcements.updateMany({}, { $set: { active: false } });
    
    await client.close();
    return NextResponse.json({ success: true, deactivatedCount: result.modifiedCount });
  } catch {
    return NextResponse.json({ error: 'Σφάλμα κατά την αφαίρεση της ανακοίνωσης.' }, { status: 500 });
  }
} 