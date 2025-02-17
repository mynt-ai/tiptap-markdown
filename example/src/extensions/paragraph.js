import { Node, mergeAttributes } from '@tiptap/core';
import { defaultMarkdownSerializer } from 'prosemirror-markdown';

const BaseParagraph = Node.create({
  name: 'paragraph',
  group: 'block',
  content: 'inline*',
  // (You could also add parseHTML/renderHTML here if you like the default)
});

export default BaseParagraph.extend({
    
  addAttributes() {
    return {
      dataLineStart: {
        default: '',
      },
      dataLineEnd: {
        default: '',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'p',
        getAttrs: (dom) => {
            console.log('parsing')
            return{
          dataLineStart: dom.getAttribute('data-line-start'),
          dataLineEnd: dom.getAttribute('data-line-end'),
        }},
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['p', mergeAttributes(HTMLAttributes), 0];
  },

  addStorage() {
    return {
      markdown: {
        // Use the default markdown serializer for paragraphs
        serialize: (state, node) => {
            // console.log(node)
          // Optionally, you can add your own serialization logic here.
          // For now, we're simply delegating to the default serializer.
          return defaultMarkdownSerializer.nodes.paragraph(state, node);
        },
        parse: {},
      },
    };
  },
});
