import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const PLANS_FILE = path.join(process.cwd(), "data", "plans_db.json");

function readPlans(): any[] {
  try {
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
    fs.writeFileSync(PLANS_FILE, JSON.stringify({ plans }, null, 2));
  } catch (e) {
    console.error("Error writing plans database:", e);
  }
}

// 1. GET SINGLE SHARED PLAN BY ID (PUBLIC DIRECT ACCESS)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const allPlans = readPlans();
    const plan = allPlans.find(p => p.id === id);
    if (!plan) {
      return NextResponse.json({ error: "The requested travel itinerary was not found, or it was deleted by the author." }, { status: 404 });
    }
    return NextResponse.json(plan);
  } catch (err: any) {
    console.error("Error reading shared plan:", err);
    return NextResponse.json({ error: "Could not query specific plan ID." }, { status: 500 });
  }
}

// 2. DELETE TRIP PLAN (SECURED BY email query)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    if (!email) {
      return NextResponse.json({ error: "User creator parameters required to authenticate deletion." }, { status: 400 });
    }

    const allPlans = readPlans();
    const targetPlan = allPlans.find(p => p.id === id);
    if (!targetPlan) {
      return NextResponse.json({ error: "Itinerary could not be identified." }, { status: 404 });
    }

    if (targetPlan.userEmail && targetPlan.userEmail.toLowerCase() !== String(email).toLowerCase()) {
      return NextResponse.json({ error: "Forbidden. You do not hold ownership permission over this itinerary." }, { status: 403 });
    }

    const activeFiltered = allPlans.filter(p => p.id !== id);
    writePlans(activeFiltered);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error deleting plan:", err);
    return NextResponse.json({ error: "Failed to delete plan record." }, { status: 500 });
  }
}
