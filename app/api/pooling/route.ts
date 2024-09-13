import { NextResponse } from "next/server";

const BLOCKCYPHER_API_URL = "https://api.blockcypher.com/v1/btc/test3";
const CONFIRMATIONS_REQUIRED = 1;

type Response = {
	address: string;
	total_received: number;
	total_sent: number;
	balance: number;
	unconfirmed_balance: number;
	final_balance: number;
	n_tx: number;
	unconfirmed_n_tx: number;
	final_n_tx: number;
	txs: {
		confirmations: number;
		outputs: { addresses: string[]; value: number }[];
	}[];
};

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const address = searchParams.get("address");
	const expectedAmount = searchParams.get("amount");

	if (!address || !expectedAmount) {
		return NextResponse.json(
			{ error: "Address and amount are required" },
			{ status: 400 }
		);
	}

	try {
		const response = await fetch(
			`${BLOCKCYPHER_API_URL}/addrs/${address}/full?limit=50`
		);

		if (response.status === 429) {
			return NextResponse.json(
				{ error: "Rate limit exceeded, please try again later" },
				{ status: 429 }
			);
		}

		if (!response.ok) {
			throw new Error("Failed to fetch address data");
		}

		const data: Response = await response.json();
		const confirmedTxs = data.txs.filter(
			(tx) => tx.confirmations >= CONFIRMATIONS_REQUIRED
		);

		const receivedAmount = confirmedTxs.reduce((total, tx) => {
			const output = tx.outputs.find((out) => out.addresses.includes(address));
			return total + (output ? output.value : 0);
		}, 0);

		const isPaid = receivedAmount >= parseFloat(expectedAmount) * 1e8; // Convert BTC to satoshis

		return NextResponse.json({ isPaid, receivedAmount: receivedAmount / 1e8 });
	} catch (error) {
		console.error("Error checking payment:", error);
		return NextResponse.json(
			{ error: "Failed to check payment status" },
			{ status: 500 }
		);
	}
}
