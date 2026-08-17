import {useState,useEffect} from 'react';
import { useDispatch } from 'react-redux';
import { sortItems } from '../../../store/slices/userSlice';
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

const SortUsers = () => {
    const dispatch = useDispatch()
    const [isOpen, setIsOpen] = useState(false)
    const [value, setValue] = useState('Name (A-Z)')

    const {
        wrapper,
        dropdownTitle,
        dropdownWrapper,
    } = useStyles({isOpen})

    const chooseOption = (value: string) => {
        setValue(value)
        setIsOpen(false)
    }

    useEffect(() => {
        dispatch(sortItems({type:getSortType(value)}))
    },[value])

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
            </div>}
        </div>
    );
};

export default SortUsers;