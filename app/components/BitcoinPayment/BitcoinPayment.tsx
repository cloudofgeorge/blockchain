"use client";

import { QRCodeSVG } from "qrcode.react";
import React, { useState } from "react";

export const BitcoinPayment: React.FC = () => {
	const [amount, setAmount] = useState("");
	const [address, setAddress] = useState("");
	const [qrCode, setQRCode] = useState("");
	const [paymentStatus, setPaymentStatus] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const generatePaymentRequest = async (event: React.FormEvent) => {
		event.preventDefault();
		setLoading(true);
		setError("");

		try {
			const response = await fetch("/api/generate-payment", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ amount }),
			});

			if (!response.ok) throw new Error("Failed to generate payment request");

			const data = await response.json();
			setAddress(data.address);
			setQRCode(`bitcoin:${data.address}?amount=${amount}`);
			setPaymentStatus("Waiting for payment");
			pollPaymentStatus(data.address);
		} catch (err) {
			setError("Error generating payment request");
		} finally {
			setLoading(false);
		}
	};

	const pollPaymentStatus = async (address: string) => {
		const pollInterval = setInterval(async () => {
			try {
				const response = await fetch(
					`/api/pooling?address=${address}&amount=${amount}`
				);
				if (!response.ok) throw new Error("Failed to check payment status");

				const { isPaid, receivedAmount } = await response.json();
				if (isPaid) {
					setPaymentStatus(`Payment received: ${receivedAmount} BTC`);
					clearInterval(pollInterval);
				} else {
					setPaymentStatus(
						`Waiting for payment. Received so far: ${receivedAmount} BTC`
					);
				}
			} catch (err) {
				console.error("Error checking payment status:", err);
				setPaymentStatus("Error checking payment status");
			}
		}, 10000); // Poll every 10 seconds
	};

	return (
		<div className="w-full max-w-md">
			<form onSubmit={generatePaymentRequest} className="mb-4">
				<input
					type="number"
					value={amount}
					onChange={(event) => setAmount(event.target.value)}
					placeholder="Enter BTC amount"
					className="w-full p-2 border rounded"
					required
				/>
				<button
					type="submit"
					className="w-full mt-2 p-2 bg-blue-500 text-white rounded"
					disabled={loading}
				>
					Generate Payment Request
				</button>
			</form>

			{error && <p className="text-red-500">{error}</p>}

			{qrCode && (
				<div className="text-center flex items-center flex-col">
					<QRCodeSVG value={qrCode} size={256} />
					<p className="mt-2">Address: {address}</p>
					<p className="mt-2">Status: {paymentStatus}</p>
				</div>
			)}
		</div>
	);
};
