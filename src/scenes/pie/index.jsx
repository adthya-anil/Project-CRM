// pages/GraphPage.js
import React from "react";
import JobTitleDoughnutChart from "../../components/DoughNut"

const Pie = ({isAdmin}) => {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Detailed Demographic & Geographaic Graph</h2>
      <JobTitleDoughnutChart isAdmin={isAdmin} />
    </div>
  );
};

export default Pie;
