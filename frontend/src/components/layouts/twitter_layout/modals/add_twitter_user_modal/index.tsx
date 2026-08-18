import React, { FC, useState } from 'react';
import Modal from '../../../../common/modal';
import InputWithLabel from '../../../../common/components_for_modals/input_with_label';
import { ModalRow } from '../../../projects_layouts/modals/creating_project/styles';
import { SubmitButton } from '../../../../common/global_modals/description_modal/styles';
import addTwitter from '../../../../services/news/addTwitter';
import reloadWindow from '../../../../utils/reloadWindow';
import ModalSelect from '../../../../common/components_for_modals/modal_select';
import { useQuery } from 'react-query';
import fetchCategories from '../../../../services/categories/fetchCategories';

interface Props {
    onClose: () => void;
}

const AddTwitterUserModal: FC<Props> = ({ onClose }) => {
    const [username, setUsername] = useState<string>('')
    const [keywords, setKeywords] = useState<string>('')
    const [category, setCategory] = useState<string>('');
    const { data } = useQuery('categories', () => {
        return fetchCategories()
    },{refetchOnWindowFocus:false})

    const confrimAddAcc = async (): Promise<void> => {
        if (!username) return

        onClose()
        await addTwitter(username, keywords)
        reloadWindow()
    }

    return (
        <Modal
            title='Add twitter acc'
            onClose={onClose}
            variant='small'
        >
            <ModalRow>
                <ModalSelect
                    label='Category'
                    items={data?.data?.map((item: any) => item.name) || []}
                    onChange={(value: string, name: string) => {
                        setCategory(value)
                    }}
                    value={category}
                />
            </ModalRow>
            <ModalRow>
                <InputWithLabel
                    value={username}
                    label='Username'
                    placeholder='Bitcoin'
                    onChange={(value) => setUsername(value)}
                />
            </ModalRow>
            <ModalRow>
                <InputWithLabel
                    value={keywords}
                    placeholder='crypto,trending,news'
                    label='Keywords'
                    onChange={(value) => setKeywords(value)}
                />
            </ModalRow>
            <SubmitButton onClick={confrimAddAcc} type='fill'>
                Save changes
            </SubmitButton>
        </Modal>
    );
};

export default AddTwitterUserModal;
