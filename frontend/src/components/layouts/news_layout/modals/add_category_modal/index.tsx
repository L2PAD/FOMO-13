import React, { FC, useState } from 'react';
import styled from 'styled-components';
import Modal from '../../../../common/modal';
import InputWithLabel from '../../../../common/components_for_modals/input_with_label';
import { ModalRow } from '../../../projects_layouts/modals/creating_project/styles';
import { RemoveButton, SubmitButton } from '../../../../common/global_modals/description_modal/styles';
import createCategory from '../../../../services/categories/createCategory';
import reloadWindow from '../../../../utils/reloadWindow';
import { useQuery } from 'react-query';
import fetchCategories from '../../../../services/categories/fetchCategories';
import ModalSelect from '../../../../common/components_for_modals/modal_select';
import deleteCategory from '../../../../services/categories/deleteCategory';

const Categories = styled.div`
margin-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 12px;

    & .category{
        display: grid;
        align-items: center;
        grid-template-columns: 1.5fr 1fr;

        span{
            font-size: 18px;
            font-weight: var(--font-weight-medium);
        }

        button{
            font-size: 16px;
            padding: 8px 12px;
            margin: 0px;
        }
    }
`

interface Props {
    onClose: () => void;
}

const AddCategoryModal: FC<Props> = ({ onClose }) => {
    const [name, setName] = useState<string>('');
    const [category, setCategory] = useState<string>('');
    const { data, refetch } = useQuery('categories', () => {
        return fetchCategories()
    })

    const confirmAddCategory = async (): Promise<void> => {
        onClose();
        await createCategory({ name, type: 'account', page: 'parsing' });
        await refetch()
    };

    const confirmDeleteCategory = async (id: string): Promise<void> => {
        onClose();
        await deleteCategory(id);
        await refetch()
    };

    return (
        <Modal
            title='Update Categories'
            onClose={onClose}
            variant='small'
        >
            <Categories>
                {
                    (data?.data || []).map((item: any) => {
                        return <div className='category' key={item._id}>
                            <span>
                                {item.name}
                            </span>
                            <RemoveButton
                                type={'fill'}
                                onClick={() => confirmDeleteCategory(item._id)}
                            >
                                Delete
                            </RemoveButton>
                        </div>
                    })
                }
            </Categories>
            <ModalRow>
                <InputWithLabel
                    value={name}
                    placeholder='Blockchain'
                    label='Name'
                    onChange={(value) => setName(value)}
                />
            </ModalRow>

            <SubmitButton onClick={confirmAddCategory} type='fill'>
                Add Category
            </SubmitButton>
        </Modal>
    );
};

export default AddCategoryModal;
