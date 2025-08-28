"use client";

import { QRCodeCanvas } from "qrcode.react";

export default function QRCode({ eventId }: { eventId: string }) {
  const base = process.env.NEXT_PUBLIC_DOMAIN_NAME;
  const url = `${base}/static/index2.html?event=${eventId}`;

  return (
    <div className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-white shadow-sm">
      <QRCodeCanvas value={url} size={160} includeMargin />
      <div className="text-xs text-gray-500 break-all max-w-xs text-center">
        {url}
      </div>
    </div>
  );
}