import React, {FC} from 'react';
import {Link} from 'react-router-dom';
import {useStyles} from './styles';

interface Props {
    options: {title: string, link: string}[];
}

const BreadCrumbs: FC<Props> = ({options}) => {
    const {value, activeValue} = useStyles()

    return (
        <div>
            {options.map((item, i) => {
                return <Link
                    key={i}
                    to={item.link}
                    className={i === options.length - 1 ? activeValue : value}
                >
                    {item.title} {i !== options.length - 1 && '> '}
                </Link>
            })}
        </div>
    );
};

export default BreadCrumbs;