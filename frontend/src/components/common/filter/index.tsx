import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { filterItems } from '../../../store/slices/searchSlice';
import useFetch from '../../hooks/useFetch';
import { FilterIcon } from '../../../assets'
import {
    CheckboxWrapper, DropdownWrapper,
    FilterButton,
    FilterWrapper, Row,
} from './styles';
import Checkbox from '../checkbox';
import Range from '../range';
import Typography from '../typography';
import ModalSelectProject from '../components_for_modals/modal_select-project';

export type ProjectPageFilters = 'market' | 'project'
export type ProjectValidationFilters = 'active' | 'admin' | 'moderator'

export interface IFilterOptions {
    totalRaised: { from: number, to: number },
    projectTypes: Array<ProjectPageFilters>,
    projectValidation: Array<ProjectValidationFilters>,
    selectedFund: any
}

const Filter = () => {
    const dispatch = useDispatch()
    const { data } = useFetch('funds')
    const [isOpen, setIsOpen] = useState(false)
    const [options, setOptions] = useState<IFilterOptions>({
        totalRaised: { from: 0, to: 10000000 },
        projectTypes: ['market', 'project'],
        projectValidation: ['active', 'admin', 'moderator'],
        selectedFund: 'ALL'
    })

    const filterInputsHandler = (name: string, value: any) => {
        setOptions((prev) => {
            return (
                { ...prev, [name]: value }
            )
        })
    }

    const projectTypesFilterHandler = (value: ProjectPageFilters) => {
        if (options.projectTypes.includes(value)) {
            setOptions((prev: IFilterOptions) => {
                return ({
                    ...prev,
                    projectTypes: options.projectTypes.filter((oldValue: ProjectPageFilters) => oldValue !== value)
                })
            })
        } else {
            setOptions((prev: IFilterOptions) => {
                return ({
                    ...prev,
                    projectTypes: [...options.projectTypes, value]
                })
            })
        }
    }

    const projectValidationFilterHandler = (value: ProjectValidationFilters) => {
        if (options.projectValidation.includes(value)) {
            setOptions((prev: IFilterOptions) => {
                return ({
                    ...prev,
                    projectValidation: options.projectValidation.filter((oldValue: ProjectValidationFilters) => oldValue !== value)
                })
            })
        } else {
            setOptions((prev: IFilterOptions) => {
                return ({
                    ...prev,
                    projectValidation: [...options.projectValidation, value]
                })
            })
        }
    }

    useEffect(() => {
        dispatch(filterItems(options))
    }, [options])

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
                    <p>Page</p>
                    <CheckboxWrapper>
                        <Checkbox
                            onChange={() => projectTypesFilterHandler('market')}
                            active={options.projectTypes.includes('market')}
                            labelValue='Crypto Market'
                        />
                        <Checkbox
                            onChange={() => projectTypesFilterHandler('project')}
                            active={options.projectTypes.includes('project')}
                            labelValue="ICO Projects"
                        />
                    </CheckboxWrapper>
                </Row>
                <Row>
                    <p>Validation status</p>
                    <CheckboxWrapper>
                        <Checkbox
                            onChange={() => projectValidationFilterHandler('active')}
                            active={options.projectValidation.includes('active')}
                            labelValue='Active'
                        />
                        <Checkbox
                            onChange={() => projectValidationFilterHandler('admin')}
                            active={options.projectValidation.includes('admin')}
                            labelValue="Admin"
                        />
                        <Checkbox
                            onChange={() => projectValidationFilterHandler('moderator')}
                            active={options.projectValidation.includes('moderator')}
                            labelValue='Moderator'
                        />
                    </CheckboxWrapper>
                </Row>
                <Row>
                    <p>Total raised</p>
                    <Range
                        min={0}
                        max={10000000}
                        values={[options.totalRaised.from, options.totalRaised.to]}
                        step={10000}
                        onChange={(values) =>
                            filterInputsHandler('totalRaised', { from: values[0], to: values[1] })
                        }
                    />
                </Row>
                {/* <Row>
                    <p>Fund</p>
                    <ModalSelectProject
                    items={data?.data ? ['ALL',...data.data] : []}
                    label=''
                    name={options.selectedFund ? options.selectedFund.name : 'ALL'}
                    project={options.selectedFund ? options.selectedFund : {}}
                    onChange={(fund:any) => filterInputsHandler('selectedFund',fund)}
                    />
                </Row> */}
            </DropdownWrapper>}
        </FilterWrapper>
    );
};

export default Filter;