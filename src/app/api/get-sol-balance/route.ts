import { NextResponse } from "next/server";
import { fetchWalletBalance } from "@/utils/lib";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const publicKey = searchParams.get("publicKey");

  if (!publicKey) {
    return NextResponse.json(
      { success: false, error: "Missing public key" },
      { status: 400 }
    );
  }

  try {
    const result = await fetchWalletBalance(
      process.env.SOLANA_RPC_URL as string,
      publicKey,
      "solana"
    );
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error fetching Solana balance:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
