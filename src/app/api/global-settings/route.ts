import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI as string;

export async function GET() {
  try {
    if (!uri) {
      console.error('MONGODB_URI is not defined');
      return NextResponse.json({ error: 'Database configuration error' }, { status: 500 });
    }

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();
    const settings = db.collection('global_settings');
    
    // Get or create default settings
    let globalSettings = await settings.findOne({ type: 'booking_settings' });
    
    if (!globalSettings) {
      // Create default settings
      const defaultSettings = {
        type: 'booking_settings',
        bookingDurationMinutes: 60,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const result = await settings.insertOne(defaultSettings);
      globalSettings = { ...defaultSettings, _id: result.insertedId };
    }
    
    await client.close();
    return NextResponse.json(globalSettings);
  } catch (error) {
    console.error('Error fetching global settings:', error);
    return NextResponse.json({ 
      error: 'Σφάλμα φόρτωσης ρυθμίσεων.', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingDurationMinutes } = body;
    
    if (typeof bookingDurationMinutes !== 'number') {
      return NextResponse.json({ error: 'Invalid settings data' }, { status: 400 });
    }
    
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();
    const settings = db.collection('global_settings');
    
    // Update or create settings
    await settings.updateOne(
      { type: 'booking_settings' },
      { 
        $set: { 
          bookingDurationMinutes, 
          updatedAt: new Date() 
        },
        $setOnInsert: { 
          type: 'booking_settings',
          createdAt: new Date() 
        }
      },
      { upsert: true }
    );
    
    await client.close();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating global settings:', error);
    return NextResponse.json({ error: 'Σφάλμα αποθήκευσης ρυθμίσεων.' }, { status: 500 });
  }
}
