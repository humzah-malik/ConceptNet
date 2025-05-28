import React, { useState } from 'react';
import MindMap from './MindMap'

export default function NewMap() {
  const [text, setText] = useState('');
  const [graph, setGraph] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);

  return (
    <div className="min-h-screen bg-violet-50 px-6 py-8">
        <div className="flex items-center justify-center mt-15">
            <h1 className="text-3xl font-bold text-center">🧠 Create a New Mind Map</h1>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 py-25 max-w-5xl mx-auto mt-8">
        <div className="bg-gray-50 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-2">Paste Transcript</h2>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your transcript text here..."
            className="w-full h-64 p-4 border bg-white rounded-md resize-none"
          />
        </div>

        <div className="bg-gray-50 rounded-lg shadow p-6 flex items-center justify-center">
          <label
            htmlFor="dropzone-file"
            className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-100 hover:bg-gray-200"
          >
            <div className="flex flex-col items-center justify-center pt-10 pb-6">
              <svg
                className="w-8 h-8 mb-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">PDF, TXT, or DOCX</p>
            </div>
            <input id="dropzone-file" type="file" className="hidden" accept=".pdf,.txt,.docx" onChange={(e) => setUploadedFile(e.target.files[0])}/>
          </label>
        </div>
      </div>

      <div className="text-center">
      <button
        className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
        onClick={async () => {
            setLoading(true);
            setError(null);

            try {
            let transcript = text.trim();

            if (!transcript && uploadedFile) {
                if (uploadedFile.name.endsWith(".pdf")) {
                const formData = new FormData();
                formData.append("file", uploadedFile);
                const res = await fetch("http://127.0.0.1:8000/upload-pdf", {
                    method: "POST",
                    body: formData
                });
                if (!res.ok) throw new Error("Failed to extract PDF");
                const data = await res.json();
                transcript = data.transcript;
                } else {
                transcript = await uploadedFile.text();
                }
            }

            if (!transcript) throw new Error("No transcript or file provided");

            const encoder = new TextEncoder();
            const data = encoder.encode(transcript);
            const hashBuffer = await crypto.subtle.digest("SHA-256", data);
            const hash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

            const cached = localStorage.getItem(hash);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (parsed?.nodes && parsed?.links) {
                setGraph(parsed);
                return;
                }
            }

            try {
                const supaRes = await fetch(`http://127.0.0.1:8000/get-cached-graph/${hash}`);
                if (supaRes.ok) {
                const data = await supaRes.json();
                localStorage.setItem(hash, JSON.stringify(data));
                setGraph(data);
                return;
                }
            } catch (err) {
                console.log("Not found in Supabase, generating...");
            }

            const genRes = await fetch("http://127.0.0.1:8000/store-graph", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ transcript })
            });

            if (!genRes.ok) throw new Error("Failed to generate graph");
            const newData = await genRes.json();
            localStorage.setItem(hash, JSON.stringify(newData));
            setGraph(newData);
            } catch (err) {
            console.error(err);
            setError(err.message || "An unexpected error occurred");
            } finally {
            setLoading(false);
            }
        }}
        >
        Create Map
        </button>
      </div>

      {graph && <MindMap graph={graph} />}
      {loading && <p>Loading...</p>}
      {error && <p>{error}</p>}
    </div>
  );
}