import { useState } from "react";
import SearchBar from "../components/SearchBar";
import ResultsList from "../components/ResultsList";
import AddDocument from "../components/AddDocument";

export default function Home() {
  const [results, setResults] = useState([]);

  const handleSearch = (query) => {
    console.log("Searching:", query);

    setResults([
      { title: "Node JS Guide", snippet: "Node.js is a backend runtime environment built on Chrome's V8 engine." },
      { title: "MongoDB Tutorial", snippet: "MongoDB is a NoSQL database that stores data in flexible JSON-like documents." },
    ]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl p-10 space-y-10">

        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-800">
            🔎 Inverted Index Search Engine
          </h1>
          <p className="text-gray-500 mt-2">
            Fast document search powered by indexing
          </p>
        </div>

        <SearchBar onSearch={handleSearch} />
        <ResultsList results={results} />
        <AddDocument />

      </div>
    </div>
  );
}