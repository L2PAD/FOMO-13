import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { filterItems } from '../../../store/slices/userSlice';
import {FilterIcon} from '../../../assets'
import {
    CheckboxWrapper, DropdownWrapper,
    FilterButton,
    FilterWrapper, Row,
} from './styles';
import Checkbox from '../checkbox';
import Range from '../range';
import ModalSelect from '../components_for_modals/modal_select';
import Typography from '../typography';

export interface IFilterOptions {
    points:{from:number,to:number}
    status:{active:boolean,banned:boolean}
}

const FilterUser = () => {
    const dispatch = useDispatch()
    const [isOpen, setIsOpen] = useState(false)
    const [options,setOptions] = useState<IFilterOptions>({points:{from:0,to:100000},status:{active:true,banned:true}})

    const filterInputsHandler = (name:string,value:any) => {
        setOptions((prev) => {
            return (
                {...prev,[name]:value}
            )
        })
    }

    useEffect(() => {
        dispatch(filterItems(options))    
    },[options])

    return (
        <FilterWrapper >
            <FilterButton onClick={() => setIsOpen(state => !state)}>
                <FilterIcon fill="#00C099" />
                <Typography variant='p'>
                    Filters
                </Typography>
            </FilterButton>
            {isOpen && <DropdownWrapper>
                <Row>
                    <p>Status</p>
                    <CheckboxWrapper>
                        <Checkbox
                            onChange={() => {
                                filterInputsHandler('status',{...options.status,active:!options.status.active})
                            }}
                            active={options.status.active}
                            labelValue='Active'
                        />
                        <Checkbox
                            onChange={() => {
                                filterInputsHandler('status',{...options.status,banned:!options.status.banned})
                            }}
                            active={options.status.banned}
                            labelValue='Blocked'
                        />
                    </CheckboxWrapper>
                </Row>
                <Row>
                    <p>Points</p>
                    <Range
                        min={0}
                        max={100000}
                        values={[options.points.from, options.points.to]}
                        step={10}
                        onChange={(values) => 
                            filterInputsHandler('points',{from:values[0],to:values[1]})
                        }
                    />
                </Row>
                {/* <Row>
                    <p>Fund</p>
                    <ModalSelect
                        label=''
                        items={['fund','fund','fund','fund']}
                        onChange={(value) => console.log(value)}
                        value={'fund'}
                    />
                </Row> */}
            </DropdownWrapper>}
        </FilterWrapper>
    );
};

export default FilterUser;