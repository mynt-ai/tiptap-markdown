// src/extensions/globalLineMapping.js
import { Extension } from '@tiptap/core';

const GlobalLineMapping = Extension.create({
  name: 'globalLineMapping',

  addGlobalAttributes() {
    return [
      {
        // Specify the node types you want to extend.
        // Adjust this array based on your needs.
        // removed: 'blockquote',
        types: ['paragraph', 'heading', 'bulletList', 'orderedList', 'codeBlock', 'listItem', 'taskItem', 'horizontalRule', 'image', 'tableRow'],
        attributes: {
          dataLineStart: {
            default: '',
            parseHTML: element => element.getAttribute('data-line-start'),
            renderHTML: attributes => {
              return attributes.dataLineStart
                ? { 'data-line-start': attributes.dataLineStart }
                : {};
            },
          },
          dataLineEnd: {
            default: '',
            parseHTML: element => element.getAttribute('data-line-end'),
            renderHTML: attributes => {
              return attributes.dataLineEnd
                ? { 'data-line-end': attributes.dataLineEnd }
                : {};
            },
          },
        },
      },
    ];
  },
});

export default GlobalLineMapping;
