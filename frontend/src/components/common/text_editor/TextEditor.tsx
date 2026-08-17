import React,{ useState, FC } from 'react';
import {Editor} from "react-draft-wysiwyg";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import { convertFromHTML, EditorState, ContentState } from 'draft-js';
import draftToHtml from 'draftjs-to-html'
import htmlToDraft from 'html-to-draftjs';

interface IProps {
  value: string
  onChange: (value:string,name:string) => void
  name?:string
}

const TextEditor : FC<IProps> = ({value,onChange,name}) => {
    const htmlToDraftBlocks = (html : string) : EditorState => {
    const blocksFromHtml = htmlToDraft(html);
    
    const { contentBlocks, entityMap } = blocksFromHtml;

    const contentState = ContentState.createFromBlockArray(contentBlocks, entityMap);

    const editorState = EditorState.createWithContent(contentState);

    return editorState;
    } 

    const [editorState, setEditorState] = useState<EditorState>(
      value.length
      ?
      htmlToDraftBlocks(value)
      :
      EditorState.createEmpty()
    );

    return (
        <Editor
          editorState={editorState}
          toolbarClassName="toolbarClassName"
          wrapperClassName="wrapperClassName"
          editorClassName="editorClassName"
          onEditorStateChange={setEditorState}
          onContentStateChange={(text) => onChange(draftToHtml(text),name || 'text')}
        />
    )
}

export default TextEditor