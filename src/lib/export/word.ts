import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  ShadingType,
} from 'docx';
import { MeetingMinutes } from '@/types/meeting';

export async function generateWordDocument(minutes: MeetingMinutes): Promise<Buffer> {
  const { basicInfo, agenda, discussions, decisions, unresolved, opinions, actionItems, nextMeeting } = minutes;

  // 테이블 기본 스타일
  const cellPadding = { top: 120, bottom: 120, left: 160, right: 160 };
  const borderThin = {
    top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
  };

  // 1. 회의 기본 정보 테이블
  const basicInfoRows = [
    ['회의명', basicInfo.title || '회의록'],
    ['일시', basicInfo.dateTime || '미정'],
    ['장소', basicInfo.location || '미정'],
    ['참석자', basicInfo.attendees || '미정'],
    ['회의 목적', basicInfo.objective || '미정'],
  ].map(
    ([label, value]) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            margins: cellPadding,
            borders: borderThin,
            shading: { type: ShadingType.CLEAR, fill: 'F3F4F6' },
            children: [
              new Paragraph({
                children: [new TextRun({ text: label, bold: true, size: 22, font: 'Malgun Gothic' })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 75, type: WidthType.PERCENTAGE },
            margins: cellPadding,
            borders: borderThin,
            children: [
              new Paragraph({
                children: [new TextRun({ text: value, size: 22, font: 'Malgun Gothic' })],
              }),
            ],
          }),
        ],
      })
  );

  const basicInfoTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: basicInfoRows,
  });

  // 2. 실행사항(Action Items) 테이블
  const actionItemHeader = new TableRow({
    children: ['업무(내용)', '담당자', '기한', '상태'].map((title, i) => {
      const widths = [45, 20, 20, 15];
      return new TableCell({
        width: { size: widths[i], type: WidthType.PERCENTAGE },
        margins: cellPadding,
        borders: borderThin,
        shading: { type: ShadingType.CLEAR, fill: 'E5E7EB' },
        children: [
          new Paragraph({
            alignment: i === 0 ? AlignmentType.LEFT : AlignmentType.CENTER,
            children: [new TextRun({ text: title, bold: true, size: 20, font: 'Malgun Gothic' })],
          }),
        ],
      });
    }),
  });

  const actionItemRows =
    actionItems && actionItems.length > 0
      ? actionItems.map(
          (item) =>
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 45, type: WidthType.PERCENTAGE },
                  margins: cellPadding,
                  borders: borderThin,
                  children: [new Paragraph({ children: [new TextRun({ text: item.task, size: 20, font: 'Malgun Gothic' })] })],
                }),
                new TableCell({
                  width: { size: 20, type: WidthType.PERCENTAGE },
                  margins: cellPadding,
                  borders: borderThin,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: item.assignee || '미정', size: 20, font: 'Malgun Gothic' })],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 20, type: WidthType.PERCENTAGE },
                  margins: cellPadding,
                  borders: borderThin,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: item.dueDate || '미정', size: 20, font: 'Malgun Gothic' })],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 15, type: WidthType.PERCENTAGE },
                  margins: cellPadding,
                  borders: borderThin,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: item.status || '예정', size: 20, font: 'Malgun Gothic' })],
                    }),
                  ],
                }),
              ],
            })
        )
      : [
          new TableRow({
            children: [
              new TableCell({
                columnSpan: 4,
                margins: cellPadding,
                borders: borderThin,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: '등록된 실행사항이 없습니다.', size: 20, color: '666666', font: 'Malgun Gothic' })],
                  }),
                ],
              }),
            ],
          }),
        ];

  const actionItemsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [actionItemHeader, ...actionItemRows],
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
          },
        },
        children: [
          // 문서 제목
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [
              new TextRun({
                text: basicInfo.title || '회 의 록',
                bold: true,
                size: 36,
                font: 'Malgun Gothic',
              }),
            ],
          }),

          // ① 회의 기본정보
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 120 },
            children: [new TextRun({ text: '1. 회의 기본정보', bold: true, size: 26, color: '1E3A8A', font: 'Malgun Gothic' })],
          }),
          basicInfoTable,

          // ② 주요 안건
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 360, after: 120 },
            children: [new TextRun({ text: '2. 주요 안건', bold: true, size: 26, color: '1E3A8A', font: 'Malgun Gothic' })],
          }),
          ...(agenda.length > 0
            ? agenda.map(
                (item) =>
                  new Paragraph({
                    spacing: { after: 80 },
                    bullet: { level: 0 },
                    children: [new TextRun({ text: item, size: 22, font: 'Malgun Gothic' })],
                  })
              )
            : [new Paragraph({ children: [new TextRun({ text: '상정된 안건 없음', size: 22, color: '666666', font: 'Malgun Gothic' })] })]),

          // ③ 주요 논의 내용
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 360, after: 120 },
            children: [new TextRun({ text: '3. 주요 논의 내용', bold: true, size: 26, color: '1E3A8A', font: 'Malgun Gothic' })],
          }),
          ...(discussions.length > 0
            ? discussions.map(
                (d) =>
                  new Paragraph({
                    spacing: { after: 160 },
                    children: [
                      new TextRun({ text: `■ ${d.topic || `안건 ${d.agendaNumber}`}: `, bold: true, size: 22, font: 'Malgun Gothic' }),
                      new TextRun({ text: d.summary, size: 22, font: 'Malgun Gothic' }),
                    ],
                  })
              )
            : [new Paragraph({ children: [new TextRun({ text: '논의 내용 없음', size: 22, color: '666666', font: 'Malgun Gothic' })] })]),

          // ④ 결정사항
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 360, after: 120 },
            children: [new TextRun({ text: '4. 결정사항 (가결/의결)', bold: true, size: 26, color: '065F46', font: 'Malgun Gothic' })],
          }),
          ...(decisions.length > 0
            ? decisions.map(
                (dec) =>
                  new Paragraph({
                    spacing: { after: 100 },
                    bullet: { level: 0 },
                    children: [new TextRun({ text: dec, bold: true, size: 22, color: '047857', font: 'Malgun Gothic' })],
                  })
              )
            : [new Paragraph({ children: [new TextRun({ text: '결정된 사항 없음', size: 22, color: '666666', font: 'Malgun Gothic' })] })]),

          // ⑤ 미결사항
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 360, after: 120 },
            children: [new TextRun({ text: '5. 미결사항 (보류/추후 논의)', bold: true, size: 26, color: '9A3412', font: 'Malgun Gothic' })],
          }),
          ...(unresolved.length > 0
            ? unresolved.map(
                (unres) =>
                  new Paragraph({
                    spacing: { after: 100 },
                    bullet: { level: 0 },
                    children: [new TextRun({ text: unres, size: 22, color: 'C2410C', font: 'Malgun Gothic' })],
                  })
              )
            : [new Paragraph({ children: [new TextRun({ text: '미결사항 없음', size: 22, color: '666666', font: 'Malgun Gothic' })] })]),

          // ⑥ 찬반 또는 주요 의견
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 360, after: 120 },
            children: [new TextRun({ text: '6. 찬반 또는 주요 의견', bold: true, size: 26, color: '1E3A8A', font: 'Malgun Gothic' })],
          }),
          ...(opinions.length > 0
            ? opinions.map(
                (op) =>
                  new Paragraph({
                    spacing: { after: 100 },
                    bullet: { level: 0 },
                    children: [new TextRun({ text: op, size: 22, font: 'Malgun Gothic' })],
                  })
              )
            : [new Paragraph({ children: [new TextRun({ text: '특이 의견 없음', size: 22, color: '666666', font: 'Malgun Gothic' })] })]),

          // ⑦ 실행사항(Action Items)
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 360, after: 120 },
            children: [new TextRun({ text: '7. 실행사항 (Action Items)', bold: true, size: 26, color: '1E3A8A', font: 'Malgun Gothic' })],
          }),
          actionItemsTable,

          // ⑧ 다음 회의
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 360, after: 120 },
            children: [new TextRun({ text: '8. 다음 회의 일정', bold: true, size: 26, color: '1E3A8A', font: 'Malgun Gothic' })],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: '■ 일시: ', bold: true, size: 22, font: 'Malgun Gothic' }),
              new TextRun({ text: nextMeeting?.dateTime || '미정', size: 22, font: 'Malgun Gothic' }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: '■ 장소: ', bold: true, size: 22, font: 'Malgun Gothic' }),
              new TextRun({ text: nextMeeting?.location || '미정', size: 22, font: 'Malgun Gothic' }),
            ],
          }),
          ...(nextMeeting?.note
            ? [
                new Paragraph({
                  spacing: { after: 80 },
                  children: [
                    new TextRun({ text: '■ 비고: ', bold: true, size: 22, font: 'Malgun Gothic' }),
                    new TextRun({ text: nextMeeting.note, size: 22, font: 'Malgun Gothic' }),
                  ],
                }),
              ]
            : []),
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
