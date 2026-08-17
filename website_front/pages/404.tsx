import React from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import animation404 from "../assets/animations/404.json";

const Lottie404 = dynamic(
  () =>
    import("lottie-react").then((mod) => {
      return function LottieComponent() {
        const { useLottie } = mod;
        const { View } = useLottie({
          loop: true,
          animationData: animation404,
        });
        return View;
      };
    }),
  { ssr: false }
);

const Page404 = () => {
  const router = useRouter();

  return (
    <div className="wrapper-404-page">
      <Lottie404 />
      <button onClick={() => router.back()}>Back</button>
    </div>
  );
};

export default Page404;
