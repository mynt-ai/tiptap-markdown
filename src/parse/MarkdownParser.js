import markdownit from "markdown-it";
import { elementFromString, extractElement, unwrapElement } from "../util/dom";
import { getMarkdownSpec } from "../util/extensions";

export class MarkdownParser {
    /**
     * @type {import('@tiptap/core').Editor}
     */
    editor = null;
    /**
     * @type {markdownit}
     */
    md = null;

    constructor(editor, { html, linkify, breaks }) {
        this.editor = editor;
        this.md = this.withPatchedRenderer(markdownit({
            html,
            linkify,
            breaks,
        }));
    }

    parse(content, { inline } = {}) {
        if(typeof content === 'string') {
            this.editor.extensionManager.extensions.forEach(extension =>
                getMarkdownSpec(extension)?.parse?.setup?.call({ editor:this.editor, options:extension.options }, this.md)
            );

            const renderedHTML = this.md.render(content);
            const element = elementFromString(renderedHTML);

            this.editor.extensionManager.extensions.forEach(extension =>
                getMarkdownSpec(extension)?.parse?.updateDOM?.call({ editor:this.editor, options:extension.options }, element)
            );

            this.normalizeDOM(element, { inline, content });

            return element.innerHTML;
        }

        return content;
    }

    normalizeDOM(node, { inline, content }) {
        this.normalizeBlocks(node);

        // remove all \n appended by markdown-it
        node.querySelectorAll('*').forEach(el => {
            if(el.nextSibling?.nodeType === Node.TEXT_NODE && !el.closest('pre')) {
                el.nextSibling.textContent = el.nextSibling.textContent.replace(/^\n/, '');
            }
        });

        if(inline) {
            this.normalizeInline(node, content);
        }

        return node;
    }

    normalizeBlocks(node) {
        const blocks = Object.values(this.editor.schema.nodes)
            .filter(node => node.isBlock);

        const selector = blocks
            .map(block => block.spec.parseDOM?.map(spec => spec.tag))
            .flat()
            .filter(Boolean)
            .join(',');

        if(!selector) {
            return;
        }

        [...node.querySelectorAll(selector)].forEach(el => {
            if(el.parentElement.matches('p')) {
                extractElement(el);
            }
        });
    }

    normalizeInline(node, content) {
        if(node.firstElementChild?.matches('p')) {
            const firstParagraph = node.firstElementChild;
            const { nextElementSibling } = firstParagraph;
            const startSpaces = content.match(/^\s+/)?.[0] ?? '';
            const endSpaces = !nextElementSibling
                ? content.match(/\s+$/)?.[0] ?? ''
                : '';

            if(content.match(/^\n\n/)) {
                firstParagraph.innerHTML = `${firstParagraph.innerHTML}${endSpaces}`;
                return;
            }

            unwrapElement(firstParagraph);

            node.innerHTML = `${startSpaces}${node.innerHTML}${endSpaces}`;
        }
    }

    /**
     * @param {markdownit} md
     */
    withPatchedRenderer(md) {
        const withoutNewLine = (renderer) => (...args) => {
            const rendered = renderer(...args);
            if(rendered === '\n') {
                return rendered; // keep soft breaks
            }
            if(rendered[rendered.length - 1] === '\n') {
                return rendered.slice(0, -1);
            }
            return rendered;
        }


        md.renderer.rules.hardbreak = withoutNewLine(md.renderer.rules.hardbreak);
        md.renderer.rules.softbreak = withoutNewLine(md.renderer.rules.softbreak);
        md.renderer.rules.fence = withoutNewLine(md.renderer.rules.fence);
        md.renderer.rules.code_block = withoutNewLine(md.renderer.rules.code_block);
        md.renderer.renderToken = withoutNewLine(md.renderer.renderToken.bind(md.renderer));


            // Patch block-level tokens to inject line number data attributes from token.map
            const addLineDataAttrs = (tokens, idx, options, env, self) => {
            const token = tokens[idx];
            if (token.map) {
                // console.log(token.map)
                // token.map is typically an array: [startLine, endLine]
                token.attrPush(['data-line-start', token.map[0]]);
                token.attrPush(['data-line-end', token.map[1]]);
            }
            return self.renderToken(tokens, idx, options);
            };

            const addLineDataAttrsToRenderer = (renderer) => (tokens, idx, options, env, slf) => {
                const token = tokens[idx];
                if (token.map) {
                    token.attrPush(['data-line-start', token.map[0]]);
                    token.attrPush(['data-line-end', token.map[1]]);
                }
                return renderer(tokens, idx, options, env, slf);;
            }

            // Override the opening tag rules for block-level tokens
            md.renderer.rules.blockquote_open = addLineDataAttrs;
            md.renderer.rules.bullet_list_open = addLineDataAttrs;
            md.renderer.rules.paragraph_open = addLineDataAttrs;
            md.renderer.rules.heading_open = addLineDataAttrs;
            md.renderer.rules.ordered_list_open = addLineDataAttrs;
            md.renderer.rules.code_block = addLineDataAttrsToRenderer(md.renderer.rules.code_block);
            md.renderer.rules.fence = addLineDataAttrsToRenderer(md.renderer.rules.fence);     
            md.renderer.rules.image = addLineDataAttrsToRenderer(md.renderer.rules.image);     
   
            md.renderer.rules.list_item_open = addLineDataAttrs;
            // md.renderer.rules.table_open = addLineDataAttrs;
            md.renderer.rules.tbody_open = addLineDataAttrs;
            md.renderer.rules.tr_open = addLineDataAttrs;
            md.renderer.rules.hr = addLineDataAttrs;

            // Add additional block tokens as needed...


        return md;
    }
}

