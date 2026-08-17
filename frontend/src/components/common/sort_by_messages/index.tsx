import {useState,useEffect} from 'react';
import { useDispatch } from 'react-redux';
import { sortItems } from '../../../store/slices/searchMessagesSlice';
import ArrowDownIcon from '../Icons/arrow_down_icon';
import {useStyles} from './styles';

const getSortType = (value:string) : string => {
    switch (value) {
        case 'Theme (A-Z)':
            return 'a'
        case 'Theme (Z-A)':
            return 'z'
        case 'Date (from new)':
            return 'new'
        case 'Date (from old)':
            return 'old'
        default:
            return 'a'
    }
}

const SortBy = () => {
    const dispatch = useDispatch()
    const [isOpen, setIsOpen] = useState(false)
    const [value, setValue] = useState('Theme (A-Z)')

    const {
        wrapper,
        dropdownTitle,
        dropdownWrapper,
    } = useStyles({isOpen})

    const chooseOption = (value: string) => {
        setValue(value)
        dispatch(sortItems({type:getSortType(value)}))
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
                <ul>
                    <li onClick={() => chooseOption('Theme (A-Z)')}>
                        Theme (A-Z)
                    </li>
                    <li onClick={() => chooseOption('Theme (Z-A)')}>
                        Theme (Z-A)
                    </li>
                    <li onClick={() => chooseOption('Date (from new)')}>
                        Date (from new)
                    </li>
                    <li onClick={() => chooseOption('Date (from old)')}>
                        Date (from old)
                    </li>
                </ul>
            </div>}
        </div>
    );
};

export default SortBy;