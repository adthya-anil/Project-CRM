// pages/GraphPage.js
import React from "react";
import LineChart from "../../components/line.jsx";

const Line = ({isAdmin}) => {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Detailed Performance Graph</h2>
      <LineChart isAdmin={isAdmin} />
    </div>
  );
};

export default Line;
