import {useState,useEffect, FC} from 'react';
import ArrowDownIcon from '../Icons/arrow_down_icon';
import {useStyles} from './styles';

const getSortType = (value:string) : string => {
    switch (value) {
        case 'Name (A-Z)':
            return 'a'
        case 'Name (Z-A)':
            return 'z'
        case 'Date (from new)':
            return 'new'
        case 'Date (from old)':
            return 'old'
        default:
            return 'a'
    }
}

interface IProps { 
    defaultValue?:string
    variant?:'default' | 'otc'
    onChange:(value:string) => void
}

const SortByProps : FC<IProps> = ({onChange,variant,defaultValue = 'Name (A-Z)'}) => {
    const [isOpen, setIsOpen] = useState(false)
    const [value, setValue] = useState(defaultValue)

    const {
        wrapper,
        dropdownTitle,
        dropdownWrapper,
    } = useStyles({isOpen})

    const chooseOption = (value: string) => {
        setValue(value)
        variant === 'default' ? onChange(getSortType(value)) : onChange(value)
        setIsOpen(false)
    }

    return (
        <div className={wrapper}>
            <div
                className={dropdownTitle}
                onClick={() => setIsOpen(state => !state)}
            >
                Sort by:
                <span>
                    {value}
                    <ArrowDownIcon />
                </span>
            </div>
            {isOpen && <div className={dropdownWrapper}>
                {
                    variant === 'default'
                    ?
                    <ul>
                    <li onClick={() => chooseOption('Name (A-Z)')}>
                        Name (A-Z)
                    </li>
                    <li onClick={() => chooseOption('Name (Z-A)')}>
                        Name (Z-A)
                    </li>
                    <li onClick={() => chooseOption('Date (from new)')}>
                        Date (from new)
                    </li>
                    <li onClick={() => chooseOption('Date (from old)')}>
                        Date (from old)
                    </li>
                </ul>
                :
                <ul>
                    <li onClick={() => chooseOption('New')}>
                        Date (from new)
                    </li>
                    <li onClick={() => chooseOption('Old')}>
                        Date (from old)
                    </li>
                    <li onClick={() => chooseOption('Low')}>
                        Top reactions (Low)
                    </li>
                    <li onClick={() => chooseOption('High')}>
                        Top reactions (High)
                    </li>
                </ul>
                }
            </div>}
        </div>
    );
};

export default SortByProps;