import { CodeBlock } from 'react-code-block';
import { themes } from 'prism-react-renderer';

export default function CodeBlockComponent({ code, language }: { code: string, language: string }) {
    return (
        <CodeBlock code={code} language={language} theme={themes.oceanicNext}>
            <CodeBlock.Code className="bg-gray-900 p-6 rounded-2xl shadow-lg text-xl outline-0 outline-emerald-300/70 outline-offset-4 max-sm:scale-70 [box-shadow:0px_0px_18px_5px_rgba(94,233,181,0.9)]">
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
