import React, { FC, useEffect, useState } from 'react';
import { Range as DefaultRange, getTrackBackground } from 'react-range'
import { RangeValues, RangeWrapper } from './styles';
export interface Props {
    min: number;
    max: number;
    values: number[];
    onChange: (value: number[]) => void;
    step: number;
    className?: string;
}

const Range: FC<Props> = (
    {
        min,
        max,
        values,
        onChange,
        className,
        step,
    }
) => {
    const [ranges, setRanges] = useState(values)
    
    useEffect(() => {
        setRanges(values)
    }, [values])

    return (
        <RangeWrapper className={className}>
            <RangeValues>
                <p>
                    {ranges[0]}
                </p>
                <p>
                    {ranges[1]}
                </p>
            </RangeValues>
            <DefaultRange
                onChange={(values) => {
                    setRanges(values)
                    onChange(values)
                }}
                min={min}
                max={max}
                step={step}
                values={ranges}
                renderTrack={({ props, children }) => {
                    return (
                        <div
                            {...props}
                            style={{
                                background: getTrackBackground({
                                    values: [(ranges[0] - min) / ((max - min) / 100), (ranges[1] - min) / ((max - min) / 100)],
                                    colors: ['rgba(4, 165, 132, 0.23)', '#04A584', 'rgba(4, 165, 132, 0.23)'],
                                    min: 0,
                                    max: 100,
                                }),
                                height: '4px',
                                width: '100%',
                                borderRadius: 8,
                            }}
                        >
                            {children}
                        </div>
                    )
                }}
                renderThumb={({ props }) => {
                    return (
                        <div
                            {...props}
                            style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '100%',
                                border: '2px solid white',
                                background: '#04A584',
                                cursor: 'pointer',
                                position: 'absolute',
                            }}
                        />
                    )
                }}
            />
        </RangeWrapper>
    );
};

export default Range;