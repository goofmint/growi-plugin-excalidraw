import { Excalidraw } from '@excalidraw/excalidraw';
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
}

export const ExcalidrawComponent = (Tag: React.FunctionComponent<any>): React.FunctionComponent<any> => {

  const onChange = (data: any) => {
    console.log(data);
  };

  return ({ children, ...props }) => {
    try {
      const { size, color, excalidraw } = JSON.parse(props.title);
      if (excalidraw) {
        console.log(children);
        return (
          <div style={{ height: '500px' }}>
            <excalidraw-component
              viewModeEnabled={true}
              isCollaborating={false}
              initialData={children}
              onChange={onChange}
              theme="dark"
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
      const value = (n.children[1] as GrowiNode).children.map(ele => ele.value).join('');
      // Render your component
      const { size } = n.attributes;
      data.hName = 'code'; // Tag name
      data.hChildren = [
        {
          type: 'text',
          value,
        },
      ];
      // Set properties
      data.hProperties = {
        title: JSON.stringify({ size, excalidraw: true }),
      };
    });
  };
};

export const rehypePlugin: Plugin = () => {
  return (tree: Node) => {
    // node type is 'element' or 'text' (2nd argument)
    visit(tree, 'text', (node: Node) => {
      const n = node as unknown as GrowiNode;
      const { value } = n;
      n.value = `${value} 😄`;
    });
  };
};
