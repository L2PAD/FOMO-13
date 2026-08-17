import React from 'react'

interface IProps {
    stroke?: string
}

const DropdownIcon: React.FC<IProps> = ({ stroke = '#738094' }) => {
    return (
        <svg width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L6.00081 5.58L11 1" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

export default DropdownIcon
