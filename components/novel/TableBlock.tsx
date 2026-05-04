// 編集日時: 2026-05-03
"use client";

interface TableBlockProps {
  rows: string[][];
}

export function TableBlock({ rows }: TableBlockProps) {
  if (rows.length === 0) return null;

  const header = rows[0];
  const body = rows.slice(1);

  return (
    <div className="my-6 overflow-x-auto">
      <table className="w-full border-collapse font-mono text-sm">
        {/* ヘッダー行 */}
        <thead>
          <tr className="border-b border-gray-600/60 bg-gray-800/50">
            {header.map((cell, i) => (
              <th
                key={i}
                className="px-4 py-2.5 text-left text-[10px] font-medium text-gray-400 tracking-widest uppercase whitespace-nowrap border-r border-gray-700/40 last:border-r-0"
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>

        {/* データ行 */}
        <tbody>
          {body.map((row, ri) => (
            <tr
              key={ri}
              className="border-b border-gray-800/60 hover:bg-gray-800/20 transition-colors"
            >
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className="px-4 py-2 text-gray-300 text-xs leading-relaxed border-r border-gray-800/40 last:border-r-0"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
