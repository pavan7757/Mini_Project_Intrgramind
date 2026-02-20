export default function ResultsList({ results }) {
  return (
    <div className="space-y-6">

      {results.length === 0 ? (
        <div className="text-center py-10 text-gray-500 border rounded-xl bg-gray-50">
          No results found. Try searching something!
        </div>
      ) : (
        results.map((item, index) => (
          <div
            key={index}
            className="p-6 border rounded-2xl shadow-sm hover:shadow-lg transition bg-white"
          >
            <h2 className="text-xl font-bold text-gray-800">
              {item.title}
            </h2>
            <p className="text-gray-600 mt-2">
              {item.snippet}
            </p>
          </div>
        ))
      )}

    </div>
  );
}