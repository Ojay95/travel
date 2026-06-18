import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const PLANS_FILE = path.join(process.cwd(), "data", "plans_db.json");

function initPlansDb() {
  const dir = path.dirname(PLANS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(PLANS_FILE)) {
    fs.writeFileSync(PLANS_FILE, JSON.stringify({ plans: [] }, null, 2));
  }
}

function readPlans(): any[] {
  try {
    initPlansDb();
    if (!fs.existsSync(PLANS_FILE)) return [];
    const data = fs.readFileSync(PLANS_FILE, "utf-8");
    return JSON.parse(data).plans || [];
  } catch (e) {
    console.error("Error reading plans database:", e);
    return [];
  }
}

function writePlans(plans: any[]) {
  try {
    initPlansDb();
    fs.writeFileSync(PLANS_FILE, JSON.stringify({ plans }, null, 2));
  } catch (e) {
    console.error("Error writing plans database:", e);
  }
}

// 1. GET ALL PLANS FOR LOGGED-IN EMAIL (SYNC)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    if (!email) {
      return NextResponse.json({ error: "Email query parameter is required to load sync logs." }, { status: 400 });
    }
    const allPlans = readPlans();
    const userPlans = allPlans.filter(p => p.userEmail && p.userEmail.toLowerCase() === String(email).toLowerCase());
    return NextResponse.json(userPlans);
  } catch (err: any) {
    console.error("Error fetching user plans:", err);
    return NextResponse.json({ error: "Internal database read failure." }, { status: 500 });
  }
}

// 2. POST SAVE OR UPDATE TRIP PLAN (SECURED BY email)
export async function POST(req: NextRequest) {
  try {
    const { plan, userEmail } = await req.json();
    if (!plan || !plan.id) {
      return NextResponse.json({ error: "Missing plan payload or ID identifier value." }, { status: 400 });
    }
    if (!userEmail) {
      return NextResponse.json({ error: "Authorization credentials (email) required to save." }, { status: 400 });
    }

    const allPlans = readPlans();
    const targetIdx = allPlans.findIndex(p => p.id === plan.id);
    const planToSave = { 
      ...plan, 
      userEmail: userEmail.toLowerCase(),
      updatedAt: new Date().toISOString()
    };

    if (targetIdx > -1) {
      // Security Check: Only the original creator can update
      const existing = allPlans[targetIdx];
      if (existing.userEmail && existing.userEmail.toLowerCase() !== userEmail.toLowerCase()) {
        return NextResponse.json({ error: "Forbidden. You are not authorized to revise this shared plan." }, { status: 403 });
      }
      allPlans[targetIdx] = planToSave;
    } else {
      allPlans.unshift(planToSave);
    }

    writePlans(allPlans);
    return NextResponse.json({ success: true, plan: planToSave });
  } catch (err: any) {
    console.error("Error saving plan:", err);
    return NextResponse.json({ error: "Failed to persist itinerary inside database." }, { status: 500 });
  }
}
