import React from 'react'

const ErrorIcon = () => {
    return (
        <svg
            width="115"
            height="115"
            viewBox="0 0 115 115"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <rect
                x="10"
                y="10"
                width="95"
                height="95"
                rx="47.5"
                fill="#FF5857"
            />
            <rect
                x="10"
                y="10"
                width="95"
                height="95"
                rx="47.5"
                stroke="#FEF4F5"
                stroke-width="20"
            />
            <path
                d="M70 45L45 70M70 70L45 45"
                stroke="white"
                stroke-width="4"
                stroke-linecap="round"
            />
        </svg>
    )
}

export default ErrorIcon
