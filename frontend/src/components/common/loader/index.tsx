import { ColorRing } from  'react-loader-spinner'
import { useStyles } from './styles';

export default function Loader() {
    const {wrapper} = useStyles()

    return (
        <div className={wrapper}>
            <ColorRing
              visible={true}
              height="150"
              width="150"
              wrapperClass="blocks-wrapper"
              colors={['#04A584', '#04A584', '#04A584', '#04A584', '#04A584']}
            />
        </div>
    );
}



