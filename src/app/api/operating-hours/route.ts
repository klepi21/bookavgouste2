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
    const operatingHours = db.collection('operating_hours');
    
    // Get all operating hours
    const hours = await operatingHours.find({}).toArray();
    
    await client.close();
    return NextResponse.json(hours);
  } catch (error) {
    console.error('Error fetching operating hours:', error);
    return NextResponse.json({ 
      error: 'Σφάλμα φόρτωσης ωρών λειτουργίας.', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { weekday, isActive, timeIntervals } = body;
    
    if (typeof weekday !== 'number' || typeof isActive !== 'boolean' || !Array.isArray(timeIntervals)) {
      return NextResponse.json({ error: 'Invalid operating hours data' }, { status: 400 });
    }
    
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();
    const operatingHours = db.collection('operating_hours');
    
    // Update or create operating hours for this weekday
    await operatingHours.updateOne(
      { weekday },
      { 
        $set: { 
          weekday,
          isActive, 
          timeIntervals,
          updatedAt: new Date() 
        },
        $setOnInsert: { 
          createdAt: new Date() 
        }
      },
      { upsert: true }
    );
    
    await client.close();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating operating hours:', error);
    return NextResponse.json({ error: 'Σφάλμα αποθήκευσης ωρών λειτουργίας.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const weekday = searchParams.get('weekday');
    
    if (!weekday) {
      return NextResponse.json({ error: 'Weekday is required' }, { status: 400 });
    }
    
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();
    const operatingHours = db.collection('operating_hours');
    
    await operatingHours.deleteOne({ weekday: parseInt(weekday) });
    
    await client.close();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting operating hours:', error);
    return NextResponse.json({ error: 'Σφάλμα διαγραφής ωρών λειτουργίας.' }, { status: 500 });
  }
}
