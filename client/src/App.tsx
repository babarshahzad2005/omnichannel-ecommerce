import { useEffect, useState } from "react";

function App() {
  const [status, setStatus] = useState<string>("loading...");

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus("error"));
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-emerald-400">OmniChannel</h1>
        <p className="text-gray-400">E-Commerce & Inventory Platform</p>
        <p className="text-sm">
          Server:{" "}
          <span className={status === "ok" ? "text-emerald-400" : "text-red-400"}>
            {status}
          </span>
        </p>
      </div>
    </div>
  );
}

export default App;
