import { CodeBlock } from 'react-code-block';
import { themes } from 'prism-react-renderer';

export default function CodeBlockComponent({ code, language }: { code: string, language: string }) {
    return (
        <CodeBlock code={code} language={language} theme={themes.oceanicNext}>
            <CodeBlock.Code className="bg-gray-900 p-6 rounded-xl shadow-lg text-xl outline-2 outline-emerald-300/70 outline-offset-4 max-sm:scale-70">
                <div className="table-row">
                    <CodeBlock.LineNumber className="table-cell pr-4 text-md text-gray-500 text-right select-none" />
                    <CodeBlock.LineContent className="table-cell">
                        <CodeBlock.Token />
                    </CodeBlock.LineContent>
                </div>
            </CodeBlock.Code>
        </CodeBlock>
    );
}
