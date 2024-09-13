import { BIP32Factory, type BIP32Interface } from "bip32";
import * as bip39 from "bip39";
import * as bitcoin from "bitcoinjs-lib";
import { NextResponse } from "next/server";
import * as ecc from "tiny-secp256k1";

const bip32 = BIP32Factory(ecc);

let wallet: BIP32Interface | null = null;

export async function POST(request: Request) {
	const { amount } = await request.json();

	if (!amount || isNaN(parseFloat(amount))) {
		return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
	}

	if (!wallet) {
		// Generate a new HD wallet
		const network = bitcoin.networks.testnet;
		const mnemonic = bip39.generateMnemonic();
		const seed = bip39.mnemonicToSeedSync(mnemonic);
		const root = bip32.fromSeed(seed, network);
		wallet = root.derivePath("m/44'/1'/0'/0/0");
	}

	const address = bitcoin.payments.p2pkh({
		pubkey: wallet.publicKey,
		network: bitcoin.networks.testnet,
	})?.address;

	// Create a BIP21 payment URI
	const paymentUri = `bitcoin:${address}?amount=${amount}`;

	return NextResponse.json({
		address,
		amount,
		paymentUri,
	});
}
