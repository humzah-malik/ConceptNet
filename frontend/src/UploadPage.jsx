import React, { useState } from 'react'
import MindMap from './MindMap'

export default function UploadPage() {
    const [graph, setGraph] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
  
    const hashTranscript = async (text) => {
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    };
  
    const fetchFromSupabase = async (hash) => {
      console.log('Checking Supabase cache...');
      const response = await fetch(`http://127.0.0.1:8000/get-cached-graph/${hash}`);
      if (!response.ok) {
        throw new Error(`Supabase fetch failed: ${response.status}`);
      }
      const data = await response.json();
      console.log('Found graph in Supabase');
      return data;
    };
  
    const generateAndStoreGraph = async (text, hash) => {
      console.log('Generating new graph with OpenAI...');
      const response = await fetch('http://127.0.0.1:8000/store-graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Graph generation failed:', errorData);
        throw new Error(errorData.detail || 'Failed to generate graph');
      }
      
      const data = await response.json();
      if (!data || !data.nodes || !data.links) {
        console.error('Invalid graph data received:', data);
        throw new Error('Invalid graph data received from server');
      }
      
      console.log('Graph generated successfully:', {
        nodes: data.nodes.length,
        links: data.links.length
      });
      
      localStorage.setItem(hash, JSON.stringify(data));
      return data;
    };
  
    const handleFileUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
    
      setLoading(true);
      setError(null);
    
      try {
        let text = "";
    
        if (file.name.endsWith(".pdf")) {
          console.log("Uploading PDF...");
          const formData = new FormData();
          formData.append("file", file);
    
          const response = await fetch("http://127.0.0.1:8000/upload-pdf", {
            method: "POST",
            body: formData
          });
    
          if (!response.ok) throw new Error("Failed to extract PDF text");
          const data = await response.json();
          text = data.transcript;
        } else {
          text = await file.text();
        }
    
        const hash = await hashTranscript(text);
        console.log("File hash:", hash);
    
        // Try localStorage first
        const cached = localStorage.getItem(hash);
        if (cached) {
          console.log("Found in localStorage");
          const parsedCache = JSON.parse(cached);
          if (parsedCache && parsedCache.nodes && parsedCache.links) {
            setGraph(parsedCache);
            return;
          }
          console.log("Invalid cache data, checking Supabase...");
        }
    
        // Try Supabase
        try {
          const data = await fetchFromSupabase(hash);
          if (data && data.nodes && data.links) {
            console.log("Storing Supabase data in localStorage");
            localStorage.setItem(hash, JSON.stringify(data));
            setGraph(data);
            return;
          }
        } catch (supabaseError) {
          console.log("Not found in Supabase, generating new graph...");
        }
    
        // Generate and store if not cached
        const data = await generateAndStoreGraph(text, hash);
        setGraph(data);
    
      } catch (err) {
        console.error("Error:", err);
        setError(err.message || "An unexpected error occurred");
        setGraph(null);
      } finally {
        setLoading(false);
      }
    };  
  
    return (
      <div className="p-6 space-y-4">
        <input 
          type="file" 
          accept=".txt,.pdf" 
          onChange={handleFileUpload}
          className="mb-4"
        />
        {loading && (
          <div className="text-blue-600">
            Generating concept map... This may take a minute.
          </div>
        )}
        {error && (
          <div className="text-red-600">
            Error: {error}
          </div>
        )}
        {graph && <MindMap graph={graph} />}
      </div>
    );
}