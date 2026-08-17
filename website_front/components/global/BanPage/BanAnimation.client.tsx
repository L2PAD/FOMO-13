"use client";

import { useLottie } from "lottie-react";
import BanAnimation from "../../../assets/animations/Ban.json";

const BanAnimationView = () => {
    const { View } = useLottie({
        loop: true,
        animationData: BanAnimation,
    });

    return View;
};

export default BanAnimationView;
