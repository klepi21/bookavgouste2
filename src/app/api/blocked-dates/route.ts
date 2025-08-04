import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI as string;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const allFlag = searchParams.get('all');
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();
    const blockedDates = db.collection('blocked_dates');
    
    let result;
    if (allFlag) {
      result = await blockedDates.find({}).toArray();
    } else {
      const date = searchParams.get('date');
      if (!date) {
        await client.close();
        return NextResponse.json({ error: 'date required' }, { status: 400 });
      }
      result = await blockedDates.find({ date }).toArray();
    }
    await client.close();
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Σφάλμα φόρτωσης αποκλεισμένων ημερομηνιών.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { date } = body;
    
    if (!date) {
      return NextResponse.json({ error: 'date required' }, { status: 400 });
    }
    
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();
    const blockedDates = db.collection('blocked_dates');
    
    // Check if date is already blocked
    const existing = await blockedDates.findOne({ date });
    if (existing) {
      await client.close();
      return NextResponse.json({ error: 'Η ημερομηνία είναι ήδη αποκλεισμένη.' }, { status: 400 });
    }
    
    // Add blocked date
    await blockedDates.insertOne({ date, createdAt: new Date() });
    await client.close();
    
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Σφάλμα κατά την αποκλεισμό της ημερομηνίας.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    
    if (!date) {
      return NextResponse.json({ error: 'date required' }, { status: 400 });
    }
    
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();
    const blockedDates = db.collection('blocked_dates');
    
    const result = await blockedDates.deleteOne({ date });
    await client.close();
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Η ημερομηνία δεν ήταν αποκλεισμένη.' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Σφάλμα κατά την ξεαποκλεισμό της ημερομηνίας.' }, { status: 500 });
  }
} 