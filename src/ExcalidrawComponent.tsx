import { Excalidraw } from '@excalidraw/excalidraw';
import { GROWI } from '@goofmint/growi-js';
import r2wc from '@r2wc/react-to-web-component';
import { Properties } from 'hastscript';
import type { Plugin } from 'unified';
import { Node } from 'unist';
import { visit } from 'unist-util-visit';

const ExcalidrawComponentRap = r2wc(Excalidraw, {
  props: {
    viewModeEnabled: 'boolean',
    isCollaborating: 'boolean',
    initialData: 'json',
    theme: 'string',
    onChange: 'function',
  },
});
customElements.define('excalidraw-component', ExcalidrawComponentRap);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'excalidraw-component': any;
    }
  }
  interface Window {
    excalidrawOnChange: (elements: any, appState: any, files: any) => void;
    excalidrawOnSave: (data: any) => void;
  }
}

export const ExcalidrawComponent = (Tag: React.FunctionComponent<any>): React.FunctionComponent<any> => {
  return ({ children, ...props }) => {
    try {
      const {
        size, excalidraw, theme, id,
      } = JSON.parse(props.title);
      if (excalidraw) {
        let timerId: ReturnType<typeof setTimeout>;
        const editMode = window.location.hash === '#edit';
        window.excalidrawOnSave = async(data: any) => {
          if (editMode) return;
          const growi = new GROWI();
          if (data.appState && data.appState.collaborators) {
            data.appState.collaborators = [];
          }
          const page = await growi.page({ pageId: window.location.pathname.replace('/', '') });
          const contents = await page.contents();
          const regString = `^(.*)\n:::excalidraw\\[${id}\\](.*?)\n(.*?)\n:::(.*)$`;
          const match = contents.match(new RegExp(regString, 's'));
          if (!match) return;
          const newContents = `${match[1]}\n:::excalidraw[${id}]${match[2]}\n${JSON.stringify(data)}\n:::${match[4]}`;
          page.contents(newContents);
          try {
            await page.save();
          }
          catch (err) {
            // console.error(err);
          }
        };
        window.excalidrawOnChange = async(elements: object, appState: any, files: any) => {
          const data = { elements, appState, files };
          clearTimeout(timerId);
          timerId = setTimeout(window.excalidrawOnSave, 2000, data);
        };
        const data = children ? JSON.parse(children) : {};
        if (data.appState && data.appState.collaborators) {
          data.appState.collaborators = [];
        }
        return (
          <div style={{ height: size || '500px' }}>
            <excalidraw-component
              view-mode-enabled={editMode}
              is-collaborating={false}
              initial-data={JSON.stringify(data)}
              on-change='excalidrawOnChange'
              theme={theme || 'light'}
            />
          </div>
        );
      }
      // your code here
      // return <>Hello, GROWI!</>;
    }
    catch (err) {
      // console.error(err);
    }
    // Return the original component if an error occurs
    return (
      <Tag {...props}>{children}</Tag>
    );
  };
};

interface GrowiNode extends Node {
  name: string;
  data: {
    hProperties?: Properties;
    hName?: string;
    hChildren?: Node[] | { type: string, value: string, url?: string }[];
    [key: string]: any;
  };
  type: string;
  attributes: {[key: string]: string}
  children: GrowiNode[] | { type: string, name?: string, value?: string, url?: string }[];
  value: string;
  title?: string;
  url?: string;
}


export const remarkPlugin: Plugin = () => {
  return (tree: Node) => {
    // You can use 2nd argument for specific node type
    // visit(tree, 'leafDirective', (node: Node) => {
    // :plugin[xxx]{hello=growi} -> textDirective
    // ::plugin[xxx]{hello=growi} -> leafDirective
    // :::plugin[xxx]{hello=growi} -> containerDirective
    visit(tree, 'containerDirective', (node: Node) => {
      const n = node as unknown as GrowiNode;
      if (n.name !== 'excalidraw') return;
      const data = n.data || (n.data = {});
      const value = n.children[1] ? (n.children[1] as GrowiNode).children.map((ele) => {
        if (ele.type === 'text') return ele.value;
        return `:${ele.name}`;
      }).join('') : '';
      const id = n.children[0] ? (n.children[0] as GrowiNode).children[0].value : 'excalidraw';
      // Render your component
      const { size, theme } = n.attributes;
      data.hName = 'code'; // Tag name
      data.hChildren = [
        {
          type: 'text',
          value,
        },
      ];
      // Set properties
      data.hProperties = {
        title: JSON.stringify({
          size, theme, excalidraw: true, id,
        }),
      };
    });
  };
};
