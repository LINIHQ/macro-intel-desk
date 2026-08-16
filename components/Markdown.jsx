import ReactMarkdown from 'react-markdown';

export default function Markdown({ children }) {
  if (!children) return null;
  return (
    <div className="md">
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}
