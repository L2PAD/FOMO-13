import React, { FC } from 'react';
import RichTextEditor, {
  RichTextEditorProps,
} from '../../components/common/rich_text_editor/RichTextEditor';

export type ActivityRichTextEditorProps = RichTextEditorProps;

const ActivityRichTextEditor: FC<ActivityRichTextEditorProps> = (props) => (
  <RichTextEditor ariaLabel="Activity rich text editor" {...props} />
);

export default ActivityRichTextEditor;
