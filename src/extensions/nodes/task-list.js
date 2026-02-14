import { Node } from "@tiptap/core";
import BulletList from "./bullet-list";

// `markdown-it-task-lists` is CommonJS. Some bundlers/dev servers may not apply
// CJS→ESM interop, so avoid a static default import and normalize at runtime.
import * as taskListsPluginModule from "markdown-it-task-lists";
const taskListPlugin = taskListsPluginModule?.default ?? taskListsPluginModule;


const TaskList = Node.create({
    name: 'taskList',
});

export default TaskList.extend({
    /**
     * @return {{markdown: MarkdownNodeSpec}}
     */
    addStorage() {
        return {
            markdown: {
                serialize: BulletList.storage.markdown.serialize,
                parse: {
                    setup(markdownit) {
                        markdownit.use(taskListPlugin);
                    },
                    updateDOM(element) {
                        [...element.querySelectorAll('.contains-task-list')]
                            .forEach(list => {
                                list.setAttribute('data-type', 'taskList');
                            });
                    },
                }
            }
        }
    }
});
