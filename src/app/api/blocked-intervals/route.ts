import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI as string;

export async function GET(req: NextRequest) {
  try {
    if (!uri) {
      console.error('MONGODB_URI is not defined');
      return NextResponse.json({ error: 'Database configuration error' }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const allFlag = searchParams.get('all');
    
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();
    const blockedIntervals = db.collection('blocked_intervals');
    
    let query = {};
    if (date && !allFlag) {
      query = { date };
    }
    
    const result = await blockedIntervals.find(query).sort({ date: 1, startTime: 1 }).toArray();
    
    await client.close();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching blocked intervals:', error);
    return NextResponse.json({ 
      error: 'Σφάλμα φόρτωσης αποκλεισμένων διαστημάτων.', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!uri) {
      console.error('MONGODB_URI is not defined');
      return NextResponse.json({ error: 'Database configuration error' }, { status: 500 });
    }

    const body = await req.json();
    const { date, startTime, endTime, reason } = body;
    
    if (!date || !startTime || !endTime) {
      return NextResponse.json({ error: 'date, startTime, and endTime are required' }, { status: 400 });
    }
    
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();
    const blockedIntervals = db.collection('blocked_intervals');
    
    // Check for overlapping intervals
    const overlapping = await blockedIntervals.findOne({
      date,
      $or: [
        // New interval starts during existing interval
        { startTime: { $lte: startTime }, endTime: { $gt: startTime } },
        // New interval ends during existing interval
        { startTime: { $lt: endTime }, endTime: { $gte: endTime } },
        // New interval contains existing interval
        { startTime: { $gte: startTime }, endTime: { $lte: endTime } }
      ]
    });
    
    if (overlapping) {
      await client.close();
      return NextResponse.json({ 
        error: 'Υπάρχει ήδη αποκλεισμένο διάστημα που επικαλύπτει με αυτό που προσπαθείτε να προσθέσετε.' 
      }, { status: 400 });
    }
    
    // Add blocked interval
    await blockedIntervals.insertOne({ 
      date, 
      startTime, 
      endTime, 
      reason: reason || '',
      createdAt: new Date() 
    });
    
    await client.close();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding blocked interval:', error);
    return NextResponse.json({ 
      error: 'Σφάλμα κατά την αποκλεισμό του διαστήματος.', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!uri) {
      console.error('MONGODB_URI is not defined');
      return NextResponse.json({ error: 'Database configuration error' }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();
    const blockedIntervals = db.collection('blocked_intervals');
    
    const result = await blockedIntervals.deleteOne({ _id: new (await import('mongodb')).ObjectId(id) });
    
    await client.close();
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Το διάστημα δεν ήταν αποκλεισμένο.' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing blocked interval:', error);
    return NextResponse.json({ 
      error: 'Σφάλμα κατά την ξεαποκλεισμό του διαστήματος.', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
