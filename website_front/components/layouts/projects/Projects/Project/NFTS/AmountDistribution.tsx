import React from "react";
import dynamic from "next/dynamic";
import { CardWrapper } from "../styles";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

const data = [8, 15, 32, 45];

const AmountDistribution = () => {
  return (
    <CardWrapper variant="default">
      <ReactApexChart
        type="donut"
        options={{
          chart: {
            type: "donut",
          },
          labels: ["NFT", "2-3 NFT", "4-10 NFT", "11-50 NFT"],
          legend: {
            formatter: (legendName: string, opts?: any) =>
              `${legendName}: <b>${data[opts.seriesIndex]}%</b>`,
          },
          colors: ["#58FFAF", "#FFDA58", "#58D7FF", "#FF5858"],
          dataLabels: {
            enabled: false,
          },
          plotOptions: {
            pie: {
              donut: {
                size: "40%",
              },
            },
          },
        }}
        series={data}
        height={200}
        width={400}
      />
    </CardWrapper>
  );
};

export default AmountDistribution;
