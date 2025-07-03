import React from 'react';
/* eslint-disable */
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Components } from 'react-markdown';
// Add icons for copy/check
import { Copy, Check } from 'lucide-react';

interface MessageBubbleProps {
  message: string;
  isAI: boolean;
  onCopy?: () => void;
  copied?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isAI, onCopy, copied }) => {
  return (
    <div
      className={`max-w-[70%] p-4 rounded-lg shadow-md relative group ${isAI
          ? 'bg-gray-800 text-white'
          : 'bg-blue-500 text-white'
        }`}
    >
      {/* Copy button inside bubble, top-right */}
      {onCopy && (
        <button
          onClick={onCopy}
          className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-all duration-200 bg-transparent hover:bg-gray-700"
          title="Copy message"
        >
          {copied ? (
            <Check size={14} className="text-green-400" />
          ) : (
            <Copy size={14} className="text-gray-300" />
          )}
        </button>
      )}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          p: ({ children }) => <p className="mb-2">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-5 mb-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 mb-2">{children}</ol>,
          li: ({ children }) => <li className="mb-1">{children}</li>,
          h1: ({ children }) => <h1 className="text-2xl font-bold mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-semibold mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-medium mb-2">{children}</h3>,
          a: ({ href, children }) => (
            <a
              href={href as string}
              className="text-blue-400 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
        } as Components}
      >
        {message}
      </ReactMarkdown>
    </div>
  );
};

export default MessageBubble;