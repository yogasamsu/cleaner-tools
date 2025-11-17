"use client";

import React, { useState } from "react";

type Contact = {
  name: string;
  title: string;
  phone: string;
  email: string;
  url: string;
};

function extractEmail(block: string): string {
  const emailRegex =
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
  const match = block.match(emailRegex);
  return match ? match[0] : "";
}

function extractPhone(block: string): string {
  // Cari nomor dengan +62 / 0xx / (xxx) xxx dst
  const phoneRegex =
    /(\+?\d[\d\.\-\s\(\)]{6,}\d)/g;
  const matches = block.match(phoneRegex);
  if (!matches) return "";
  // Ambil yang paling panjang (biasanya yg paling relevan)
  const sorted = matches.sort(
    (a, b) => b.length - a.length
  );
  return sorted[0].trim();
}

function extractUrl(block: string): string {
  const urlRegex =
    /(https?:\/\/[^\s]+)/i;
  const match = block.match(urlRegex);
  return match ? match[0] : "";
}

function extractNameAndTitle(
  firstLine: string
): { name: string; title: string } {
  // Pola "Nama - Jabatan bla bla"
  const dashMatch = firstLine.match(
    /^(.+?)\s*-\s*(.+)$/
  );
  if (dashMatch) {
    return {
      name: dashMatch[1].trim(),
      title: dashMatch[2].trim(),
    };
  }

  // Pola "Nama · Jabatan · Perusahaan"
  const dotParts = firstLine.split("·");
  if (dotParts.length >= 2) {
    return {
      name: dotParts[0].trim(),
      title: dotParts.slice(1).join("·").trim(),
    };
  }

  // fallback: anggap first line = nama saja
  return {
    name: firstLine.trim(),
    title: "",
  };
}

function parseRaw(text: string): Contact[] {
  // Pisah per "blok" dengan baris kosong
  const blocks = text
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  const contacts: Contact[] = blocks.map((block) => {
    const lines = block
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const firstLine = lines[0] || "";
    const { name, title } = extractNameAndTitle(firstLine);
    const email = extractEmail(block);
    const phone = extractPhone(block);
    const url = extractUrl(block);

    return {
      name,
      title,
      phone,
      email,
      url,
    };
  });

  // Filter yang benar-benar kosong semua
  return contacts.filter(
    (c) =>
      c.name ||
      c.title ||
      c.phone ||
      c.email ||
      c.url
  );
}

function contactsToCSV(contacts: Contact[]): string {
  const header = [
    "nama",
    "jabatan",
    "phone",
    "email",
    "url",
  ];
  const rows = contacts.map((c) => [
    c.name,
    c.title,
    c.phone,
    c.email,
    c.url,
  ]);

  const escape = (value: string) => {
    const v = value.replace(/"/g, '""');
    return `"${v}"`;
  };

  const csvLines = [
    header.map(escape).join(","),
    ...rows.map((row) =>
      row.map(escape).join(",")
    ),
  ];

  return csvLines.join("\n");
}

export default function HomePage() {
  const [rawText, setRawText] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [copied, setCopied] = useState(false);

  const handleClean = () => {
    const parsed = parseRaw(rawText);
    setContacts(parsed);
    setCopied(false);
  };

  const handleCopyCSV = async () => {
    const csv = contactsToCSV(contacts);
    try {
      await navigator.clipboard.writeText(csv);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Failed to copy CSV", e);
      alert("Gagal copy ke clipboard.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-5xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Google Result Cleaner
          </h1>
          <p className="text-sm text-slate-300">
            Paste hasil Google / LinkedIn di bawah,
            lalu klik <span className="font-semibold">
              Clean Data
            </span>{" "}
            untuk di-convert jadi tabel kontak.
          </p>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-200">
              Raw Google / LinkedIn Result
            </label>
            <textarea
              className="w-full h-80 rounded-2xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
              placeholder={`Contoh:\n\nFardian Yulizar - Assistant Analyst Pelaporan Audit di PT ...\nLinkedIn · Fardian Yulizar\n190+ pengikut\nPadang, Sumatera Barat, Indonesia · Assistant Analyst Pelaporan Audit · PT PLN (Persero)\nPhone : +62 ...\nEmail : example@mail.com\nhttps://id.linkedin.com/...`}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
            />
            <button
              onClick={handleClean}
              className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors"
            >
              Clean Data
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-medium text-slate-200">
                Hasil Parsed (Tabel Kontak)
              </h2>
              <button
                onClick={handleCopyCSV}
                disabled={contacts.length === 0}
                className={`inline-flex items-center justify-center rounded-full px-4 py-1.5 text-xs font-semibold border transition-colors ${
                  contacts.length === 0
                    ? "border-slate-700 text-slate-500 cursor-not-allowed"
                    : "border-emerald-500 text-emerald-300 hover:bg-emerald-500 hover:text-slate-950"
                }`}
              >
                {copied ? "Copied CSV ✅" : "Copy as CSV"}
              </button>
            </div>

            <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/60">
              <div className="max-h-80 overflow-auto">
                <table className="min-w-full text-xs">
                  <thead className="bg-slate-900/80 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold border-b border-slate-800">
                        Nama
                      </th>
                      <th className="px-3 py-2 text-left font-semibold border-b border-slate-800">
                        Jabatan
                      </th>
                      <th className="px-3 py-2 text-left font-semibold border-b border-slate-800">
                        Phone
                      </th>
                      <th className="px-3 py-2 text-left font-semibold border-b border-slate-800">
                        Email
                      </th>
                      <th className="px-3 py-2 text-left font-semibold border-b border-slate-800">
                        URL
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-3 py-4 text-center text-slate-500"
                        >
                          Belum ada data. Paste teks dan klik{" "}
                          <span className="font-semibold">
                            Clean Data
                          </span>
                          .
                        </td>
                      </tr>
                    ) : (
                      contacts.map((c, idx) => (
                        <tr
                          key={idx}
                          className={
                            idx % 2 === 0
                              ? "bg-slate-900/40"
                              : "bg-slate-900/10"
                          }
                        >
                          <td className="px-3 py-2 border-b border-slate-800">
                            {c.name}
                          </td>
                          <td className="px-3 py-2 border-b border-slate-800">
                            {c.title}
                          </td>
                          <td className="px-3 py-2 border-b border-slate-800 whitespace-nowrap">
                            {c.phone}
                          </td>
                          <td className="px-3 py-2 border-b border-slate-800">
                            {c.email}
                          </td>
                          <td className="px-3 py-2 border-b border-slate-800 max-w-[200px] truncate">
                            {c.url}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {contacts.length > 0 && (
              <p className="text-[11px] text-slate-400">
                Parsed {contacts.length} kontak. Kalau pola
                Google berubah, kita bisa adjust regex di
                parser.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
