import { Link, useLocation } from "wouter";
import { Dna } from "lucide-react";

export default function FloatingNav() {
  const [location] = useLocation();
  
  const getActiveSection = () => {
    if (location === "/") return "input";
    if (location.includes("/processing")) return "processing";
    if (location.includes("/results")) return "results";
    if (location.includes("/collaboration")) return "collaboration";
    return "input";
  };
  
  const activeSection = getActiveSection();

  return (
    <nav className="floating-nav fixed top-6 left-1/2 transform -translate-x-1/2 z-50 rounded-full px-6 py-3 shadow-lg">
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <Dna className="text-white w-4 h-4" />
          </div>
          <span className="font-sf-pro font-semibold text-gray-800">VaxPredict Pro</span>
        </div>
        <div className="flex space-x-4">
          <Link href="/">
            <button className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeSection === "input"
                ? "text-blue-500 bg-blue-500/10"
                : "text-gray-600 hover:text-blue-500"
            }`}>
              Input
            </button>
          </Link>
          <button className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeSection === "processing"
              ? "text-blue-500 bg-blue-500/10"
              : "text-gray-600 hover:text-blue-500"
          }`}>
            Process
          </button>
          <button className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeSection === "results"
              ? "text-blue-500 bg-blue-500/10"
              : "text-gray-600 hover:text-blue-500"
          }`}>
            Results
          </button>
          <Link href="/collaboration">
            <button className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeSection === "collaboration"
                ? "text-blue-500 bg-blue-500/10"
                : "text-gray-600 hover:text-blue-500"
            }`}>
              Teams
            </button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
