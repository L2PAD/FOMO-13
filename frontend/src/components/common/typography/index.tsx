import React, {FC} from 'react';

export interface TypographyInterface {
    children: any;
    variant: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
    className?: string;
}

const Typography: FC<TypographyInterface> = ({children, variant, className, ...props}) => {

    switch (variant) {
        case 'p':
            return <p style={{padding: 0, margin: 0, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden'}} {...props} className={className}>{children}</p>
        case 'h1':
            return <h1 style={{padding: 0, margin: 0, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden'}} {...props} className={className}>{children}</h1>
        case 'h2':
            return <h2 style={{padding: 0, margin: 0, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden'}} {...props} className={className}>{children}</h2>
        case 'h3':
            return <h3 style={{padding: 0, margin: 0, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden'}} {...props} className={className}>{children}</h3>
        case 'h4':
            return <h4 style={{padding: 0, margin: 0, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden'}} {...props} className={className}>{children}</h4>
        case 'h5':
            return <h5 style={{padding: 0, margin: 0, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden'}} {...props} className={className}>{children}</h5>
        case 'h6':
            return <h6 style={{padding: 0, margin: 0, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden'}} {...props} className={className}>{children}</h6>
    }
};

export default Typography;