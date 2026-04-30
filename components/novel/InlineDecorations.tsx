// 編集日時: 2026-04-28

export function EmText({ content }: { content: string }) {
  return (
    <span className="underline underline-offset-4 decoration-gray-400 decoration-1">
      {content}
    </span>
  );
}

export function StrongText({ content }: { content: string }) {
  return (
    <strong className="font-bold text-gray-100">{content}</strong>
  );
}
