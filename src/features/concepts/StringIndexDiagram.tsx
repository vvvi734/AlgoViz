import type { Lang } from '../../i18n/types';

/**
 * 4.1 串类型定义的静态下标图。
 *
 * 这张图只负责三件事：字符在数组中的位置、子串的起止边界、两种下标
 * 约定（教材从 1 开始计数，代码从 0 开始计数）。它不包含播放器状态，
 * 也不替代 4.2 的存储布局图。
 */
export function StringIndexDiagram({ lang }: { lang: Lang }) {
  const L = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  const letters = ['A', 'L', 'G', 'O', 'V', 'I', 'Z'];
  const cellX = (index: number) => 150 + index * 56;

  return (
    <svg
      className="concept-svg concept-svg-wide"
      viewBox="0 0 900 400"
      role="img"
      aria-label={L('串的字符序列、下标与子串位置', 'String character sequence, indices and substring position')}
    >
      <text className="diagram-label diagram-label-strong" x="34" y="30">
        {L('串是有序的字符序列：每个格子是一个字符，下标表示位置', 'A string is an ordered character sequence: one character per cell, indices give positions')}
      </text>

      <text className="diagram-label" x="34" y="92">
        {L('主串 T', 'Text T')}
      </text>
      <text className="diagram-label" x="150" y="64">
        {L('教材位置：从 1 开始', 'Textbook position: starts at 1')}
      </text>
      {letters.map((letter, index) => (
        <g key={`text-${index}`}>
          <text className="diagram-note" x={cellX(index) + 26} y="88" textAnchor="middle">
            {index + 1}
          </text>
          <rect
            className={`diagram-cell ${index >= 2 && index <= 5 ? 'diagram-accent' : ''}`}
            x={cellX(index)}
            y="100"
            width="52"
            height="46"
            rx="4"
          />
          <text className="diagram-label diagram-label-strong" x={cellX(index) + 26} y="130" textAnchor="middle">
            {letter}
          </text>
          <text className="diagram-note" x={cellX(index) + 26} y="170" textAnchor="middle">
            {index}
          </text>
        </g>
      ))}
      <text className="diagram-note" x="150" y="196">
        {L('代码下标：从 0 开始；T[2..5] 就是子串 "GOVI"', 'Code indices start at 0; T[2..5] is the substring "GOVI"')}
      </text>
      <text className="diagram-label" x="560" y="196">
        {L('length(T) = 7', 'length(T) = 7')}
      </text>

      <path
        className="diagram-line"
        d="M 262 208 L 262 220 L 462 220 L 462 208"
        fill="none"
      />
      <text className="diagram-label" x="362" y="242" textAnchor="middle">
        {L('子串 P = "GOVI"，长度 4', 'Substring P = "GOVI", length 4')}
      </text>
      <text className="diagram-note" x="362" y="264" textAnchor="middle">
        {L('起始位置：教材第 3 位 / 代码下标 2', 'start position: textbook 3 / code index 2')}
      </text>

      <rect className="diagram-band" x="34" y="284" width="832" height="46" rx="8" />
      <text className="diagram-label" x="50" y="312">
        {L('空串 ""：长度 0，没有任何字符', 'Empty string "": length 0, no characters')}
      </text>
      <text className="diagram-label" x="380" y="312">
        {L('空格串 " "：长度 1，字符是空格', 'Blank string " ": length 1, the character is a space')}
      </text>
      <text className="diagram-note" x="684" y="312">
        {L('二者不相等', 'they are not equal')}
      </text>

      <text className="diagram-note" x="34" y="356">
        {L('取子串：SubString(T, 2, 4) = "GOVI"', 'Substring: SubString(T, 2, 4) = "GOVI"')}
      </text>
      <text className="diagram-note" x="34" y="380">
        {L('定位：Index(T, "GOVI") = 2；连接："ALGO" + "VIZ" = "ALGOVIZ"', 'Locate: Index(T, "GOVI") = 2; concat: "ALGO" + "VIZ" = "ALGOVIZ"')}
      </text>
    </svg>
  );
}
