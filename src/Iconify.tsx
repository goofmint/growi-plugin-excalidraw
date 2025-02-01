import { Properties } from 'hastscript';
import type { Plugin } from 'unified';
import { Node } from 'unist';
import { visit } from 'unist-util-visit';
import 'iconify-icon';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'iconify-icon': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { icon: string };
    }
  }
}

export const Iconify = (Tag: React.FunctionComponent<any>): React.FunctionComponent<any> => {
  return ({ children, ...props }) => {
    try {
      const { size, color, iconify } = JSON.parse(props.title);
      if (iconify) {
        return (
          <iconify-icon icon={children} style={{
            color: color || '#000',
            fontSize: `${size || 24}px`,
            verticalAlign: 'bottom',
          }} />
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
    visit(tree, 'textDirective', (node: Node) => {
      const n = node as unknown as GrowiNode;
      if (n.name !== 'icon') return;
      const data = n.data || (n.data = {});
      // Render your component
      const iconName = n.children.map(c => c.value || c.name).join(':');
      const { size, color } = n.attributes;
      data.hName = 'a'; // Tag name
      data.hChildren = [
        {
          type: 'text',
          value: iconName,
        },
      ];
      // Set properties
      data.hProperties = {
        title: JSON.stringify({ size, color, iconify: true }),
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
