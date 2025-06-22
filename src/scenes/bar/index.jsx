// pages/GraphPage.js
import React from "react";

import PerformanceChart from "../../components/Barstack";

const Bar = ({isAdmin}) => {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Detailed STATISTICS Graph</h2>
      <PerformanceChart isAdmin={isAdmin}/>
    </div>
  );
};

export default Bar;
