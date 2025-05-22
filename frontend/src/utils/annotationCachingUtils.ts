import { TextRange, Dataset, TextRangeWithText, DatasetWithText } from '@common/annotations.ts';

function cacheTextRangeText(ranges: TextRange[], text: string): TextRangeWithText[] {
  return ranges.map(({start, end}) => ({
    start,
    end,
    text: text.substring(start, end),
  }));
}

export function cacheDatasetText(dataset: Dataset): DatasetWithText {
  const { annotations, lhsText, rhsText } = dataset;
  const annotationsWithText = {
    mappings: annotations.mappings.map(mapping => ({
      ...mapping,
      lhsRanges: cacheTextRangeText(mapping.lhsRanges, lhsText),
      rhsRanges: cacheTextRangeText(mapping.rhsRanges, rhsText),
    })),
    lhsLabels: annotations.lhsLabels.map(label => ({
      ...label,
      ranges: cacheTextRangeText(label.ranges, lhsText),
    })),
    rhsLabels: annotations.rhsLabels.map(label => ({
      ...label,
      ranges: cacheTextRangeText(label.ranges, rhsText),
    })),
  };

  return {
    ...dataset,
    annotations: annotationsWithText,
  };
}