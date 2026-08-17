"use client";

import React from "react";
import { useLottie, LottieOptions } from "lottie-react";

type Props = LottieOptions & {
    className?: string;
};

const LottieClient = ({ className, ...options }: Props) => {
    const { View } = useLottie(options);
    return <div className={className}>{View}</div>;
};

export default LottieClient;
